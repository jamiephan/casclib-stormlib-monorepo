#ifndef CASCLIB_FILE_H
#define CASCLIB_FILE_H

#include <napi.h>
#include "CascLib.h"

class CascFile : public Napi::ObjectWrap<CascFile> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::Object NewInstance(Napi::Env env, HANDLE hFile);
  CascFile(const Napi::CallbackInfo& info);
  ~CascFile();

private:
  static Napi::FunctionReference constructor;

  // Methods
  Napi::Value Read(const Napi::CallbackInfo& info);
  Napi::Value ReadAll(const Napi::CallbackInfo& info);
  Napi::Value GetSize(const Napi::CallbackInfo& info);
  Napi::Value GetPosition(const Napi::CallbackInfo& info);
  Napi::Value SetPosition(const Napi::CallbackInfo& info);
  Napi::Value Close(const Napi::CallbackInfo& info);

  // Member variables
  HANDLE hFile;
  bool isOpen;
};

#endif // CASCLIB_FILE_H
