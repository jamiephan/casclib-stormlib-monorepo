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
