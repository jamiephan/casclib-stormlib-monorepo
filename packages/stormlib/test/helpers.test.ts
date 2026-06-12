import {
  Archive,
  StormError,
  withArchive,
  SFileInfoClass,
  MPQ_COMPRESSION_BZIP2,
  MPQ_FILE_COMPRESS,
  MPQ_OPEN_READ_ONLY,
  MPQ_CREATE_LISTFILE,
  MPQ_CREATE_ATTRIBUTES,
  MPQ_ATTRIBUTE_CRC32,
  MPQ_ATTRIBUTE_ALL
} from "../lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const BASE_DIR = path.join(os.tmpdir(), "STORMLIB_TEST", "helpers");

const getTestDir = (testName: string): string => path.join(BASE_DIR, testName);

const ensureDir = (dir: string): void => {
  fs.mkdirSync(dir, { recursive: true });
};

const createTestFile = (filePath: string, content: string): void => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
};

// Creates an archive on disk containing the given files, then closes it.
const buildArchive = (testName: string, files: Record<string, string>): string => {
  const testDir = getTestDir(testName);
  ensureDir(testDir);
  const archivePath = path.join(testDir, "test.mpq");
  const archive = Archive.create(archivePath, { maxFileCount: 100 });
  for (const [name, content] of Object.entries(files)) {
    const src = path.join(testDir, `src_${name.replace(/[\\/]/g, "_")}`);
    createTestFile(src, content);
    archive.addFile(src, name);
  }
  archive.close();
  return archivePath;
};

beforeAll(() => {
  fs.rmSync(BASE_DIR, { recursive: true, force: true });
  ensureDir(BASE_DIR);
});

afterAll(() => {
  fs.rmSync(BASE_DIR, { recursive: true, force: true });
});

describe("Archive.addBuffer()", () => {
  it("round-trips binary data without a temp file on disk", () => {
    const testDir = getTestDir("add-buffer");
    ensureDir(testDir);
    const archive = Archive.create(path.join(testDir, "test.mpq"));
    try {
      const data = Buffer.from([0x00, 0x01, 0xfe, 0xff, 0x42, 0x00, 0x99]);
      expect(archive.addBuffer("data/blob.bin", data)).toBe(true);
      expect(archive.hasFile("data/blob.bin")).toBe(true);
      expect(archive.readFile("data/blob.bin").equals(data)).toBe(true);
    } finally {
      archive.close();
    }
  });

  it("persists across close and reopen", () => {
    const testDir = getTestDir("add-buffer-reopen");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const data = Buffer.from("persisted content", "utf-8");

    const writer = Archive.create(archivePath);
    writer.addBuffer("file.txt", data);
    writer.close();

    const reader = Archive.open(archivePath);
    try {
      expect(reader.readFile("file.txt").equals(data)).toBe(true);
    } finally {
      reader.close();
    }
  });

  it("replaces an existing file by default", () => {
    const testDir = getTestDir("add-buffer-replace");
    ensureDir(testDir);
    const archive = Archive.create(path.join(testDir, "test.mpq"));
    try {
      archive.addBuffer("file.txt", Buffer.from("first"));
      archive.addBuffer("file.txt", Buffer.from("second"));
      expect(archive.readFileAsString("file.txt")).toBe("second");
    } finally {
      archive.close();
    }
  });

  it("accepts an explicit compression method", () => {
    const testDir = getTestDir("add-buffer-compression");
    ensureDir(testDir);
    const archive = Archive.create(path.join(testDir, "test.mpq"));
    try {
      const data = Buffer.from("bzip2-compressed content ".repeat(50), "utf-8");
      archive.addBuffer("bz2.txt", data, {
        flags: MPQ_FILE_COMPRESS,
        compression: MPQ_COMPRESSION_BZIP2
      });
      expect(archive.readFile("bz2.txt").equals(data)).toBe(true);
    } finally {
      archive.close();
    }
  });
});

describe("Archive.addString()", () => {
  it("round-trips a utf-8 string", () => {
    const testDir = getTestDir("add-string");
    ensureDir(testDir);
    const archive = Archive.create(path.join(testDir, "test.mpq"));
    try {
      const text = "Hello, MPQ! Ünïcödé ✓";
      expect(archive.addString("hello.txt", text)).toBe(true);
      expect(archive.readFileAsString("hello.txt")).toBe(text);
    } finally {
      archive.close();
    }
  });

  it("honours a custom encoding", () => {
    const testDir = getTestDir("add-string-encoding");
    ensureDir(testDir);
    const archive = Archive.create(path.join(testDir, "test.mpq"));
    try {
      const text = "utf16 content";
      archive.addString("utf16.txt", text, { encoding: "utf16le" });
      expect(archive.readFileAsString("utf16.txt", "utf16le")).toBe(text);
    } finally {
      archive.close();
    }
  });
});

describe("Archive.readFileAsStringAsync()", () => {
  it("readFileAsStringAsync matches the sync variant", async () => {
    const archivePath = buildArchive("read-string-async", { "data.txt": "async string" });
    const archive = Archive.open(archivePath);
    try {
      await expect(archive.readFileAsStringAsync("data.txt")).resolves.toBe(
        archive.readFileAsString("data.txt")
      );
    } finally {
      archive.close();
    }
  });

  it("readFileAsStringAsync rejects with StormError for missing files", async () => {
    const archivePath = buildArchive("read-string-async-missing", { "a.txt": "x" });
    const archive = Archive.open(archivePath);
    try {
      await expect(archive.readFileAsStringAsync("missing.txt")).rejects.toThrow(StormError);
    } finally {
      archive.close();
    }
  });
});

describe("Archive.findFilesMatching()", () => {
  it("returns only entries whose name matches the regex", () => {
    const archivePath = buildArchive("find-matching", {
      "a.txt": "A",
      "b.txt": "B",
      "sub/c.txt": "C",
      "d.xml": "D"
    });
    const archive = Archive.open(archivePath);
    try {
      const pattern = /\.txt$/i;
      const matches = archive.findFilesMatching(pattern);
      expect(matches.length).toBe(3);
      expect(matches.every(f => pattern.test(f.name))).toBe(true);
      expect(archive.findFilesMatching(/^nothing-matches$/)).toEqual([]);
    } finally {
      archive.close();
    }
  });
});

describe("Archive.extractFiles() / extractFilesAsync()", () => {
  const files = {
    "a.txt": "Content A",
    "b.txt": "Content B",
    "sub/c.txt": "Content C"
  };

  it("extractFiles preserves directory structure and reports extracted names", () => {
    const archivePath = buildArchive("extract-files", files);
    const outDir = path.join(getTestDir("extract-files"), "out");
    const archive = Archive.open(archivePath);
    try {
      const { extracted, failed } = archive.extractFiles(outDir, "*.txt");
      expect(extracted.length).toBeGreaterThanOrEqual(3);
      expect(failed).toEqual([]);
      expect(fs.readFileSync(path.join(outDir, "a.txt"), "utf-8")).toBe("Content A");
      expect(fs.readFileSync(path.join(outDir, "b.txt"), "utf-8")).toBe("Content B");
      // Subfolder entries keep their directory structure
      expect(fs.readFileSync(path.join(outDir, "sub", "c.txt"), "utf-8")).toBe("Content C");
    } finally {
      archive.close();
    }
  });

  it("extractFilesAsync accepts a RegExp and matches the sync variant", async () => {
    const archivePath = buildArchive("extract-files-async", files);
    const outDir = path.join(getTestDir("extract-files-async"), "out");
    const archive = Archive.open(archivePath);
    try {
      const { extracted, failed } = await archive.extractFilesAsync(outDir, /\.txt$/i);
      expect(extracted.length).toBe(3);
      expect(failed).toEqual([]);
      expect(fs.readFileSync(path.join(outDir, "a.txt"), "utf-8")).toBe("Content A");
      expect(fs.readFileSync(path.join(outDir, "sub", "c.txt"), "utf-8")).toBe("Content C");
    } finally {
      archive.close();
    }
  });

  it("rejects archive names that would escape the output directory", () => {
    // Archive names come from MPQ metadata and are untrusted (zip-slip)
    const testDir = getTestDir("extract-files-guard");
    ensureDir(testDir);
    const outDir = path.join(testDir, "out");
    const archive = Archive.create(path.join(testDir, "test.mpq"), { maxFileCount: 100 });
    try {
      expect(archive.addString("..\\evil.txt", "escape attempt")).toBe(true);
      expect(archive.addString("safe.txt", "fine")).toBe(true);
      const { extracted, failed } = archive.extractFiles(outDir, "*.txt");
      expect(failed).toContain("..\\evil.txt");
      expect(extracted).toContain("safe.txt");
      expect(fs.existsSync(path.join(outDir, "safe.txt"))).toBe(true);
      expect(fs.existsSync(path.join(testDir, "evil.txt"))).toBe(false);
    } finally {
      archive.close();
    }
  });
});

describe("Archive.getFileCount()", () => {
  it("counts files matching a mask", () => {
    const archivePath = buildArchive("file-count", {
      "a.txt": "A",
      "b.txt": "B",
      "c.xml": "C"
    });
    const archive = Archive.open(archivePath);
    try {
      expect(archive.getFileCount("*.txt")).toBe(2);
      expect(archive.getFileCount("*.xml")).toBe(1);
      expect(archive.getFileCount()).toBeGreaterThanOrEqual(3);
    } finally {
      archive.close();
    }
  });

  it("returns 0 when nothing matches", () => {
    const archivePath = buildArchive("file-count-zero", { "a.txt": "A" });
    const archive = Archive.open(archivePath);
    try {
      expect(archive.getFileCount("*.nomatch")).toBe(0);
    } finally {
      archive.close();
    }
  });
});

describe("Archive size helpers on empty results", () => {
  it("getTotalCompressedSize is positive for non-empty archives", () => {
    const archivePath = buildArchive("comp-size", { "a.txt": "Some content here" });
    const archive = Archive.open(archivePath);
    try {
      expect(archive.getTotalCompressedSize()).toBeGreaterThan(0);
      expect(archive.getCompressionRatio()).toBeGreaterThan(0);
    } finally {
      archive.close();
    }
  });
});

describe("Archive.getFileInfo() / File.getFileInfo() with SFileInfoClass", () => {
  it("MpqFileName returns the archive path", () => {
    const archivePath = buildArchive("info-archive-name", { "a.txt": "A" });
    const archive = Archive.open(archivePath);
    try {
      const info = archive.getFileInfo(SFileInfoClass.MpqFileName);
      expect(info).not.toBeNull();
      expect(info!.toString("utf-8")).toContain("test.mpq");
    } finally {
      archive.close();
    }
  });

  it("InfoFileSize returns the file size as a DWORD", () => {
    const content = "exactly 20 chars !!!";
    const archivePath = buildArchive("info-file-size", { "a.txt": content });
    const archive = Archive.open(archivePath);
    try {
      const file = archive.openFile("a.txt");
      try {
        const info = file.getFileInfo(SFileInfoClass.InfoFileSize);
        expect(info).not.toBeNull();
        expect(info!.readUInt32LE(0)).toBe(content.length);
      } finally {
        file.close();
      }
    } finally {
      archive.close();
    }
  });

  it("InfoLocale returns the file locale as a DWORD", () => {
    const archivePath = buildArchive("info-file-locale", { "a.txt": "A" });
    const archive = Archive.open(archivePath);
    try {
      const file = archive.openFile("a.txt");
      try {
        const info = file.getFileInfo(SFileInfoClass.InfoLocale);
        expect(info).not.toBeNull();
        expect(info!.readUInt32LE(0)).toBe(0);
      } finally {
        file.close();
      }
    } finally {
      archive.close();
    }
  });
});

describe("Archive.addListFile()", () => {
  it("adds an external listfile to a freshly opened archive", () => {
    const testDir = getTestDir("add-listfile");
    const archivePath = buildArchive("add-listfile", { "known.txt": "K" });
    const listfilePath = path.join(testDir, "extra-list.txt");
    createTestFile(listfilePath, "known.txt\r\n");

    const archive = Archive.open(archivePath);
    try {
      const result = archive.addListFile(listfilePath);
      expect(typeof result).toBe("number");
    } finally {
      archive.close();
    }
  });
});

describe("Archive.enumLocales()", () => {
  it("returns the locales a file exists in", () => {
    const archivePath = buildArchive("enum-locales", { "a.txt": "A" });
    const archive = Archive.open(archivePath);
    try {
      const locales = archive.enumLocales("a.txt");
      expect(Array.isArray(locales)).toBe(true);
      expect(locales).toContain(0); // LANG_NEUTRAL
    } finally {
      archive.close();
    }
  });
});

describe("Archive attributes", () => {
  it("setAttributes and updateFileAttributes work on an attributes-enabled archive", () => {
    const testDir = getTestDir("attributes");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = Archive.create(archivePath, {
      maxFileCount: 100,
      flags: MPQ_CREATE_LISTFILE | MPQ_CREATE_ATTRIBUTES
    });
    try {
      const src = path.join(testDir, "src.txt");
      createTestFile(src, "attribute test content");
      archive.addFile(src, "test.txt");

      expect(archive.setAttributes(MPQ_ATTRIBUTE_ALL)).toBe(true);
      expect(archive.getAttributes() & MPQ_ATTRIBUTE_CRC32).toBe(MPQ_ATTRIBUTE_CRC32);
      expect(archive.updateFileAttributes("test.txt")).toBe(true);
      archive.flush();
    } finally {
      archive.close();
    }
  });
});

describe("File.setLocale()", () => {
  it("changes the locale of a file in a writable archive", () => {
    const archivePath = buildArchive("file-set-locale", { "a.txt": "A" });
    const archive = Archive.open(archivePath);
    try {
      const file = archive.openFile("a.txt");
      try {
        expect(file.setLocale(0x409)).toBe(true);
      } finally {
        file.close();
      }
      const locales = archive.enumLocales("a.txt");
      expect(locales).toContain(0x409);
    } finally {
      archive.close();
    }
  });
});

describe("Archive.addBuffer() failure handling", () => {
  it("closes the created file and rethrows when the write fails", () => {
    const testDir = getTestDir("add-buffer-failure");
    ensureDir(testDir);
    const archive = Archive.create(path.join(testDir, "test.mpq"));
    try {
      const fakeFile = {
        write: jest.fn(() => {
          throw new StormError("write failed", 112, "ERROR_DISK_FULL");
        }),
        finish: jest.fn(),
        close: jest.fn()
      };
      jest.spyOn(archive, "createFile").mockReturnValue(fakeFile as any);

      expect(() => archive.addBuffer("f.bin", Buffer.from("x"))).toThrow("write failed");
      expect(fakeFile.close).toHaveBeenCalled();
      expect(fakeFile.finish).not.toHaveBeenCalled();
    } finally {
      jest.restoreAllMocks();
      archive.close();
    }
  });
});

describe("Archive.canOpenFile() on a closed archive", () => {
  it("returns false instead of throwing", () => {
    const archive = new Archive();
    expect(archive.canOpenFile("anything.txt")).toBe(false);
  });
});

describe("Archive.addWave()", () => {
  // Minimal valid PCM WAV: RIFF header + fmt chunk + data chunk of sine samples
  const makeWav = (samples: number): Buffer => {
    const dataSize = samples * 2;
    const buf = Buffer.alloc(44 + dataSize);
    buf.write("RIFF", 0);
    buf.writeUInt32LE(36 + dataSize, 4);
    buf.write("WAVE", 8);
    buf.write("fmt ", 12);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20); // PCM
    buf.writeUInt16LE(1, 22); // mono
    buf.writeUInt32LE(22050, 24);
    buf.writeUInt32LE(44100, 28);
    buf.writeUInt16LE(2, 32);
    buf.writeUInt16LE(16, 34); // 16-bit
    buf.write("data", 36);
    buf.writeUInt32LE(dataSize, 40);
    for (let i = 0; i < samples; i++) {
      buf.writeInt16LE(Math.round(Math.sin(i / 10) * 10000), 44 + i * 2);
    }
    return buf;
  };

  it("adds a wave file at each quality level", () => {
    const testDir = getTestDir("add-wave");
    ensureDir(testDir);
    const wavPath = path.join(testDir, "probe.wav");
    const wav = makeWav(2048);
    fs.writeFileSync(wavPath, wav);

    const archive = Archive.create(path.join(testDir, "test.mpq"));
    try {
      expect(archive.addWave(wavPath, "high.wav", undefined, 0)).toBe(true);
      expect(archive.addWave(wavPath, "medium.wav", undefined, 1)).toBe(true);
      expect(archive.addWave(wavPath, "low.wav", undefined, 2)).toBe(true);
      // ADPCM compression is lossy, but the decompressed size must match
      expect(archive.readFile("medium.wav").length).toBe(wav.length);
      // Quality 0 is lossless
      expect(archive.readFile("high.wav").equals(wav)).toBe(true);
    } finally {
      archive.close();
    }
  });
});

describe("Archive.openPatchArchive() / isPatchedArchive()", () => {
  it("applies a patch archive over a read-only base", () => {
    const testDir = getTestDir("patch-archive");
    ensureDir(testDir);
    const basePath = path.join(testDir, "base.mpq");
    const patchPath = path.join(testDir, "patch.mpq");
    const src = path.join(testDir, "src.txt");

    fs.writeFileSync(src, "base content");
    let builder = Archive.create(basePath);
    builder.addFile(src, "f.txt");
    builder.close();

    fs.writeFileSync(src, "patched content");
    builder = Archive.create(patchPath);
    builder.addFile(src, "f.txt");
    builder.close();

    // Patching requires the base archive to be opened read-only
    const base = Archive.open(basePath, { flags: MPQ_OPEN_READ_ONLY });
    try {
      expect(base.isPatchedArchive()).toBe(false);
      expect(base.openPatchArchive(patchPath, "")).toBe(true);
      expect(base.isPatchedArchive()).toBe(true);
    } finally {
      base.close();
    }
  });
});

describe("withArchive", () => {
  it("returns the callback value and closes the archive", () => {
    const archivePath = buildArchive("with-archive", { "a.txt": "A" });
    let captured: Archive | undefined;
    const text = withArchive((a: Archive) => {
      captured = a;
      a.open(archivePath);
      return a.readFileAsString("a.txt");
    });
    expect(text).toBe("A");
    expect(captured!.isOpen).toBe(false);
  });

  it("closes the archive when the callback throws", () => {
    const archivePath = buildArchive("with-archive-throw", { "a.txt": "A" });
    const sentinel = new Error("boom");
    expect(() =>
      withArchive((a: Archive) => {
        a.open(archivePath);
        throw sentinel;
      })
    ).toThrow(sentinel);
  });
});
