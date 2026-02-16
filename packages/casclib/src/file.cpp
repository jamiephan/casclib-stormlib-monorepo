#include "file.h"
#include <vector>

Napi::FunctionReference CascFile::constructor;

Napi::Object CascFile::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "File", {
    InstanceMethod("read", &CascFile::Read),
    InstanceMethod("readAll", &CascFile::ReadAll),
    InstanceMethod("getSize", &CascFile::GetSize),
    InstanceMethod("getPosition", &CascFile::GetPosition),
    InstanceMethod("setPosition", &CascFile::SetPosition),
    InstanceMethod("close", &CascFile::Close)
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("File", func);
  return exports;
}

Napi::Object CascFile::NewInstance(Napi::Env env, HANDLE hFile) {
  Napi::EscapableHandleScope scope(env);
  Napi::Object obj = constructor.New({});
  CascFile* file = Napi::ObjectWrap<CascFile>::Unwrap(obj);
  file->hFile = hFile;
  file->isOpen = true;
  return scope.Escape(napi_value(obj)).ToObject();
}

CascFile::CascFile(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<CascFile>(info), hFile(nullptr), isOpen(false) {
}

CascFile::~CascFile() {
  if (isOpen && hFile) {
    CascCloseFile(hFile);
    hFile = nullptr;
    isOpen = false;
  }
}

Napi::Value CascFile::Read(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hFile) {
    Napi::Error::New(env, "File is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD bytesToRead = 4096; // Default buffer size
  if (info.Length() > 0 && info[0].IsNumber()) {
    bytesToRead = info[0].As<Napi::Number>().Uint32Value();
  }

  std::vector<uint8_t> buffer(bytesToRead);
  DWORD bytesRead = 0;

  if (!CascReadFile(hFile, buffer.data(), bytesToRead, &bytesRead)) {
    Napi::Error::New(env, "Failed to read file")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Buffer<uint8_t>::Copy(env, buffer.data(), bytesRead);
}

Napi::Value CascFile::ReadAll(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hFile) {
    Napi::Error::New(env, "File is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD fileSize = CascGetFileSize(hFile, nullptr);
  
  if (fileSize == 0) {
    return Napi::Buffer<uint8_t>::New(env, 0);
  }

  std::vector<uint8_t> buffer(fileSize);
  DWORD bytesRead = 0;

  if (!CascReadFile(hFile, buffer.data(), fileSize, &bytesRead)) {
    Napi::Error::New(env, "Failed to read file")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Buffer<uint8_t>::Copy(env, buffer.data(), bytesRead);
}

Napi::Value CascFile::GetSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hFile) {
    Napi::Error::New(env, "File is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD fileSize = CascGetFileSize(hFile, nullptr);
  return Napi::Number::New(env, fileSize);
}

Napi::Value CascFile::GetPosition(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hFile) {
    Napi::Error::New(env, "File is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  LONG distanceToMove = 0;
  DWORD position = CascSetFilePointer(hFile, distanceToMove, nullptr, FILE_CURRENT);
  
  return Napi::Number::New(env, position);
}

Napi::Value CascFile::SetPosition(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hFile) {
    Napi::Error::New(env, "File is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected position as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  LONG position = info[0].As<Napi::Number>().Int32Value();
  DWORD newPosition = CascSetFilePointer(hFile, position, nullptr, FILE_BEGIN);

  return Napi::Number::New(env, newPosition);
}

Napi::Value CascFile::Close(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen) {
    return Napi::Boolean::New(env, false);
  }

  if (hFile) {
    CascCloseFile(hFile);
    hFile = nullptr;
    isOpen = false;
  }

  return Napi::Boolean::New(env, true);
}
