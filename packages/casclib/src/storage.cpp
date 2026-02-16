#include "storage.h"
#include "file.h"
#include <string>

Napi::FunctionReference CascStorage::constructor;

Napi::Object CascStorage::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "Storage", {
    InstanceMethod("open", &CascStorage::Open),
    InstanceMethod("close", &CascStorage::Close),
    InstanceMethod("openFile", &CascStorage::OpenFile),
    InstanceMethod("getFileInfo", &CascStorage::GetFileInfo),
    InstanceMethod("fileExists", &CascStorage::FileExists)
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("Storage", func);
  return exports;
}

CascStorage::CascStorage(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<CascStorage>(info), hStorage(nullptr), isOpen(false) {
  Napi::Env env = info.Env();
  
  if (info.Length() > 0) {
    // Auto-open if path is provided
    Napi::Object obj = info.This().As<Napi::Object>();
    Open(info);
  }
}

CascStorage::~CascStorage() {
  if (isOpen && hStorage) {
    CascCloseStorage(hStorage);
    hStorage = nullptr;
    isOpen = false;
  }
}

Napi::Value CascStorage::Open(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected storage path as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "Storage path must be a string")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (isOpen) {
    Napi::Error::New(env, "Storage is already open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string path = info[0].As<Napi::String>().Utf8Value();
  DWORD flags = 0;

  if (info.Length() > 1 && info[1].IsNumber()) {
    flags = info[1].As<Napi::Number>().Uint32Value();
  }

  if (!CascOpenStorage(path.c_str(), flags, &hStorage)) {
    std::string error = "Failed to open CASC storage: " + path;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  isOpen = true;
  return Napi::Boolean::New(env, true);
}

Napi::Value CascStorage::Close(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen) {
    return Napi::Boolean::New(env, false);
  }

  if (hStorage) {
    CascCloseStorage(hStorage);
    hStorage = nullptr;
    isOpen = false;
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value CascStorage::OpenFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hStorage) {
    Napi::Error::New(env, "Storage is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected filename as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string filename = info[0].As<Napi::String>().Utf8Value();
  DWORD dwFlags = CASC_OPEN_BY_NAME;

  if (info.Length() > 1 && info[1].IsNumber()) {
    dwFlags = info[1].As<Napi::Number>().Uint32Value();
  }

  HANDLE hFile;
  if (!CascOpenFile(hStorage, filename.c_str(), CASC_LOCALE_ALL, dwFlags, &hFile)) {
    std::string error = "Failed to open file: " + filename;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  // Create a CascFile object
  Napi::Object fileObj = CascFile::NewInstance(env, hFile);
  return fileObj;
}

Napi::Value CascStorage::GetFileInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hStorage) {
    Napi::Error::New(env, "Storage is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected filename as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string filename = info[0].As<Napi::String>().Utf8Value();
  
  HANDLE hFile;
  if (!CascOpenFile(hStorage, filename.c_str(), CASC_LOCALE_ALL, CASC_OPEN_BY_NAME, &hFile)) {
    return env.Null();
  }

  DWORD fileSize = CascGetFileSize(hFile, nullptr);
  
  Napi::Object result = Napi::Object::New(env);
  result.Set("name", Napi::String::New(env, filename));
  result.Set("size", Napi::Number::New(env, fileSize));

  CascCloseFile(hFile);
  
  return result;
}

Napi::Value CascStorage::FileExists(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hStorage) {
    Napi::Error::New(env, "Storage is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected filename as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string filename = info[0].As<Napi::String>().Utf8Value();
  
  HANDLE hFile;
  bool exists = CascOpenFile(hStorage, filename.c_str(), CASC_LOCALE_ALL, CASC_OPEN_BY_NAME, &hFile);
  
  if (exists) {
    CascCloseFile(hFile);
  }

  return Napi::Boolean::New(env, exists);
}
