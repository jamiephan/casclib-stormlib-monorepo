{
  "variables": {
    # Monorepo checkout: ../../thirdparty/CascLib (git submodule).
    # Published package: deps/CascLib (vendored by the prepack script).
    "lib_root": "<!(node -p \"require('fs').existsSync('../../thirdparty/CascLib/src/CascLib.h') ? '../../thirdparty/CascLib' : 'deps/CascLib'\")"
  },
  "targets": [
    {
      "target_name": "casclib",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "sources": [
        "src/addon.cpp",
        "src/storage.cpp",
        "src/file.cpp",
        "src/errors.cpp",
        "<(lib_root)/src/CascDecompress.cpp",
        "<(lib_root)/src/CascDecrypt.cpp",
        "<(lib_root)/src/CascDumpData.cpp",
        "<(lib_root)/src/CascFiles.cpp",
        "<(lib_root)/src/CascFindFile.cpp",
        "<(lib_root)/src/CascIndexFiles.cpp",
        "<(lib_root)/src/CascOpenFile.cpp",
        "<(lib_root)/src/CascOpenStorage.cpp",
        "<(lib_root)/src/CascReadFile.cpp",
        "<(lib_root)/src/CascRootFile_Diablo3.cpp",
        "<(lib_root)/src/CascRootFile_Install.cpp",
        "<(lib_root)/src/CascRootFile_MNDX.cpp",
        "<(lib_root)/src/CascRootFile_Text.cpp",
        "<(lib_root)/src/CascRootFile_TVFS.cpp",
        "<(lib_root)/src/CascRootFile_WoW.cpp",
        "<(lib_root)/src/common/Common.cpp",
        "<(lib_root)/src/common/Csv.cpp",
        "<(lib_root)/src/common/Directory.cpp",
        "<(lib_root)/src/common/FileStream.cpp",
        "<(lib_root)/src/common/FileTree.cpp",
        "<(lib_root)/src/common/ListFile.cpp",
        "<(lib_root)/src/common/Mime.cpp",
        "<(lib_root)/src/common/RootHandler.cpp",
        "<(lib_root)/src/common/Sockets.cpp",
        "<(lib_root)/src/jenkins/lookup3.c",
        "<(lib_root)/src/hashes/md5.cpp",
        "<(lib_root)/src/hashes/sha1.cpp",
        "<(lib_root)/src/zlib/adler32.c",
        "<(lib_root)/src/zlib/crc32.c",
        "<(lib_root)/src/zlib/deflate.c",
        "<(lib_root)/src/zlib/inffast.c",
        "<(lib_root)/src/zlib/inflate.c",
        "<(lib_root)/src/zlib/inftrees.c",
        "<(lib_root)/src/zlib/trees.c",
        "<(lib_root)/src/zlib/zutil.c"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<(lib_root)/src"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "CASCLIB_NO_AUTO_LINK_LIBRARY"
      ],
      "conditions": [
        [
          "OS=='win'",
          {
            "defines": [
              "_WINDOWS",
              "WIN32"
            ],
            "msvs_settings": {
              "VCCLCompilerTool": {
                "ExceptionHandling": 1
              }
            }
          }
        ],
        [
          "OS=='linux'",
          {
            "cflags_cc": [
              "-std=c++17"
            ]
          }
        ],
        [
          "OS=='mac'",
          {
            "xcode_settings": {
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
              "CLANG_CXX_LIBRARY": "libc++",
              "MACOSX_DEPLOYMENT_TARGET": "10.15",
              # Bundled zlib's zutil.h defines fdopen->NULL when TARGET_OS_MAC
              # is set (Apple clang predefines it), which corrupts the real
              # fdopen declaration when gzguts.h includes <stdio.h> afterwards.
              # Preincluding stdio.h makes that later include a no-op.
              # Do NOT "fix" this with Z_SOLO: it removes zlib's default
              # allocators, so every inflateInit fails at runtime and all
              # decompression returns ERROR_FILE_CORRUPT (1004).
              "OTHER_CFLAGS": [
                "-include",
                "stdio.h"
              ]
            }
          }
        ]
      ]
    }
  ]
}
