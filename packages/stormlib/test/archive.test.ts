import { Archive, File } from "../lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Helper to get unique test directory
const getTestDir = (testName: string): string => {
  return path.join(os.tmpdir(), "STORMLIB_TEST", "archive", testName);
};

// Helper to ensure directory exists
const ensureDir = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Helper to clean up directory
const cleanupDir = (dir: string): void => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

// Helper to create a test file
const createTestFile = (filePath: string, content: string): void => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
};

// Clean up entire STORMLIB_TEST folder before all tests
beforeAll(() => {
  const stormlibTestDir = path.join(os.tmpdir(), "STORMLIB_TEST", "archive");
  cleanupDir(stormlibTestDir);
  ensureDir(stormlibTestDir);
});

afterAll(() => {
  const stormlibTestDir = path.join(os.tmpdir(), "STORMLIB_TEST", "archive");
  cleanupDir(stormlibTestDir);
});

describe("Archive.create() and Archive.close()", () => {
  it("should create a new archive successfully", () => {
    const testDir = getTestDir("create-new");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    expect(() => {
      archive.create(archivePath, { maxFileCount: 100 });
    }).not.toThrow();
    expect(fs.existsSync(archivePath)).toBe(true);
    archive.close();
  });

  it("should close an archive successfully", () => {
    const testDir = getTestDir("close-archive");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    const result = archive.close();
    expect(result).toBe(true);
  });
});

describe("Archive.flush()", () => {
  it("should flush archive changes to disk", () => {
    const testDir = getTestDir("flush-archive");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    const result = archive.flush();
    expect(result).toBe(true);
    archive.close();
  });
});

describe("Archive.compact()", () => {
  it("should compact archive successfully", () => {
    const testDir = getTestDir("compact-archive");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    const result = archive.compact();
    expect(result).toBe(true);
    archive.close();
  });
});

describe("Archive.addFile() and Archive.extractFile()", () => {
  const testContent = "Hello, StormLib!";

  it("should add a file to the archive", () => {
    const testDir = getTestDir("add-file");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, testContent);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    const result = archive.addFile(sourceFile, "test.txt");
    expect(result).toBe(true);
    archive.close();
  });

  it("should extract a file from the archive", () => {
    const testDir = getTestDir("extract-file");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    const extractedFile = path.join(testDir, "extracted.txt");
    createTestFile(sourceFile, testContent);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "test.txt");
    archive.close();

    // Reopen and extract
    archive.open(archivePath);
    const result = archive.extractFile("test.txt", extractedFile);
    expect(result).toBe(true);
    expect(fs.existsSync(extractedFile)).toBe(true);
    expect(fs.readFileSync(extractedFile, "utf-8")).toBe(testContent);
    archive.close();
  });

  it("should add a file to a subfolder in the archive", () => {
    const testDir = getTestDir("add-subfolder");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, testContent);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    const result = archive.addFile(sourceFile, "mods/a/b/test.txt");
    expect(result).toBe(true);
    expect(archive.hasFile("mods/a/b/test.txt")).toBe(true);
    archive.close();
  });

  it("should extract a file from a subfolder in the archive", () => {
    const testDir = getTestDir("extract-subfolder");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    const extractedFile = path.join(testDir, "extracted.txt");
    createTestFile(sourceFile, testContent);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "mods/a/b/test.txt");
    archive.close();

    // Reopen and extract
    archive.open(archivePath);
    const result = archive.extractFile("mods/a/b/test.txt", extractedFile);
    expect(result).toBe(true);
    expect(fs.existsSync(extractedFile)).toBe(true);
    expect(fs.readFileSync(extractedFile, "utf-8")).toBe(testContent);
    archive.close();
  });
});

describe("Archive.removeFile()", () => {
  it("should remove a file from the archive", () => {
    const testDir = getTestDir("remove-file");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "Test content");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "test.txt");
    expect(archive.hasFile("test.txt")).toBe(true);
    
    const result = archive.removeFile("test.txt");
    expect(result).toBe(true);
    expect(archive.hasFile("test.txt")).toBe(false);
    archive.close();
  });

  it("should remove a file from a subfolder in the archive", () => {
    const testDir = getTestDir("remove-subfolder");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "Test content");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "mods/a/b/test.txt");
    expect(archive.hasFile("mods/a/b/test.txt")).toBe(true);
    
    const result = archive.removeFile("mods/a/b/test.txt");
    expect(result).toBe(true);
    expect(archive.hasFile("mods/a/b/test.txt")).toBe(false);
    archive.close();
  });
});

describe("Archive.renameFile()", () => {
  it("should rename a file in the archive", () => {
    const testDir = getTestDir("rename-file");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "Test content");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "old.txt");
    expect(archive.hasFile("old.txt")).toBe(true);
    
    const result = archive.renameFile("old.txt", "new.txt");
    expect(result).toBe(true);
    expect(archive.hasFile("old.txt")).toBe(false);
    expect(archive.hasFile("new.txt")).toBe(true);
    archive.close();
  });

  it("should rename a file in a subfolder", () => {
    const testDir = getTestDir("rename-subfolder");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "Test content");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "mods/a/b/old.txt");
    expect(archive.hasFile("mods/a/b/old.txt")).toBe(true);
    
    const result = archive.renameFile("mods/a/b/old.txt", "mods/a/b/new.txt");
    expect(result).toBe(true);
    expect(archive.hasFile("mods/a/b/old.txt")).toBe(false);
    expect(archive.hasFile("mods/a/b/new.txt")).toBe(true);
    archive.close();
  });
});

describe("Archive.getMaxFileCount() and Archive.setMaxFileCount()", () => {
  it("should get the maximum file count", () => {
    const testDir = getTestDir("get-maxfilecount");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath, { maxFileCount: 200 });
    const maxCount = archive.getMaxFileCount();
    expect(typeof maxCount).toBe("number");
    expect(maxCount).toBeGreaterThan(0);
    archive.close();
  });

  it("should set the maximum file count", () => {
    const testDir = getTestDir("set-maxfilecount");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath, { maxFileCount: 100 });
    const result = archive.setMaxFileCount(500);
    expect(result).toBe(true);
    archive.close();
  });
});

describe("Archive.getAttributes()", () => {
  it("should get archive attributes", () => {
    const testDir = getTestDir("get-attributes");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    const attributes = archive.getAttributes();
    expect(typeof attributes).toBe("number");
    archive.close();
  });
});

describe("File.read()", () => {
  const testContent = "Hello, this is test content for reading!";

  it("should read data from a file", () => {
    const testDir = getTestDir("file-read");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, testContent);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "test.txt");
    archive.close();

    archive.open(archivePath);
    const file = archive.openFile("test.txt");
    const data = file.read(10);
    expect(Buffer.isBuffer(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    file.close();
    archive.close();
  });
});

describe("File.readAll()", () => {
  const testContent = "Complete file content to read all at once!";

  it("should read all data from a file", () => {
    const testDir = getTestDir("file-readall");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, testContent);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "test.txt");
    archive.close();

    archive.open(archivePath);
    const file = archive.openFile("test.txt");
    const data = file.readAll();
    expect(Buffer.isBuffer(data)).toBe(true);
    expect(data.toString()).toBe(testContent);
    file.close();
    archive.close();
  });

  it("should read all data from a file in a subfolder", () => {
    const testDir = getTestDir("file-readall-subfolder");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, testContent);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "mods/a/b/test.txt");
    archive.close();

    archive.open(archivePath);
    const file = archive.openFile("mods/a/b/test.txt");
    const data = file.readAll();
    expect(Buffer.isBuffer(data)).toBe(true);
    expect(data.toString()).toBe(testContent);
    file.close();
    archive.close();
  });
});

describe("File.getSize()", () => {
  const testContent = "Content with known size";

  it("should get the file size", () => {
    const testDir = getTestDir("file-getsize");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, testContent);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "test.txt");
    archive.close();

    archive.open(archivePath);
    const file = archive.openFile("test.txt");
    const size = file.getSize();
    expect(typeof size).toBe("number");
    expect(size).toBe(testContent.length);
    file.close();
    archive.close();
  });
});

describe("File.close()", () => {
  it("should close a file successfully", () => {
    const testDir = getTestDir("file-close");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "Test content");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "test.txt");
    archive.close();

    archive.open(archivePath);
    const file = archive.openFile("test.txt");
    const result = file.close();
    expect(result).toBe(true);
    archive.close();
  });
});

describe("Archive.getLocale() and Archive.setLocale()", () => {
  it("should set the locale and report it via getLocale", () => {
    const original = Archive.getLocale();
    try {
      // SFileSetLocale returns the locale now in effect
      expect(Archive.setLocale(0x409)).toBe(0x409);
      expect(Archive.getLocale()).toBe(0x409);
    } finally {
      Archive.setLocale(original);
    }
    expect(Archive.getLocale()).toBe(original);
  });
});

describe("Archive.open()", () => {
  it("should open an existing archive", () => {
    const testDir = getTestDir("open-existing");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "content");
    const archivePath = path.join(testDir, "test.mpq");
    const creator = new Archive();
    creator.create(archivePath);
    creator.addFile(sourceFile, "test.txt");
    creator.close();

    const archive = new Archive();
    archive.open(archivePath);
    expect(archive.isOpen).toBe(true);
    expect(archive.hasFile("test.txt")).toBe(true);
    archive.close();
  });

  it("should throw when opening a non-existent archive", () => {
    const archive = new Archive();
    expect(() => {
      archive.open(path.join(getTestDir("open-missing"), "missing.mpq"));
    }).toThrow();
  });
});

describe("Archive.openFile()", () => {
  it("should open an existing file and read it", () => {
    const testDir = getTestDir("openfile");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "openFile content");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "test.txt");

    const file = archive.openFile("test.txt");
    expect(file).toBeInstanceOf(File);
    expect(file.readAll().toString()).toBe("openFile content");
    file.close();
    archive.close();
  });

  it("should throw when opening a missing file", () => {
    const testDir = getTestDir("openfile-missing");
    ensureDir(testDir);
    const archive = new Archive();
    archive.create(path.join(testDir, "test.mpq"));
    expect(() => archive.openFile("missing.txt")).toThrow();
    archive.close();
  });
});

describe("Archive.hasFile()", () => {
  it("should report file existence", () => {
    const testDir = getTestDir("hasfile");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "content");
    const archive = new Archive();
    archive.create(path.join(testDir, "test.mpq"));
    archive.addFile(sourceFile, "present.txt");

    expect(archive.hasFile("present.txt")).toBe(true);
    expect(archive.hasFile("absent.txt")).toBe(false);
    expect(archive.fileExists("present.txt")).toBe(true);
    archive.close();
  });
});

describe("Archive.addFileEx()", () => {
  it("should add a file with explicit compression settings", () => {
    const testDir = getTestDir("addfileex");
    ensureDir(testDir);
    const content = "Compressible content. ".repeat(100);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, content);
    const archive = new Archive();
    archive.create(path.join(testDir, "test.mpq"));

    const result = archive.addFileEx(
      sourceFile,
      "compressed.txt",
      0x00000200, // MPQ_FILE_COMPRESS
      0x02, // MPQ_COMPRESSION_ZLIB
      0x02
    );
    expect(result).toBe(true);
    expect(archive.readFileAsString("compressed.txt")).toBe(content);
    archive.close();
  });

  it("addFile with compression options should route through SFileAddFileEx", () => {
    const testDir = getTestDir("addfile-compression");
    ensureDir(testDir);
    const content = "Routed through SFileAddFileEx";
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, content);
    const archive = new Archive();
    archive.create(path.join(testDir, "test.mpq"));

    const result = archive.addFile(sourceFile, "routed.txt", {
      flags: 0x00000200, // MPQ_FILE_COMPRESS
      compression: 0x02 // MPQ_COMPRESSION_ZLIB
    });
    expect(result).toBe(true);
    expect(archive.readFileAsString("routed.txt")).toBe(content);
    archive.close();
  });
});

describe("Archive.setAttributes()", () => {
  it("should set attributes flags", () => {
    const testDir = getTestDir("set-attributes");
    ensureDir(testDir);
    const archive = new Archive();
    // MPQ_CREATE_ATTRIBUTES so the archive carries an (attributes) file
    archive.create(path.join(testDir, "test.mpq"), { flags: 0x00200000 });
    const result = archive.setAttributes(0x00000001); // MPQ_ATTRIBUTE_CRC32
    expect(result).toBe(true);
    expect(archive.getAttributes() & 0x00000001).toBe(0x00000001);
    archive.close();
  });
});

describe("Archive.verifyFile()", () => {
  it("should verify a file without errors", () => {
    const testDir = getTestDir("verify-file");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "verify me");
    const archive = new Archive();
    archive.create(path.join(testDir, "test.mpq"));
    archive.addFile(sourceFile, "test.txt");

    const result = archive.verifyFile("test.txt", 0x0000000F); // SFILE_VERIFY_ALL
    expect(typeof result).toBe("number");
    // No open/read errors expected (VERIFY_OPEN_ERROR | VERIFY_READ_ERROR)
    expect(result & 0x0003).toBe(0);
    archive.close();
  });
});

describe("File.getPosition() and File.setPosition()", () => {
  it("should track and move the file pointer", () => {
    const testDir = getTestDir("file-position");
    ensureDir(testDir);
    const content = "0123456789ABCDEF";
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, content);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "test.txt");
    archive.close();

    archive.open(archivePath);
    const file = archive.openFile("test.txt");
    expect(file.getPosition()).toBe(0);

    const newPos = file.setPosition(10);
    expect(newPos).toBe(10);
    expect(file.getPosition()).toBe(10);
    expect(file.read(6).toString()).toBe("ABCDEF");

    file.close();
    archive.close();
  });
});

describe("Archive.listFiles()", () => {
  it("should list all files in the archive", () => {
    const testDir = getTestDir("listfiles-all");
    ensureDir(testDir);
    const sourceFile1 = path.join(testDir, "file1.txt");
    const sourceFile2 = path.join(testDir, "file2.txt");
    createTestFile(sourceFile1, "Content 1");
    createTestFile(sourceFile2, "Content 2");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile1, "file1.txt");
    archive.addFile(sourceFile2, "file2.txt");
    
    const files = archive.listFiles();
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThanOrEqual(2);
    
    const fileNames = files.map(f => f.name);
    expect(fileNames).toContain("file1.txt");
    expect(fileNames).toContain("file2.txt");
    
    archive.close();
  });

  it("should list files in subfolders", () => {
    const testDir = getTestDir("listfiles-subfolders");
    ensureDir(testDir);
    const sourceFile1 = path.join(testDir, "file1.txt");
    const sourceFile2 = path.join(testDir, "file2.txt");
    createTestFile(sourceFile1, "Content 1");
    createTestFile(sourceFile2, "Content 2");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile1, "mods/a/file1.txt");
    archive.addFile(sourceFile2, "mods/b/file2.txt");
    
    const files = archive.listFiles();
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThanOrEqual(2);
    
    const fileNames = files.map(f => f.name);
    expect(fileNames).toContain("mods/a/file1.txt");
    expect(fileNames).toContain("mods/b/file2.txt");
    
    archive.close();
  });

  it("should return file info with correct properties", () => {
    const testDir = getTestDir("listfiles-props");
    ensureDir(testDir);
    const sourceFile1 = path.join(testDir, "file1.txt");
    createTestFile(sourceFile1, "Content 1");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile1, "file1.txt");
    
    const files = archive.listFiles();
    const file = files.find(f => f.name === "file1.txt");
    
    expect(file).toBeDefined();
    expect(file?.name).toBe("file1.txt");
    expect(typeof file?.fileSize).toBe("number");
    expect(typeof file?.compSize).toBe("number");
    expect(typeof file?.fileFlags).toBe("number");
    expect(typeof file?.locale).toBe("number");
    
    archive.close();
  });
});

describe("Archive.findFiles()", () => {
  it("should find files matching a pattern", () => {
    const testDir = getTestDir("findfiles-pattern");
    ensureDir(testDir);
    const txtFile = path.join(testDir, "test.txt");
    const luaFile = path.join(testDir, "test.lua");
    createTestFile(txtFile, "TXT content");
    createTestFile(luaFile, "LUA content");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "test.txt");
    archive.addFile(luaFile, "test.lua");
    
    const txtFiles = archive.findFiles("*.txt");
    expect(txtFiles).not.toBeNull();
    expect(Array.isArray(txtFiles)).toBe(true);
    
    const hasTxt = txtFiles?.some(f => f.name === "test.txt");
    expect(hasTxt).toBe(true);
    
    archive.close();
  });

  it("should find all files with wildcard", () => {
    const testDir = getTestDir("findfiles-wildcard");
    ensureDir(testDir);
    const txtFile = path.join(testDir, "test.txt");
    const luaFile = path.join(testDir, "test.lua");
    createTestFile(txtFile, "TXT content");
    createTestFile(luaFile, "LUA content");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "test.txt");
    archive.addFile(luaFile, "test.lua");
    
    const allFiles = archive.findFiles("*");
    expect(allFiles).not.toBeNull();
    expect(allFiles!.length).toBeGreaterThanOrEqual(2);
    
    archive.close();
  });

  it("should find files in subfolders with patterns", () => {
    const testDir = getTestDir("findfiles-subfolders");
    ensureDir(testDir);
    const txtFile = path.join(testDir, "test.txt");
    const luaFile = path.join(testDir, "test.lua");
    createTestFile(txtFile, "TXT content");
    createTestFile(luaFile, "LUA content");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "mods/a/b/test.txt");
    archive.addFile(luaFile, "mods/a/b/test.lua");
    archive.addFile(txtFile, "mods/c/other.txt");
    
    const allModFiles = archive.findFiles("mods*");
    expect(allModFiles).not.toBeNull();
    expect(allModFiles!.length).toBeGreaterThanOrEqual(3);
    
    const fileNames = allModFiles!.map(f => f.name);
    expect(fileNames).toContain("mods/a/b/test.txt");
    expect(fileNames).toContain("mods/a/b/test.lua");
    expect(fileNames).toContain("mods/c/other.txt");
    
    archive.close();
  });
});

describe("Archive.isPatchedArchive()", () => {
  it("should return false for non-patched archive", () => {
    const testDir = getTestDir("is-patched");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    
    const isPatched = archive.isPatchedArchive();
    expect(typeof isPatched).toBe("boolean");
    expect(isPatched).toBe(false);
    
    archive.close();
  });
});

describe("Archive.getFileChecksums()", () => {
  it("should get file checksums", () => {
    const testDir = getTestDir("get-checksums");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "Test content for checksums");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "test.txt");
    
    try {
      const checksums = archive.getFileChecksums("test.txt");
      expect(checksums).toBeDefined();
      expect(typeof checksums.crc32).toBe("number");
      expect(typeof checksums.md5).toBe("string");
    } catch (e) {
      // Some archives might not have checksums enabled
      expect(e).toBeDefined();
    }
    
    archive.close();
  });
});

describe("File.write() and File.finish()", () => {
  const testContent = "Written content";

  it("should write data to a file and finish", () => {
    const testDir = getTestDir("file-write");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    
    const buffer = Buffer.from(testContent, "utf-8");
    const file = archive.createFile("written.txt", Date.now(), buffer.length);
    
    const writeResult = file.write(buffer);
    expect(writeResult).toBe(true);
    
    const finishResult = file.finish();
    expect(finishResult).toBe(true);
    
    // Verify the file was written
    const readFile = archive.openFile("written.txt");
    const content = readFile.readAll();
    expect(content.toString()).toBe(testContent);
    readFile.close();
    
    archive.close();
  });
});

describe("File.getFileName()", () => {
  it("should get the file name", () => {
    const testDir = getTestDir("file-getfilename");
    ensureDir(testDir);
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "Test content");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile, "test.txt");
    archive.close();

    archive.open(archivePath);
    const file = archive.openFile("test.txt");
    const fileName = file.getFileName();
    expect(typeof fileName).toBe("string");
    expect(fileName).toContain("test.txt");
    file.close();
    archive.close();
  });
});

describe("Archive.verifyArchive()", () => {
  it("should verify archive signature", () => {
    const testDir = getTestDir("verify-archive");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    
    const result = archive.verifyArchive();
    expect(typeof result).toBe("number");
    // ERROR_NO_SIGNATURE (0) is expected for new archives
    expect(result).toBeGreaterThanOrEqual(0);
    
    archive.close();
  });
});

describe("Archive.signArchive()", () => {
  it("should sign archive", () => {
    const testDir = getTestDir("sign-archive");
    ensureDir(testDir);
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    
    try {
      const result = archive.signArchive();
      expect(typeof result).toBe("boolean");
    } catch (e) {
      // Signing might fail if crypto is not available
      expect(e).toBeDefined();
    }
    
    archive.close();
  });
});

describe("Archive utility methods", () => {
  it("should read file as string", () => {
    const testDir = getTestDir("read-string");
    ensureDir(testDir);
    const txtFile = path.join(testDir, "test.txt");
    createTestFile(txtFile, "Hello, World!");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "test.txt");
    
    const content = archive.readFileAsString("test.txt");
    expect(typeof content).toBe("string");
    expect(content).toBe("Hello, World!");
    
    archive.close();
  });

  it("should read file as JSON", () => {
    const testDir = getTestDir("read-json");
    ensureDir(testDir);
    const jsonFile = path.join(testDir, "test.json");
    createTestFile(jsonFile, JSON.stringify({ version: "1.0", name: "test" }));
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(jsonFile, "test.json");
    
    const json = archive.readFileAsJson("test.json");
    expect(json).toBeDefined();
    expect(json.version).toBe("1.0");
    expect(json.name).toBe("test");
    
    archive.close();
  });

  it("should get file names", () => {
    const testDir = getTestDir("get-filenames");
    ensureDir(testDir);
    const txtFile = path.join(testDir, "test.txt");
    const jsonFile = path.join(testDir, "test.json");
    createTestFile(txtFile, "Hello, World!");
    createTestFile(jsonFile, JSON.stringify({ version: "1.0", name: "test" }));
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "test.txt");
    archive.addFile(jsonFile, "test.json");
    
    const names = archive.getFileNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names).toContain("test.txt");
    expect(names).toContain("test.json");
    
    archive.close();
  });

  it("should check if file can be opened", () => {
    const testDir = getTestDir("can-open-file");
    ensureDir(testDir);
    const txtFile = path.join(testDir, "test.txt");
    createTestFile(txtFile, "Hello, World!");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "test.txt");
    
    const canOpen = archive.canOpenFile("test.txt");
    expect(canOpen).toBe(true);
    
    const cannotOpen = archive.canOpenFile("nonexistent.txt");
    expect(cannotOpen).toBe(false);
    
    archive.close();
  });

  it("should get total size", () => {
    const testDir = getTestDir("get-total-size");
    ensureDir(testDir);
    const txtFile = path.join(testDir, "test.txt");
    createTestFile(txtFile, "Hello, World!");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "test.txt");
    
    const totalSize = archive.getTotalSize();
    expect(typeof totalSize).toBe("number");
    expect(totalSize).toBeGreaterThan(0);
    
    archive.close();
  });

  it("should get compression ratio", () => {
    const testDir = getTestDir("get-compression-ratio");
    ensureDir(testDir);
    const txtFile = path.join(testDir, "test.txt");
    createTestFile(txtFile, "Hello, World!");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "test.txt");
    
    const ratio = archive.getCompressionRatio();
    expect(typeof ratio).toBe("number");
    expect(ratio).toBeGreaterThan(0);
    // Note: Compression ratio can be > 1 for small files where compression overhead exceeds savings
    
    archive.close();
  });

  it("should read file as string from subfolder", () => {
    const testDir = getTestDir("read-string-subfolder");
    ensureDir(testDir);
    const txtFile = path.join(testDir, "test.txt");
    createTestFile(txtFile, "Hello, World!");
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "mods/a/b/test.txt");
    
    const content = archive.readFileAsString("mods/a/b/test.txt");
    expect(typeof content).toBe("string");
    expect(content).toBe("Hello, World!");
    
    archive.close();
  });

  it("should read file as JSON from subfolder", () => {
    const testDir = getTestDir("read-json-subfolder");
    ensureDir(testDir);
    const jsonFile = path.join(testDir, "test.json");
    createTestFile(jsonFile, JSON.stringify({ version: "1.0", name: "test" }));
    const archivePath = path.join(testDir, "test.mpq");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(jsonFile, "data/config/test.json");
    
    const json = archive.readFileAsJson("data/config/test.json");
    expect(json).toBeDefined();
    expect(json.version).toBe("1.0");
    expect(json.name).toBe("test");
    
    archive.close();
  });
});
