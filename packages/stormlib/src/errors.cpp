#include "errors.h"
#include "StormLib.h"
#include "StormPort.h"
#include <errno.h>
#include <string.h>

std::string FormatStormError() {
  DWORD code = SErrGetLastError();
  const char* name = "UNKNOWN";
  switch (code) {
    case ERROR_SUCCESS:               name = "ERROR_SUCCESS"; break;
    case ERROR_FILE_NOT_FOUND:        name = "ERROR_FILE_NOT_FOUND"; break;
    case ERROR_ACCESS_DENIED:         name = "ERROR_ACCESS_DENIED"; break;
    case ERROR_INVALID_HANDLE:        name = "ERROR_INVALID_HANDLE"; break;
    case ERROR_NOT_ENOUGH_MEMORY:     name = "ERROR_NOT_ENOUGH_MEMORY"; break;
    case ERROR_NOT_SUPPORTED:         name = "ERROR_NOT_SUPPORTED"; break;
    case ERROR_INVALID_PARAMETER:     name = "ERROR_INVALID_PARAMETER"; break;
    case ERROR_NEGATIVE_SEEK:         name = "ERROR_NEGATIVE_SEEK"; break;
    case ERROR_DISK_FULL:             name = "ERROR_DISK_FULL"; break;
    case ERROR_ALREADY_EXISTS:        name = "ERROR_ALREADY_EXISTS"; break;
    case ERROR_INSUFFICIENT_BUFFER:   name = "ERROR_INSUFFICIENT_BUFFER"; break;
    case ERROR_BAD_FORMAT:            name = "ERROR_BAD_FORMAT"; break;
    case ERROR_NO_MORE_FILES:         name = "ERROR_NO_MORE_FILES"; break;
    case ERROR_HANDLE_EOF:            name = "ERROR_HANDLE_EOF"; break;
    case ERROR_CAN_NOT_COMPLETE:      name = "ERROR_CAN_NOT_COMPLETE"; break;
    case ERROR_FILE_CORRUPT:          name = "ERROR_FILE_CORRUPT"; break;
  }
  return " (StormError=" + std::to_string(code) + " " + name +
         ", errno=" + std::to_string(errno) + " " + strerror(errno) + ")";
}
