{
  "targets": [
    {
      "target_name": "stormlib",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "sources": [
        "src/addon.cpp",
        "src/archive.cpp",
        "src/file.cpp",
        "../../thirdparty/StormLib/src/FileStream.cpp",
        "../../thirdparty/StormLib/src/SBaseCommon.cpp",
        "../../thirdparty/StormLib/src/SBaseDumpData.cpp",
        "../../thirdparty/StormLib/src/SBaseFileTable.cpp",
        "../../thirdparty/StormLib/src/SBaseSubTypes.cpp",
        "../../thirdparty/StormLib/src/SCompression.cpp",
        "../../thirdparty/StormLib/src/SFileAddFile.cpp",
        "../../thirdparty/StormLib/src/SFileAttributes.cpp",
        "../../thirdparty/StormLib/src/SFileCompactArchive.cpp",
        "../../thirdparty/StormLib/src/SFileCreateArchive.cpp",
        "../../thirdparty/StormLib/src/SFileExtractFile.cpp",
        "../../thirdparty/StormLib/src/SFileFindFile.cpp",
        "../../thirdparty/StormLib/src/SFileGetFileInfo.cpp",
        "../../thirdparty/StormLib/src/SFileListFile.cpp",
        "../../thirdparty/StormLib/src/SFileOpenArchive.cpp",
        "../../thirdparty/StormLib/src/SFileOpenFileEx.cpp",
        "../../thirdparty/StormLib/src/SFilePatchArchives.cpp",
        "../../thirdparty/StormLib/src/SFileReadFile.cpp",
        "../../thirdparty/StormLib/src/SFileVerify.cpp",
        "../../thirdparty/StormLib/src/SMemUtf8.cpp",
        "../../thirdparty/StormLib/src/adpcm/adpcm.cpp",
        "../../thirdparty/StormLib/src/huffman/huff.cpp",
        "../../thirdparty/StormLib/src/sparse/sparse.cpp",
        "../../thirdparty/StormLib/src/jenkins/lookup3.c",
        "../../thirdparty/StormLib/src/pklib/explode.c",
        "../../thirdparty/StormLib/src/pklib/implode.c",
        "../../thirdparty/StormLib/src/pklib/crc32.c",
        "../../thirdparty/StormLib/src/bzip2/blocksort.c",
        "../../thirdparty/StormLib/src/bzip2/bzlib.c",
        "../../thirdparty/StormLib/src/bzip2/compress.c",
        "../../thirdparty/StormLib/src/bzip2/crctable.c",
        "../../thirdparty/StormLib/src/bzip2/decompress.c",
        "../../thirdparty/StormLib/src/bzip2/huffman.c",
        "../../thirdparty/StormLib/src/bzip2/randtable.c",
        "../../thirdparty/StormLib/src/zlib/adler32.c",
        "../../thirdparty/StormLib/src/zlib/compress.c",
        "../../thirdparty/StormLib/src/zlib/crc32.c",
        "../../thirdparty/StormLib/src/zlib/deflate.c",
        "../../thirdparty/StormLib/src/zlib/inffast.c",
        "../../thirdparty/StormLib/src/zlib/inflate.c",
        "../../thirdparty/StormLib/src/zlib/inftrees.c",
        "../../thirdparty/StormLib/src/zlib/trees.c",
        "../../thirdparty/StormLib/src/zlib/zutil.c",
        "../../thirdparty/StormLib/src/lzma/C/LzFind.c",
        "../../thirdparty/StormLib/src/lzma/C/LzFindMt.c",
        "../../thirdparty/StormLib/src/lzma/C/LzmaDec.c",
        "../../thirdparty/StormLib/src/lzma/C/LzmaEnc.c",
        "../../thirdparty/StormLib/src/lzma/C/Threads.c",
        "../../thirdparty/StormLib/src/LibTomMath.c",
        "../../thirdparty/StormLib/src/LibTomMathDesc.c",
        "../../thirdparty/StormLib/src/LibTomCrypt.c"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "../../thirdparty/StormLib/src"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "__STORMLIB_NO_STATIC_LINK__"
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
            ],
            "libraries": [
              "-lz",
              "-lbz2"
            ]
          }
        ],
        [
          "OS=='mac'",
          {
            "xcode_settings": {
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
              "CLANG_CXX_LIBRARY": "libc++",
              "MACOSX_DEPLOYMENT_TARGET": "10.15"
            },
            "libraries": [
              "-lz",
              "-lbz2"
            ]
          }
        ]
      ]
    }
  ]
}
