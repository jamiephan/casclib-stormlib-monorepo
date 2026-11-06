{
  "variables": {
    # Monorepo checkout: ../../thirdparty/StormLib (git submodule).
    # Published package: deps/StormLib (vendored by the prepack script).
    "lib_root": "<!(node -p \"require('fs').existsSync('../../thirdparty/StormLib/src/StormLib.h') ? '../../thirdparty/StormLib' : 'deps/StormLib'\")"
  },
  "targets": [
    {
      "target_name": "stormlib",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "sources": [
        "src/addon.cpp",
        "src/archive.cpp",
        "src/file.cpp",
        "src/errors.cpp",
        "<(lib_root)/src/FileStream.cpp",
        "<(lib_root)/src/SBaseCommon.cpp",
        "<(lib_root)/src/SBaseDumpData.cpp",
        "<(lib_root)/src/SBaseFileTable.cpp",
        "<(lib_root)/src/SBaseSubTypes.cpp",
        "<(lib_root)/src/SCompression.cpp",
        "<(lib_root)/src/SFileAddFile.cpp",
        "<(lib_root)/src/SFileAttributes.cpp",
        "<(lib_root)/src/SFileCompactArchive.cpp",
        "<(lib_root)/src/SFileCreateArchive.cpp",
        "<(lib_root)/src/SFileExtractFile.cpp",
        "<(lib_root)/src/SFileFindFile.cpp",
        "<(lib_root)/src/SFileGetFileInfo.cpp",
        "<(lib_root)/src/SFileListFile.cpp",
        "<(lib_root)/src/SFileOpenArchive.cpp",
        "<(lib_root)/src/SFileOpenFileEx.cpp",
        "<(lib_root)/src/SFilePatchArchives.cpp",
        "<(lib_root)/src/SFileReadFile.cpp",
        "<(lib_root)/src/SFileVerify.cpp",
        "<(lib_root)/src/SMemUtf8.cpp",
        "<(lib_root)/src/adpcm/adpcm.cpp",
        "<(lib_root)/src/huffman/huff.cpp",
        "<(lib_root)/src/sparse/sparse.cpp",
        "<(lib_root)/src/jenkins/lookup3.c",
        "<(lib_root)/src/pklib/explode.c",
        "<(lib_root)/src/pklib/implode.c",
        "<(lib_root)/src/pklib/crc32.c",
        "<(lib_root)/src/bzip2/blocksort.c",
        "<(lib_root)/src/bzip2/bzlib.c",
        "<(lib_root)/src/bzip2/compress.c",
        "<(lib_root)/src/bzip2/crctable.c",
        "<(lib_root)/src/bzip2/decompress.c",
        "<(lib_root)/src/bzip2/huffman.c",
        "<(lib_root)/src/bzip2/randtable.c",
        "<(lib_root)/src/zlib/adler32.c",
        "<(lib_root)/src/zlib/compress.c",
        "<(lib_root)/src/zlib/crc32.c",
        "<(lib_root)/src/zlib/deflate.c",
        "<(lib_root)/src/zlib/inffast.c",
        "<(lib_root)/src/zlib/inflate.c",
        "<(lib_root)/src/zlib/inftrees.c",
        "<(lib_root)/src/zlib/trees.c",
        "<(lib_root)/src/zlib/zutil.c",
        "<(lib_root)/src/lzma/C/LzFind.c",
        "<(lib_root)/src/lzma/C/LzmaDec.c",
        "<(lib_root)/src/lzma/C/LzmaEnc.c",
        "<(lib_root)/src/LibTomMath.c",
        "<(lib_root)/src/LibTomMathDesc.c",
        "<(lib_root)/src/LibTomCrypt.c"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<(lib_root)/src"
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
            "sources": [
              "<(lib_root)/src/lzma/C/LzFindMt.c",
              "<(lib_root)/src/lzma/C/Threads.c"
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
            "defines": [
              "BZ_STRICT_ANSI",
              "_7ZIP_ST"
            ],
            "cflags_cc": [
              "-std=c++17"
            ]
          }
        ],
        [
          "OS=='mac'",
          {
            "defines": [
              "_7ZIP_ST"
            ],
            "sources!": [
              "<(lib_root)/src/bzip2/blocksort.c",
              "<(lib_root)/src/bzip2/bzlib.c",
              "<(lib_root)/src/bzip2/compress.c",
              "<(lib_root)/src/bzip2/crctable.c",
              "<(lib_root)/src/bzip2/decompress.c",
              "<(lib_root)/src/bzip2/huffman.c",
              "<(lib_root)/src/bzip2/randtable.c",
              "<(lib_root)/src/zlib/adler32.c",
              "<(lib_root)/src/zlib/compress.c",
              "<(lib_root)/src/zlib/crc32.c",
              "<(lib_root)/src/zlib/deflate.c",
              "<(lib_root)/src/zlib/inffast.c",
              "<(lib_root)/src/zlib/inflate.c",
              "<(lib_root)/src/zlib/inftrees.c",
              "<(lib_root)/src/zlib/trees.c",
              "<(lib_root)/src/zlib/zutil.c"
            ],
            "libraries": [
              "-lz",
              "-lbz2"
            ],
            "xcode_settings": {
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
              "CLANG_CXX_LIBRARY": "libc++",
              "MACOSX_DEPLOYMENT_TARGET": "10.15"
            }
          }
        ]
      ]
    }
  ]
}
