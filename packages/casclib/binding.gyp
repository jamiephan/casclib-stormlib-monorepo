{
  "targets": [
    {
      "target_name": "casclib",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "sources": [
        "src/addon.cpp",
        "src/storage.cpp",
        "src/file.cpp",
        "../../thirdparty/CascLib/src/CascDecompress.cpp",
        "../../thirdparty/CascLib/src/CascDecrypt.cpp",
        "../../thirdparty/CascLib/src/CascDumpData.cpp",
        "../../thirdparty/CascLib/src/CascFiles.cpp",
        "../../thirdparty/CascLib/src/CascFindFile.cpp",
        "../../thirdparty/CascLib/src/CascIndexFiles.cpp",
        "../../thirdparty/CascLib/src/CascOpenFile.cpp",
        "../../thirdparty/CascLib/src/CascOpenStorage.cpp",
        "../../thirdparty/CascLib/src/CascReadFile.cpp",
        "../../thirdparty/CascLib/src/CascRootFile_Diablo3.cpp",
        "../../thirdparty/CascLib/src/CascRootFile_Install.cpp",
        "../../thirdparty/CascLib/src/CascRootFile_MNDX.cpp",
        "../../thirdparty/CascLib/src/CascRootFile_Text.cpp",
        "../../thirdparty/CascLib/src/CascRootFile_TVFS.cpp",
        "../../thirdparty/CascLib/src/CascRootFile_WoW.cpp",
        "../../thirdparty/CascLib/src/common/Common.cpp",
        "../../thirdparty/CascLib/src/common/Csv.cpp",
        "../../thirdparty/CascLib/src/common/Directory.cpp",
        "../../thirdparty/CascLib/src/common/FileStream.cpp",
        "../../thirdparty/CascLib/src/common/FileTree.cpp",
        "../../thirdparty/CascLib/src/common/ListFile.cpp",
        "../../thirdparty/CascLib/src/common/Mime.cpp",
        "../../thirdparty/CascLib/src/common/RootHandler.cpp",
        "../../thirdparty/CascLib/src/common/Sockets.cpp",
        "../../thirdparty/CascLib/src/jenkins/lookup3.c",
        "../../thirdparty/CascLib/src/hashes/md5.cpp",
        "../../thirdparty/CascLib/src/hashes/sha1.cpp",
        "../../thirdparty/CascLib/src/zlib/adler32.c",
        "../../thirdparty/CascLib/src/zlib/crc32.c",
        "../../thirdparty/CascLib/src/zlib/deflate.c",
        "../../thirdparty/CascLib/src/zlib/inffast.c",
        "../../thirdparty/CascLib/src/zlib/inflate.c",
        "../../thirdparty/CascLib/src/zlib/inftrees.c",
        "../../thirdparty/CascLib/src/zlib/trees.c",
        "../../thirdparty/CascLib/src/zlib/zutil.c"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "../../thirdparty/CascLib/src"
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
            "defines": [
              "Z_SOLO=1"
            ],
            "xcode_settings": {
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
              "CLANG_CXX_LIBRARY": "libc++",
              "MACOSX_DEPLOYMENT_TARGET": "14.0",
              'OTHER_CPLUSPLUSFLAGS' : [
                '-std=c++11',
                '-stdlib=libc++'
              ]
            }
          }
        ]
      ]
    }
  ]
}
