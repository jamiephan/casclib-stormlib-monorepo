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
    InstanceMethod("SFileSignArchive", &MpqArchive::SignArchive),
    InstanceMethod("SFileGetFileChecksums", &MpqArchive::GetFileChecksums),
    InstanceMethod("SFileAddListFile", &MpqArchive::AddListFile),
    InstanceMethod("SFileOpenPatchArchive", &MpqArchive::OpenPatchArchive),
    InstanceMethod("SFileIsPatchedArchive", &MpqArchive::IsPatchedArchive),
    InstanceMethod("SFileFindFirstFile", &MpqArchive::FindFirstFile),
    InstanceMethod("SFileEnumLocales", &MpqArchive::EnumLocales),
    InstanceMethod("SFileCreateFile", &MpqArchive::CreateFile),
    InstanceMethod("SFileAddWave", &MpqArchive::AddWave),
    InstanceMethod("SFileUpdateFileAttributes", &MpqArchive::UpdateFileAttributes),
    InstanceMethod("SFileGetFileInfo", &MpqArchive::GetFileInfo),
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

Napi::Value MpqArchive::SignArchive(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  DWORD signatureType = 0; // Default signature type
  if (info.Length() > 0 && info[0].IsNumber()) {
    signatureType = info[0].As<Napi::Number>().Uint32Value();
  }

  if (!SFileSignArchive(hMpq, signatureType)) {
    Napi::Error::New(env, "Failed to sign archive")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::GetFileChecksums(const Napi::CallbackInfo& info) {
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
  DWORD crc32 = 0;
  char md5[33] = {0}; // 32 chars + null terminator

  if (!SFileGetFileChecksums(hMpq, filename.c_str(), &crc32, md5)) {
    Napi::Error::New(env, "Failed to get file checksums")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Object result = Napi::Object::New(env);
  result.Set("crc32", Napi::Number::New(env, crc32));
  result.Set("md5", Napi::String::New(env, md5));
  return result;
}

Napi::Value MpqArchive::AddListFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected listfile path as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string listfile = info[0].As<Napi::String>().Utf8Value();
  DWORD result = SFileAddListFile(hMpq, listfile.c_str());
  
  return Napi::Number::New(env, result);
}

Napi::Value MpqArchive::OpenPatchArchive(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected patch archive path as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string patchPath = info[0].As<Napi::String>().Utf8Value();
  std::string patchPrefix = "";
  DWORD flags = 0;

  if (info.Length() > 1 && info[1].IsString()) {
    patchPrefix = info[1].As<Napi::String>().Utf8Value();
  }

  if (info.Length() > 2 && info[2].IsNumber()) {
    flags = info[2].As<Napi::Number>().Uint32Value();
  }

  if (!SFileOpenPatchArchive(hMpq, patchPath.c_str(), 
                             patchPrefix.empty() ? nullptr : patchPrefix.c_str(), 
                             flags)) {
    Napi::Error::New(env, "Failed to open patch archive")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::IsPatchedArchive(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  bool isPatched = SFileIsPatchedArchive(hMpq);
  return Napi::Boolean::New(env, isPatched);
}

Napi::Value MpqArchive::FindFirstFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string mask = "*";
  if (info.Length() > 0 && info[0].IsString()) {
    mask = info[0].As<Napi::String>().Utf8Value();
  }

  SFILE_FIND_DATA findData;
  HANDLE hFind = SFileFindFirstFile(hMpq, mask.c_str(), &findData, nullptr);

  if (!hFind || hFind == INVALID_HANDLE_VALUE) {
    return env.Null();
  }

  Napi::Array results = Napi::Array::New(env);
  uint32_t index = 0;

  do {
    Napi::Object fileInfo = Napi::Object::New(env);
    fileInfo.Set("name", Napi::String::New(env, findData.cFileName));
    fileInfo.Set("plainName", Napi::String::New(env, findData.szPlainName));
    fileInfo.Set("hashIndex", Napi::Number::New(env, findData.dwHashIndex));
    fileInfo.Set("blockIndex", Napi::Number::New(env, findData.dwBlockIndex));
    fileInfo.Set("fileSize", Napi::Number::New(env, findData.dwFileSize));
    fileInfo.Set("fileFlags", Napi::Number::New(env, findData.dwFileFlags));
    fileInfo.Set("compSize", Napi::Number::New(env, findData.dwCompSize));
    fileInfo.Set("fileTimeLo", Napi::Number::New(env, findData.dwFileTimeLo));
    fileInfo.Set("fileTimeHi", Napi::Number::New(env, findData.dwFileTimeHi));
    fileInfo.Set("locale", Napi::Number::New(env, findData.lcLocale));
    
    results.Set(index++, fileInfo);
  } while (SFileFindNextFile(hFind, &findData));

  SFileFindClose(hFind);
  return results;
}

Napi::Value MpqArchive::EnumLocales(const Napi::CallbackInfo& info) {
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
  LCID locales[256];
  DWORD maxLocales = 256;
  DWORD searchScope = 0;

  if (info.Length() > 1 && info[1].IsNumber()) {
    searchScope = info[1].As<Napi::Number>().Uint32Value();
  }

  DWORD result = SFileEnumLocales(hMpq, filename.c_str(), locales, &maxLocales, searchScope);
  
  if (result != ERROR_SUCCESS) {
    Napi::Error::New(env, "Failed to enumerate locales")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Array localeArray = Napi::Array::New(env, maxLocales);
  for (DWORD i = 0; i < maxLocales; i++) {
    localeArray.Set(i, Napi::Number::New(env, locales[i]));
  }

  return localeArray;
}

Napi::Value MpqArchive::CreateFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 3 || !info[0].IsString() || !info[1].IsNumber() || !info[2].IsNumber()) {
    Napi::TypeError::New(env, "Expected filename, file time, and file size")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string filename = info[0].As<Napi::String>().Utf8Value();
  ULONGLONG fileTime = info[1].As<Napi::Number>().Int64Value();
  DWORD fileSize = info[2].As<Napi::Number>().Uint32Value();
  LCID locale = 0;
  DWORD flags = MPQ_FILE_COMPRESS | MPQ_FILE_ENCRYPTED;

  if (info.Length() > 3 && info[3].IsNumber()) {
    locale = info[3].As<Napi::Number>().Uint32Value();
  }

  if (info.Length() > 4 && info[4].IsNumber()) {
    flags = info[4].As<Napi::Number>().Uint32Value();
  }

  HANDLE hFile;
  if (!SFileCreateFile(hMpq, filename.c_str(), fileTime, fileSize, locale, flags, &hFile)) {
    Napi::Error::New(env, "Failed to create file in archive")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  // Create an MpqFile object
  Napi::Object fileObj = MpqFile::NewInstance(env, hFile);
  return fileObj;
}

Napi::Value MpqArchive::AddWave(const Napi::CallbackInfo& info) {
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
  DWORD quality = 1; // Default quality

  if (info.Length() > 2 && info[2].IsNumber()) {
    flags = info[2].As<Napi::Number>().Uint32Value();
  }

  if (info.Length() > 3 && info[3].IsNumber()) {
    quality = info[3].As<Napi::Number>().Uint32Value();
  }

  if (!SFileAddWave(hMpq, source.c_str(), archiveName.c_str(), flags, quality)) {
    std::string error = "Failed to add wave file: " + source;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::UpdateFileAttributes(const Napi::CallbackInfo& info) {
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

  if (!SFileUpdateFileAttributes(hMpq, filename.c_str())) {
    Napi::Error::New(env, "Failed to update file attributes")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Boolean::New(env, true);
}

Napi::Value MpqArchive::GetFileInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!isOpen || !hMpq) {
    Napi::Error::New(env, "Archive is not open")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected info class as first argument")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  SFileInfoClass infoClass = (SFileInfoClass)info[0].As<Napi::Number>().Uint32Value();
  DWORD lengthNeeded = 0;

  // First call to get size needed
  SFileGetFileInfo(hMpq, infoClass, nullptr, 0, &lengthNeeded);

  if (lengthNeeded == 0) {
    return env.Null();
  }

  // Allocate buffer and get info
  std::vector<uint8_t> buffer(lengthNeeded);
  if (!SFileGetFileInfo(hMpq, infoClass, buffer.data(), lengthNeeded, nullptr)) {
    Napi::Error::New(env, "Failed to get file info")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::Buffer<uint8_t>::Copy(env, buffer.data(), lengthNeeded);
}

