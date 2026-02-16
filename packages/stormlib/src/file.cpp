#include "file.h"
#include <vector>

Napi::FunctionReference MpqFile::constructor;

Napi::Object MpqFile::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "File", {
    InstanceMethod("read", &MpqFile::Read),
    InstanceMethod("readAll", &MpqFile::ReadAll),
    InstanceMethod("getSize", &MpqFile::GetSize),
    InstanceMethod("getPosition", &MpqFile::GetPosition),
    InstanceMethod("setPosition", &MpqFile::SetPosition),
    InstanceMethod("close", &MpqFile::Close)
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("File", func);
  return exports;
}

Napi::Object MpqFile::NewInstance(Napi::Env env, HANDLE hFile) {
  Napi::EscapableHandleScope scope(env);
  Napi::Object obj = constructor.New({});
  MpqFile* file = Napi::ObjectWrap<MpqFile>::Unwrap(obj);
  file->hFile = hFile;
  file->isOpen = true;
  return scope.Escape(napi_value(obj)).ToObject();
}

MpqFile::MpqFile(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<MpqFile>(info), hFile(nullptr), isOpen(false) {
}

MpqFile::~MpqFile() {
  if (isOpen && hFile) {
    SFileCloseFile(hFile);
    hFile = nullptr;
    isOpen = false;
  }
}

Napi::Value MpqFile::Read(const Napi::CallbackInfo& info) {
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

  if (!SFileReadFile(hFile, buffer.data(), bytesToRead, &bytesRead, nullptr)) {
    Napi::Error::New(env, "Failed to read file")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Buffer<uint8_t>::Copy(env, buffer.data(), bytesRead);
}

Napi::Value MpqFile::ReadAll(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hFile) {
    Napi::Error::New(env, "File is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD fileSize = SFileGetFileSize(hFile, nullptr);
  
  if (fileSize == 0 || fileSize == SFILE_INVALID_SIZE) {
    return Napi::Buffer<uint8_t>::New(env, 0);
  }

  std::vector<uint8_t> buffer(fileSize);
  DWORD bytesRead = 0;

  if (!SFileReadFile(hFile, buffer.data(), fileSize, &bytesRead, nullptr)) {
    Napi::Error::New(env, "Failed to read file")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Buffer<uint8_t>::Copy(env, buffer.data(), bytesRead);
}

Napi::Value MpqFile::GetSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hFile) {
    Napi::Error::New(env, "File is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD fileSize = SFileGetFileSize(hFile, nullptr);
  return Napi::Number::New(env, fileSize);
}

Napi::Value MpqFile::GetPosition(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hFile) {
    Napi::Error::New(env, "File is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  LONG distanceToMove = 0;
  DWORD position = SFileSetFilePointer(hFile, distanceToMove, nullptr, FILE_CURRENT);
  
  return Napi::Number::New(env, position);
}

Napi::Value MpqFile::SetPosition(const Napi::CallbackInfo& info) {
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
  DWORD newPosition = SFileSetFilePointer(hFile, position, nullptr, FILE_BEGIN);

  return Napi::Number::New(env, newPosition);
}

Napi::Value MpqFile::Close(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen) {
    return Napi::Boolean::New(env, false);
  }

  if (hFile) {
    SFileCloseFile(hFile);
    hFile = nullptr;
    isOpen = false;
  }

  return Napi::Boolean::New(env, true);
}
