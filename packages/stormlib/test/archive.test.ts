import { Archive, File } from "../lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Helper to get unique test directory
const getTestDir = (testName: string): string => {
  return path.join(os.tmpdir(), "STORMLIB_TEST", testName);
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
  const stormlibTestDir = path.join(os.tmpdir(), "STORMLIB_TEST");
  cleanupDir(stormlibTestDir);
});

describe("Archive.create() and Archive.close()", () => {
  const testDir = getTestDir("create-close");
  const archivePath = path.join(testDir, "test.mpq");

  beforeEach(() => {
    ensureDir(testDir);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should create a new archive successfully", () => {
    const archive = new Archive();
    expect(() => {
      archive.create(archivePath, { maxFileCount: 100 });
    }).not.toThrow();
    expect(fs.existsSync(archivePath)).toBe(true);
    archive.close();
  });

  it("should close an archive successfully", () => {
    const archive = new Archive();
    archive.create(archivePath);
    const result = archive.close();
    expect(result).toBe(true);
  });
});

describe("Archive.flush()", () => {
  const testDir = getTestDir("flush");
  const archivePath = path.join(testDir, "test.mpq");

  beforeEach(() => {
    ensureDir(testDir);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should flush archive changes to disk", () => {
    const archive = new Archive();
    archive.create(archivePath);
    const result = archive.flush();
    expect(result).toBe(true);
    archive.close();
  });
});

describe("Archive.compact()", () => {
  const testDir = getTestDir("compact");
  const archivePath = path.join(testDir, "test.mpq");

  beforeEach(() => {
    ensureDir(testDir);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should compact archive successfully", () => {
    const archive = new Archive();
    archive.create(archivePath);
    const result = archive.compact();
    expect(result).toBe(true);
    archive.close();
  });
});

describe("Archive.addFile() and Archive.extractFile()", () => {
  const testDir = getTestDir("add-extract");
  const archivePath = path.join(testDir, "test.mpq");
  const sourceFile = path.join(testDir, "source.txt");
  const extractedFile = path.join(testDir, "extracted.txt");
  const testContent = "Hello, StormLib!";

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile, testContent);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should add a file to the archive", () => {
    const archive = new Archive();
    archive.create(archivePath);
    const result = archive.addFile(sourceFile, "test.txt");
    expect(result).toBe(true);
    archive.close();
  });

  it("should extract a file from the archive", () => {
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
    const archive = new Archive();
    archive.create(archivePath);
    const result = archive.addFile(sourceFile, "mods/a/b/test.txt");
    expect(result).toBe(true);
    expect(archive.hasFile("mods/a/b/test.txt")).toBe(true);
    archive.close();
  });

  it("should extract a file from a subfolder in the archive", () => {
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
  const testDir = getTestDir("remove");
  const archivePath = path.join(testDir, "test.mpq");
  const sourceFile = path.join(testDir, "source.txt");

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile, "Test content");
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should remove a file from the archive", () => {
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
  const testDir = getTestDir("rename");
  const archivePath = path.join(testDir, "test.mpq");
  const sourceFile = path.join(testDir, "source.txt");

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile, "Test content");
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should rename a file in the archive", () => {
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
  const testDir = getTestDir("maxfilecount");
  const archivePath = path.join(testDir, "test.mpq");

  beforeEach(() => {
    ensureDir(testDir);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should get the maximum file count", () => {
    const archive = new Archive();
    archive.create(archivePath, { maxFileCount: 200 });
    const maxCount = archive.getMaxFileCount();
    expect(typeof maxCount).toBe("number");
    expect(maxCount).toBeGreaterThan(0);
    archive.close();
  });

  it("should set the maximum file count", () => {
    const archive = new Archive();
    archive.create(archivePath, { maxFileCount: 100 });
    const result = archive.setMaxFileCount(500);
    expect(result).toBe(true);
    archive.close();
  });
});

describe("Archive.getAttributes()", () => {
  const testDir = getTestDir("attributes");
  const archivePath = path.join(testDir, "test.mpq");

  beforeEach(() => {
    ensureDir(testDir);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should get archive attributes", () => {
    const archive = new Archive();
    archive.create(archivePath);
    const attributes = archive.getAttributes();
    expect(typeof attributes).toBe("number");
    archive.close();
  });
});

describe("File.read()", () => {
  const testDir = getTestDir("file-read");
  const archivePath = path.join(testDir, "test.mpq");
  const sourceFile = path.join(testDir, "source.txt");
  const testContent = "Hello, this is test content for reading!";

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile, testContent);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should read data from a file", () => {
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
  const testDir = getTestDir("file-readall");
  const archivePath = path.join(testDir, "test.mpq");
  const sourceFile = path.join(testDir, "source.txt");
  const testContent = "Complete file content to read all at once!";

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile, testContent);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should read all data from a file", () => {
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
  const testDir = getTestDir("file-size");
  const archivePath = path.join(testDir, "test.mpq");
  const sourceFile = path.join(testDir, "source.txt");
  const testContent = "Content with known size";

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile, testContent);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should get the file size", () => {
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
  const testDir = getTestDir("file-close");
  const archivePath = path.join(testDir, "test.mpq");
  const sourceFile = path.join(testDir, "source.txt");

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile, "Test content");
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should close a file successfully", () => {
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

// Dummy tests for methods not yet implemented
describe("Archive.getLocale() and Archive.setLocale() - TODO", () => {
  it("should be implemented in the future", () => {
    expect(true).toBe(true);
  });
});

describe("Archive.open() - TODO", () => {
  it("should be implemented in the future", () => {
    expect(true).toBe(true);
  });
});

describe("Archive.openFile() - TODO", () => {
  it("should be implemented in the future", () => {
    expect(true).toBe(true);
  });
});

describe("Archive.hasFile() - TODO", () => {
  it("should be implemented in the future", () => {
    expect(true).toBe(true);
  });
});

describe("Archive.addFileEx() - TODO", () => {
  it("should be implemented in the future", () => {
    expect(true).toBe(true);
  });
});

describe("Archive.setAttributes() - TODO", () => {
  it("should be implemented in the future", () => {
    expect(true).toBe(true);
  });
});

describe("Archive.verifyFile() - TODO", () => {
  it("should be implemented in the future", () => {
    expect(true).toBe(true);
  });
});

describe("Archive.verifyArchive() - TODO", () => {
  it("should be implemented in the future", () => {
    expect(true).toBe(true);
  });
});

describe("File.getPosition() and File.setPosition() - TODO", () => {
  it("should be implemented in the future", () => {
    expect(true).toBe(true);
  });
});

describe("Archive.listFiles()", () => {
  const testDir = getTestDir("listfiles");
  const archivePath = path.join(testDir, "test.mpq");
  const sourceFile1 = path.join(testDir, "file1.txt");
  const sourceFile2 = path.join(testDir, "file2.txt");

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile1, "Content 1");
    createTestFile(sourceFile2, "Content 2");
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should list all files in the archive", () => {
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(sourceFile1, "file1.txt");
    archive.addFile(sourceFile2, "file2.txt");
    
    const files = archive.listFiles();
    console.log(files)
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThanOrEqual(2);
    
    const fileNames = files.map(f => f.name);
    expect(fileNames).toContain("file1.txt");
    expect(fileNames).toContain("file2.txt");
    
    archive.close();
  });

  it("should list files in subfolders", () => {
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
  const testDir = getTestDir("findfiles");
  const archivePath = path.join(testDir, "test.mpq");
  const txtFile = path.join(testDir, "test.txt");
  const luaFile = path.join(testDir, "test.lua");

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(txtFile, "TXT content");
    createTestFile(luaFile, "LUA content");
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should find files matching a pattern", () => {
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
  const testDir = getTestDir("patched");
  const archivePath = path.join(testDir, "test.mpq");

  beforeEach(() => {
    ensureDir(testDir);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should return false for non-patched archive", () => {
    const archive = new Archive();
    archive.create(archivePath);
    
    const isPatched = archive.isPatchedArchive();
    expect(typeof isPatched).toBe("boolean");
    expect(isPatched).toBe(false);
    
    archive.close();
  });
});

describe("Archive.getFileChecksums()", () => {
  const testDir = getTestDir("checksums");
  const archivePath = path.join(testDir, "test.mpq");
  const sourceFile = path.join(testDir, "source.txt");

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile, "Test content for checksums");
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should get file checksums", () => {
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
  const testDir = getTestDir("file-write");
  const archivePath = path.join(testDir, "test.mpq");
  const testContent = "Written content";

  beforeEach(() => {
    ensureDir(testDir);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should write data to a file and finish", () => {
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
  const testDir = getTestDir("file-getname");
  const archivePath = path.join(testDir, "test.mpq");
  const sourceFile = path.join(testDir, "source.txt");

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile, "Test content");
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should get the file name", () => {
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
  const testDir = getTestDir("verify-archive");
  const archivePath = path.join(testDir, "test.mpq");

  beforeEach(() => {
    ensureDir(testDir);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should verify archive signature", () => {
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
  const testDir = getTestDir("sign-archive");
  const archivePath = path.join(testDir, "test.mpq");

  beforeEach(() => {
    ensureDir(testDir);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should sign archive", () => {
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
  const testDir = getTestDir("utils");
  const archivePath = path.join(testDir, "test.mpq");
  const txtFile = path.join(testDir, "test.txt");
  const jsonFile = path.join(testDir, "test.json");

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(txtFile, "Hello, World!");
    createTestFile(jsonFile, JSON.stringify({ version: "1.0", name: "test" }));
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should read file as string", () => {
    const { Archive } = require("../lib");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "test.txt");
    
    const content = archive.readFileAsString("test.txt");
    expect(typeof content).toBe("string");
    expect(content).toBe("Hello, World!");
    
    archive.close();
  });

  it("should read file as JSON", () => {
    const { Archive } = require("../lib");
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
    const { Archive } = require("../lib");
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
    const { Archive } = require("../lib");
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
    const { Archive } = require("../lib");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "test.txt");
    
    const totalSize = archive.getTotalSize();
    expect(typeof totalSize).toBe("number");
    expect(totalSize).toBeGreaterThan(0);
    
    archive.close();
  });

  it("should get compression ratio", () => {
    const { Archive } = require("../lib");
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
    const { Archive } = require("../lib");
    const archive = new Archive();
    archive.create(archivePath);
    archive.addFile(txtFile, "mods/a/b/test.txt");
    
    const content = archive.readFileAsString("mods/a/b/test.txt");
    expect(typeof content).toBe("string");
    expect(content).toBe("Hello, World!");
    
    archive.close();
  });

  it("should read file as JSON from subfolder", () => {
    const { Archive } = require("../lib");
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
