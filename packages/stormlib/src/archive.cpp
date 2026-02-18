#include "archive.h"
#include "file.h"
#include <string>

Napi::FunctionReference MpqArchive::constructor;

Napi::Object MpqArchive::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "Archive", {
    InstanceMethod("SFileOpenArchive", &MpqArchive::Open),
    InstanceMethod("SFileCreateArchive", &MpqArchive::Create),
    InstanceMethod("SFileCloseArchive", &MpqArchive::Close),
    InstanceMethod("SFileFlushArchive", &MpqArchive::Flush),
    InstanceMethod("SFileCompactArchive", &MpqArchive::Compact),
    InstanceMethod("SFileOpenFileEx", &MpqArchive::OpenFile),
    InstanceMethod("SFileHasFile", &MpqArchive::HasFile),
    InstanceMethod("SFileExtractFile", &MpqArchive::ExtractFile),
    InstanceMethod("SFileAddFile", &MpqArchive::AddFile),
    InstanceMethod("SFileAddFileEx", &MpqArchive::AddFileEx),
    InstanceMethod("SFileRemoveFile", &MpqArchive::RemoveFile),
    InstanceMethod("SFileRenameFile", &MpqArchive::RenameFile),
    InstanceMethod("SFileGetMaxFileCount", &MpqArchive::GetMaxFileCount),
    InstanceMethod("SFileSetMaxFileCount", &MpqArchive::SetMaxFileCount),
    InstanceMethod("SFileGetAttributes", &MpqArchive::GetAttributes),
    InstanceMethod("SFileSetAttributes", &MpqArchive::SetAttributes),
    InstanceMethod("SFileVerifyFile", &MpqArchive::VerifyFile),
    InstanceMethod("SFileVerifyArchive", &MpqArchive::VerifyArchive),
    StaticMethod("SFileGetLocale", &MpqArchive::GetLocale),
    StaticMethod("SFileSetLocale", &MpqArchive::SetLocale)
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("Archive", func);
  return exports;
}

MpqArchive::MpqArchive(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<MpqArchive>(info), hMpq(nullptr), isOpen(false) {
  Napi::Env env = info.Env();
  
  if (info.Length() > 0 && info[0].IsString()) {
    // Auto-open if path is provided
    Open(info);
  }
}

MpqArchive::~MpqArchive() {
  if (isOpen && hMpq) {
    SFileCloseArchive(hMpq);
    hMpq = nullptr;
    isOpen = false;
  }
}

Napi::Value MpqArchive::Open(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected archive path as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (isOpen) {
    Napi::Error::New(env, "Archive is already open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string path = info[0].As<Napi::String>().Utf8Value();
  DWORD flags = 0;

  if (info.Length() > 1 && info[1].IsNumber()) {
    flags = info[1].As<Napi::Number>().Uint32Value();
  }

  if (!SFileOpenArchive(path.c_str(), 0, flags, &hMpq)) {
    std::string error = "Failed to open MPQ archive: " + path;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  isOpen = true;
  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::Create(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected archive path as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (isOpen) {
    Napi::Error::New(env, "Archive is already open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string path = info[0].As<Napi::String>().Utf8Value();
  DWORD flags = 0;
  DWORD maxFileCount = 1000;

  if (info.Length() > 1 && info[1].IsNumber()) {
    maxFileCount = info[1].As<Napi::Number>().Uint32Value();
  }

  if (info.Length() > 2 && info[2].IsNumber()) {
    flags = info[2].As<Napi::Number>().Uint32Value();
  }

  if (!SFileCreateArchive(path.c_str(), flags, maxFileCount, &hMpq)) {
    std::string error = "Failed to create MPQ archive: " + path;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  isOpen = true;
  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::Close(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen) {
    return Napi::Boolean::New(env, false);
  }

  if (hMpq) {
    SFileCloseArchive(hMpq);
    hMpq = nullptr;
    isOpen = false;
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::OpenFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected filename as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string filename = info[0].As<Napi::String>().Utf8Value();
  DWORD flags = 0;

  if (info.Length() > 1 && info[1].IsNumber()) {
    flags = info[1].As<Napi::Number>().Uint32Value();
  }

  HANDLE hFile;
  if (!SFileOpenFileEx(hMpq, filename.c_str(), flags, &hFile)) {
    std::string error = "Failed to open file: " + filename;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  // Create an MpqFile object
  Napi::Object fileObj = MpqFile::NewInstance(env, hFile);
  return fileObj;
}

Napi::Value MpqArchive::HasFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected filename as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string filename = info[0].As<Napi::String>().Utf8Value();
  bool exists = SFileHasFile(hMpq, filename.c_str());

  return Napi::Boolean::New(env, exists);
}

Napi::Value MpqArchive::ExtractFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Expected source and destination paths")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string source = info[0].As<Napi::String>().Utf8Value();
  std::string dest = info[1].As<Napi::String>().Utf8Value();

  if (!SFileExtractFile(hMpq, source.c_str(), dest.c_str(), 0)) {
    std::string error = "Failed to extract file: " + source;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::AddFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Expected source path and archive name")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string source = info[0].As<Napi::String>().Utf8Value();
  std::string archiveName = info[1].As<Napi::String>().Utf8Value();
  DWORD flags = MPQ_FILE_COMPRESS | MPQ_FILE_ENCRYPTED;

  if (info.Length() > 2 && info[2].IsNumber()) {
    flags = info[2].As<Napi::Number>().Uint32Value();
  }

  if (!SFileAddFileEx(hMpq, source.c_str(), archiveName.c_str(), flags, MPQ_COMPRESSION_ZLIB, MPQ_COMPRESSION_ZLIB)) {
    std::string error = "Failed to add file: " + source;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::RemoveFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected filename as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string filename = info[0].As<Napi::String>().Utf8Value();

  if (!SFileRemoveFile(hMpq, filename.c_str(), 0)) {
    std::string error = "Failed to remove file: " + filename;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::RenameFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Expected old and new filenames")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string oldName = info[0].As<Napi::String>().Utf8Value();
  std::string newName = info[1].As<Napi::String>().Utf8Value();

  if (!SFileRenameFile(hMpq, oldName.c_str(), newName.c_str())) {
    std::string error = "Failed to rename file: " + oldName;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::Compact(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!SFileCompactArchive(hMpq, nullptr, 0)) {
    Napi::Error::New(env, "Failed to compact archive")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::GetMaxFileCount(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD maxFileCount = 0;
  SFileGetFileInfo(hMpq, SFileMpqHashTableSize, &maxFileCount, sizeof(maxFileCount), nullptr);

  return Napi::Number::New(env, maxFileCount);
}

Napi::Value MpqArchive::Flush(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!SFileFlushArchive(hMpq)) {
    Napi::Error::New(env, "Failed to flush archive")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::SetMaxFileCount(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected max file count as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD maxFileCount = info[0].As<Napi::Number>().Uint32Value();

  if (!SFileSetMaxFileCount(hMpq, maxFileCount)) {
    Napi::Error::New(env, "Failed to set max file count")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::GetAttributes(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD attributes = SFileGetAttributes(hMpq);
  return Napi::Number::New(env, attributes);
}

Napi::Value MpqArchive::SetAttributes(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected attributes flags as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD attributes = info[0].As<Napi::Number>().Uint32Value();

  if (!SFileSetAttributes(hMpq, attributes)) {
    Napi::Error::New(env, "Failed to set attributes")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::AddFileEx(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Expected source path and archive name")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string source = info[0].As<Napi::String>().Utf8Value();
  std::string archiveName = info[1].As<Napi::String>().Utf8Value();
  DWORD flags = MPQ_FILE_COMPRESS | MPQ_FILE_ENCRYPTED;
  DWORD compression = MPQ_COMPRESSION_ZLIB;
  DWORD compressionNext = MPQ_COMPRESSION_ZLIB;

  if (info.Length() > 2 && info[2].IsNumber()) {
    flags = info[2].As<Napi::Number>().Uint32Value();
  }

  if (info.Length() > 3 && info[3].IsNumber()) {
    compression = info[3].As<Napi::Number>().Uint32Value();
  }

  if (info.Length() > 4 && info[4].IsNumber()) {
    compressionNext = info[4].As<Napi::Number>().Uint32Value();
  }

  if (!SFileAddFileEx(hMpq, source.c_str(), archiveName.c_str(), flags, compression, compressionNext)) {
    std::string error = "Failed to add file: " + source;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::VerifyFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected filename as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string filename = info[0].As<Napi::String>().Utf8Value();
  DWORD flags = 0x0000000F; // SFILE_VERIFY_ALL

  if (info.Length() > 1 && info[1].IsNumber()) {
    flags = info[1].As<Napi::Number>().Uint32Value();
  }

  DWORD result = SFileVerifyFile(hMpq, filename.c_str(), flags);
  return Napi::Number::New(env, result);
}

Napi::Value MpqArchive::VerifyArchive(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD result = SFileVerifyArchive(hMpq);
  return Napi::Number::New(env, result);
}

Napi::Value MpqArchive::GetLocale(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  LCID locale = SFileGetLocale();
  return Napi::Number::New(env, locale);
}

Napi::Value MpqArchive::SetLocale(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected locale as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  LCID newLocale = info[0].As<Napi::Number>().Uint32Value();
  LCID oldLocale = SFileSetLocale(newLocale);
  return Napi::Number::New(env, oldLocale);
}
