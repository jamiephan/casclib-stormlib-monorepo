#include <napi.h>
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

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  // Initialize Storage class
  CascStorage::Init(env, exports);
  
  // Initialize File class  
  CascFile::Init(env, exports);

  return exports;
}

NODE_API_MODULE(casclib, InitAll)
