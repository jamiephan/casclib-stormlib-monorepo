#include <napi.h>
#include "archive.h"
#include "file.h"
#include "StormLib.h"

static Napi::Value GetLastError(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), SErrGetLastError());
}

static Napi::Value SetLastError(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected error code as first argument")
      .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  SErrSetLastError(info[0].As<Napi::Number>().Uint32Value());
  return env.Undefined();
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  // Initialize Archive class
  MpqArchive::Init(env, exports);

  // Initialize File class
  MpqFile::Init(env, exports);

  // Error code accessors (symmetric with casclib's GetCascError/SetCascError)
  exports.Set("SErrGetLastError", Napi::Function::New(env, GetLastError));
  exports.Set("SErrSetLastError", Napi::Function::New(env, SetLastError));

  return exports;
}

NODE_API_MODULE(stormlib, InitAll)
