#include <napi.h>
#include <string>
#include "storage.h"
#include "file.h"
#include "CascLib.h"
#include "CascCommon.h"

// Stub for Overwatch support (not included in this build)
DWORD RootHandler_CreateOverwatch(TCascStorage * hs, CASC_BLOB & RootFile)
{
  // Return ERROR_NOT_SUPPORTED for Overwatch archives
  return ERROR_NOT_SUPPORTED;
}

// Wrapper for CascOpenLocalFile
Napi::Value OpenLocalFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

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
  if (!CascOpenLocalFile(filename.c_str(), flags, &hFile)) {
    std::string error = "Failed to open local file: " + filename;
    Napi::Error::New(env, error).ThrowAsJavaScriptException();
    return env.Null();
  }

  return CascFile::NewInstance(env, hFile);
}

// Wrapper for GetCascError
Napi::Value GetError(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  DWORD error = GetCascError();
  return Napi::Number::New(env, error);
}

// Wrapper for SetCascError
Napi::Value SetError(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected error code as first argument")
      .ThrowAsJavaScriptException();
    return env.Undefined();
  }

  DWORD error = info[0].As<Napi::Number>().Uint32Value();
  SetCascError(error);

  return env.Undefined();
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  // Initialize Storage class
  CascStorage::Init(env, exports);
  
  // Initialize File class  
  CascFile::Init(env, exports);

  // Export utility functions
  exports.Set("openLocalFile", Napi::Function::New(env, OpenLocalFile));
  exports.Set("getError", Napi::Function::New(env, GetError));
  exports.Set("setError", Napi::Function::New(env, SetError));

  // Export constants - Open flags
  exports.Set("CASC_OPEN_BY_NAME", Napi::Number::New(env, CASC_OPEN_BY_NAME));
  exports.Set("CASC_OPEN_BY_CKEY", Napi::Number::New(env, CASC_OPEN_BY_CKEY));
  exports.Set("CASC_OPEN_BY_EKEY", Napi::Number::New(env, CASC_OPEN_BY_EKEY));
  exports.Set("CASC_OPEN_BY_FILEID", Napi::Number::New(env, CASC_OPEN_BY_FILEID));
  exports.Set("CASC_STRICT_DATA_CHECK", Napi::Number::New(env, CASC_STRICT_DATA_CHECK));
  exports.Set("CASC_OVERCOME_ENCRYPTED", Napi::Number::New(env, CASC_OVERCOME_ENCRYPTED));

  // Export constants - Locale flags
  exports.Set("CASC_LOCALE_ALL", Napi::Number::New(env, CASC_LOCALE_ALL));
  exports.Set("CASC_LOCALE_NONE", Napi::Number::New(env, CASC_LOCALE_NONE));
  exports.Set("CASC_LOCALE_ENUS", Napi::Number::New(env, CASC_LOCALE_ENUS));
  exports.Set("CASC_LOCALE_KOKR", Napi::Number::New(env, CASC_LOCALE_KOKR));
  exports.Set("CASC_LOCALE_FRFR", Napi::Number::New(env, CASC_LOCALE_FRFR));
  exports.Set("CASC_LOCALE_DEDE", Napi::Number::New(env, CASC_LOCALE_DEDE));
  exports.Set("CASC_LOCALE_ZHCN", Napi::Number::New(env, CASC_LOCALE_ZHCN));
  exports.Set("CASC_LOCALE_ESES", Napi::Number::New(env, CASC_LOCALE_ESES));
  exports.Set("CASC_LOCALE_ZHTW", Napi::Number::New(env, CASC_LOCALE_ZHTW));
  exports.Set("CASC_LOCALE_ENGB", Napi::Number::New(env, CASC_LOCALE_ENGB));

  // Export constants - Content flags
  exports.Set("CASC_CFLAG_INSTALL", Napi::Number::New(env, CASC_CFLAG_INSTALL));
  exports.Set("CASC_CFLAG_LOAD_ON_WINDOWS", Napi::Number::New(env, CASC_CFLAG_LOAD_ON_WINDOWS));
  exports.Set("CASC_CFLAG_LOAD_ON_MAC", Napi::Number::New(env, CASC_CFLAG_LOAD_ON_MAC));
  exports.Set("CASC_CFLAG_X86_32", Napi::Number::New(env, CASC_CFLAG_X86_32));
  exports.Set("CASC_CFLAG_X86_64", Napi::Number::New(env, CASC_CFLAG_X86_64));
  exports.Set("CASC_CFLAG_ENCRYPTED", Napi::Number::New(env, CASC_CFLAG_ENCRYPTED));

  // Export constants - Storage info classes
  exports.Set("CascStorageLocalFileCount", Napi::Number::New(env, CascStorageLocalFileCount));
  exports.Set("CascStorageTotalFileCount", Napi::Number::New(env, CascStorageTotalFileCount));
  exports.Set("CascStorageFeatures", Napi::Number::New(env, CascStorageFeatures));
  exports.Set("CascStorageProduct", Napi::Number::New(env, CascStorageProduct));

  // Export constants - File info classes
  exports.Set("CascFileContentKey", Napi::Number::New(env, CascFileContentKey));
  exports.Set("CascFileEncodedKey", Napi::Number::New(env, CascFileEncodedKey));
  exports.Set("CascFileFullInfo", Napi::Number::New(env, CascFileFullInfo));

  // Export constants - Feature flags
  exports.Set("CASC_FEATURE_FILE_NAMES", Napi::Number::New(env, CASC_FEATURE_FILE_NAMES));
  exports.Set("CASC_FEATURE_ROOT_CKEY", Napi::Number::New(env, CASC_FEATURE_ROOT_CKEY));
  exports.Set("CASC_FEATURE_TAGS", Napi::Number::New(env, CASC_FEATURE_TAGS));
  exports.Set("CASC_FEATURE_FILE_DATA_IDS", Napi::Number::New(env, CASC_FEATURE_FILE_DATA_IDS));
  exports.Set("CASC_FEATURE_LOCALE_FLAGS", Napi::Number::New(env, CASC_FEATURE_LOCALE_FLAGS));
  exports.Set("CASC_FEATURE_CONTENT_FLAGS", Napi::Number::New(env, CASC_FEATURE_CONTENT_FLAGS));
  exports.Set("CASC_FEATURE_ONLINE", Napi::Number::New(env, CASC_FEATURE_ONLINE));

  return exports;
}

NODE_API_MODULE(casclib, InitAll)
