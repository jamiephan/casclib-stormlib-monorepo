#ifndef STORMLIB_ARCHIVE_H
#define STORMLIB_ARCHIVE_H

#include <napi.h>
#include "StormLib.h"

class MpqArchive : public Napi::ObjectWrap<MpqArchive> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  MpqArchive(const Napi::CallbackInfo& info);
  ~MpqArchive();

private:
  static Napi::FunctionReference constructor;

  // Methods
  Napi::Value Open(const Napi::CallbackInfo& info);
  Napi::Value Create(const Napi::CallbackInfo& info);
  Napi::Value Close(const Napi::CallbackInfo& info);
  Napi::Value OpenFile(const Napi::CallbackInfo& info);
  Napi::Value HasFile(const Napi::CallbackInfo& info);
  Napi::Value ExtractFile(const Napi::CallbackInfo& info);
  Napi::Value AddFile(const Napi::CallbackInfo& info);
  Napi::Value RemoveFile(const Napi::CallbackInfo& info);
  Napi::Value RenameFile(const Napi::CallbackInfo& info);
  Napi::Value Compact(const Napi::CallbackInfo& info);
  Napi::Value GetMaxFileCount(const Napi::CallbackInfo& info);

  // Member variables
  HANDLE hMpq;
  bool isOpen;
};

#endif // STORMLIB_ARCHIVE_H
