#include <napi.h>
#include "archive.h"
#include "file.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  // Initialize Archive class
  MpqArchive::Init(env, exports);
  
  // Initialize File class
  MpqFile::Init(env, exports);

  return exports;
}

NODE_API_MODULE(stormlib, InitAll)
