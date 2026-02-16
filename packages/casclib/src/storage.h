#ifndef CASCLIB_STORAGE_H
#define CASCLIB_STORAGE_H

#include <napi.h>
#include "CascLib.h"

class CascStorage : public Napi::ObjectWrap<CascStorage> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  CascStorage(const Napi::CallbackInfo& info);
  ~CascStorage();

private:
  static Napi::FunctionReference constructor;

  // Methods
  Napi::Value Open(const Napi::CallbackInfo& info);
  Napi::Value Close(const Napi::CallbackInfo& info);
  Napi::Value OpenFile(const Napi::CallbackInfo& info);
  Napi::Value GetFileInfo(const Napi::CallbackInfo& info);
  Napi::Value FileExists(const Napi::CallbackInfo& info);

  // Member variables
  HANDLE hStorage;
  bool isOpen;
};

#endif // CASCLIB_STORAGE_H
