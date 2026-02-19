import { Archive, File } from "../lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Helper to get unique test directory
const getTestDir = (testName: string): string => {
  return path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", testName);
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

// Path to test stormmap files
const stormmapDir = path.join(__dirname, "files", "hero", "s2ma");
const alteracPassMap = path.join(stormmapDir, "AlteracPass20260219.stormmap");
const tutorialMap = path.join(stormmapDir, "ManualTutorialMapMechanics20260219.stormmap");

// Clean up stormmap test folder before all tests
beforeAll(() => {
  const stormmapTestDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap");
  cleanupDir(stormmapTestDir);
});

afterAll(() => {
  const stormmapTestDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap");
  cleanupDir(stormmapTestDir);
});

describe("StormMap Basic Open/Close Tests", () => {
  const testDir = getTestDir("basic-open-close");
  let alteracPassCopy: string;
  let tutorialMapCopy: string;

  beforeEach(() => {
    ensureDir(testDir);
    alteracPassCopy = path.join(testDir, "AlteracPass.stormmap");
    tutorialMapCopy = path.join(testDir, "Tutorial.stormmap");
    fs.copyFileSync(alteracPassMap, alteracPassCopy);
    fs.copyFileSync(tutorialMap, tutorialMapCopy);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should open and close AlteracPass20260219.stormmap", () => {
    const archive = new Archive();
    archive.open(alteracPassCopy);
    const result = archive.close();
    expect(result).toBe(true);
  });

  it("should open and close ManualTutorialMapMechanics20260219.stormmap", () => {
    const archive = new Archive();
    archive.open(tutorialMapCopy);
    const result = archive.close();
    expect(result).toBe(true);
  });
});

describe("AlteracPass20260219.stormmap - MapScript.galaxy", () => {
  const testDir = getTestDir("alterac-mapscript");
  let alteracPassCopy: string;

  beforeEach(() => {
    ensureDir(testDir);
    alteracPassCopy = path.join(testDir, "AlteracPass.stormmap");
    fs.copyFileSync(alteracPassMap, alteracPassCopy);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should contain MapScript.galaxy file", () => {
    const archive = new Archive();
    archive.open(alteracPassCopy);
    expect(archive.hasFile("MapScript.galaxy")).toBe(true);
    archive.close();
  });

  it("should read MapScript.galaxy and contain 'Alterac Pass'", () => {
    const archive = new Archive();
    archive.open(alteracPassCopy);
    const file = archive.openFile("MapScript.galaxy");
    const content = file.readAll().toString("utf-8");
    expect(content).toContain("Alterac Pass");
    file.close();
    archive.close();
  });

  it("should read MapScript.galaxy and contain 'InitMap'", () => {
    const archive = new Archive();
    archive.open(alteracPassCopy);
    const file = archive.openFile("MapScript.galaxy");
    const content = file.readAll().toString("utf-8");
    expect(content).toContain("InitMap");
    file.close();
    archive.close();
  });
});

describe("AlteracPass20260219.stormmap - GameStrings.txt", () => {
  const testDir = getTestDir("alterac-gamestrings");
  let alteracPassCopy: string;

  beforeEach(() => {
    ensureDir(testDir);
    alteracPassCopy = path.join(testDir, "AlteracPass.stormmap");
    fs.copyFileSync(alteracPassMap, alteracPassCopy);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should contain enUS.StormData\\LocalizedData\\GameStrings.txt file", () => {
    const archive = new Archive();
    archive.open(alteracPassCopy);
    expect(archive.hasFile("enUS.StormData\\LocalizedData\\GameStrings.txt")).toBe(true);
    archive.close();
  });

  it("should read GameStrings.txt and contain 'DocInfo/Name=Alterac Pass'", () => {
    const archive = new Archive();
    archive.open(alteracPassCopy);
    const file = archive.openFile("enUS.StormData\\LocalizedData\\GameStrings.txt");
    const content = file.readAll().toString("utf-8");
    expect(content).toContain("DocInfo/Name=Alterac Pass");
    file.close();
    archive.close();
  });
});

describe("ManualTutorialMapMechanics20260219.stormmap - mapscript.galaxy", () => {
  const testDir = getTestDir("tutorial-mapscript");
  let tutorialMapCopy: string;

  beforeEach(() => {
    ensureDir(testDir);
    tutorialMapCopy = path.join(testDir, "Tutorial.stormmap");
    fs.copyFileSync(tutorialMap, tutorialMapCopy);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should contain mapscript.galaxy file (lowercase)", () => {
    const archive = new Archive();
    archive.open(tutorialMapCopy);
    expect(archive.hasFile("mapscript.galaxy")).toBe(true);
    archive.close();
  });

  it("should read mapscript.galaxy and contain 'Tutorial Map Mechanics'", () => {
    const archive = new Archive();
    archive.open(tutorialMapCopy);
    const file = archive.openFile("mapscript.galaxy");
    const content = file.readAll().toString("utf-8");
    expect(content).toContain("Tutorial Map Mechanics");
    file.close();
    archive.close();
  });

  it("should read mapscript.galaxy and contain 'InitMap'", () => {
    const archive = new Archive();
    archive.open(tutorialMapCopy);
    const file = archive.openFile("mapscript.galaxy");
    const content = file.readAll().toString("utf-8");
    expect(content).toContain("InitMap");
    file.close();
    archive.close();
  });
});

describe("ManualTutorialMapMechanics20260219.stormmap - gamestrings.txt", () => {
  const testDir = getTestDir("tutorial-gamestrings");
  let tutorialMapCopy: string;

  beforeEach(() => {
    ensureDir(testDir);
    tutorialMapCopy = path.join(testDir, "Tutorial.stormmap");
    fs.copyFileSync(tutorialMap, tutorialMapCopy);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should contain enus.stormdata\\localizeddata\\gamestrings.txt file (lowercase)", () => {
    const archive = new Archive();
    archive.open(tutorialMapCopy);
    expect(archive.hasFile("enus.stormdata\\localizeddata\\gamestrings.txt")).toBe(true);
    archive.close();
  });

  it("should read gamestrings.txt and contain 'DocInfo/Name=Tutorial Map Mechanics'", () => {
    const archive = new Archive();
    archive.open(tutorialMapCopy);
    const file = archive.openFile("enus.stormdata\\localizeddata\\gamestrings.txt");
    const content = file.readAll().toString("utf-8");
    expect(content).toContain("DocInfo/Name=Tutorial Map Mechanics");
    file.close();
    archive.close();
  });
});

describe("StormMap File Operations - Add, Remove, Rename", () => {
  const testDir = getTestDir("file-operations");
  const testArchivePath = path.join(testDir, "test-operations.stormmap");
  const sourceFile = path.join(testDir, "source.txt");
  const testContent = "Test content for file operations";

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile, testContent);
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should add a file to a stormmap archive", () => {
    const archive = new Archive();
    archive.create(testArchivePath);
    
    const result = archive.addFile(sourceFile, "test.txt");
    expect(result).toBe(true);
    expect(archive.hasFile("test.txt")).toBe(true);
    
    archive.close();
  });

  it("should remove a file from a stormmap archive", () => {
    const archive = new Archive();
    archive.create(testArchivePath);
    archive.addFile(sourceFile, "test.txt");
    expect(archive.hasFile("test.txt")).toBe(true);
    
    const result = archive.removeFile("test.txt");
    expect(result).toBe(true);
    expect(archive.hasFile("test.txt")).toBe(false);
    
    archive.close();
  });

  it("should rename a file in a stormmap archive", () => {
    const archive = new Archive();
    archive.create(testArchivePath);
    archive.addFile(sourceFile, "old-name.txt");
    expect(archive.hasFile("old-name.txt")).toBe(true);
    
    const result = archive.renameFile("old-name.txt", "new-name.txt");
    expect(result).toBe(true);
    expect(archive.hasFile("old-name.txt")).toBe(false);
    expect(archive.hasFile("new-name.txt")).toBe(true);
    
    archive.close();
  });
});

describe("StormMap File Count Operations", () => {
  const testDir = getTestDir("file-count");
  const testArchivePath = path.join(testDir, "test-count.stormmap");
  const sourceFile1 = path.join(testDir, "source1.txt");
  const sourceFile2 = path.join(testDir, "source2.txt");
  const sourceFile3 = path.join(testDir, "source3.txt");

  beforeEach(() => {
    ensureDir(testDir);
    createTestFile(sourceFile1, "Content 1");
    createTestFile(sourceFile2, "Content 2");
    createTestFile(sourceFile3, "Content 3");
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should get and set max file count for stormmap archive", () => {
    const archive = new Archive();
    archive.create(testArchivePath, { maxFileCount: 100 });
    
    const initialMax = archive.getMaxFileCount();
    expect(initialMax).toBeGreaterThan(0);
    
    const result = archive.setMaxFileCount(500);
    expect(result).toBe(true);
    
    const newMax = archive.getMaxFileCount();
    expect(newMax).toBeGreaterThanOrEqual(500);
    
    archive.close();
  });

  it("should add multiple files to stormmap archive", () => {
    const archive = new Archive();
    archive.create(testArchivePath);
    
    archive.addFile(sourceFile1, "file1.txt");
    archive.addFile(sourceFile2, "file2.txt");
    archive.addFile(sourceFile3, "file3.txt");
    
    expect(archive.hasFile("file1.txt")).toBe(true);
    expect(archive.hasFile("file2.txt")).toBe(true);
    expect(archive.hasFile("file3.txt")).toBe(true);
    
    archive.close();
  });
});

describe("AlteracPass20260219.stormmap - Modify Operations", () => {
  const testDir = getTestDir("alterac-modify");
  const testArchivePath = path.join(testDir, "AlteracPass-copy.stormmap");
  const newFile = path.join(testDir, "new-file.txt");

  beforeEach(() => {
    ensureDir(testDir);
    // Copy the original stormmap to a test location
    fs.copyFileSync(alteracPassMap, testArchivePath);
    createTestFile(newFile, "New test file content");
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should add a new file to AlteracPass stormmap", () => {
    const archive = new Archive();
    archive.open(testArchivePath);
    
    const result = archive.addFile(newFile, "CustomData/test.txt");
    expect(result).toBe(true);
    archive.flush(); // Flush after adding
    expect(archive.hasFile("CustomData/test.txt")).toBe(true);
    
    archive.close();
  });

  it("should extract and re-add a file to AlteracPass stormmap", () => {
    const archive = new Archive();
    archive.open(testArchivePath);
    
    // Extract a file
    const extractPath = path.join(testDir, "extracted.galaxy");
    archive.extractFile("MapScript.galaxy", extractPath);
    expect(fs.existsSync(extractPath)).toBe(true);
    
    // Remove and re-add with a different name to avoid hash table conflicts
    archive.removeFile("MapScript.galaxy");
    archive.flush(); // Flush changes to update hash table
    expect(archive.hasFile("MapScript.galaxy")).toBe(false);
    
    archive.addFile(extractPath, "MapScript_restored.galaxy");
    archive.flush(); // Flush after adding
    expect(archive.hasFile("MapScript_restored.galaxy")).toBe(true);
    
    archive.close();
  });
});

describe("ManualTutorialMapMechanics20260219.stormmap - Modify Operations", () => {
  const testDir = getTestDir("tutorial-modify");
  const testArchivePath = path.join(testDir, "Tutorial-copy.stormmap");
  const newFile = path.join(testDir, "new-file.txt");

  beforeEach(() => {
    ensureDir(testDir);
    // Copy the original stormmap to a test location
    fs.copyFileSync(tutorialMap, testArchivePath);
    createTestFile(newFile, "New tutorial file content");
  });

  afterEach(() => {
    cleanupDir(testDir);
  });

  it("should add a new file to Tutorial stormmap", () => {
    const archive = new Archive();
    archive.open(testArchivePath);
    
    const result = archive.addFile(newFile, "customdata/test.txt");
    expect(result).toBe(true);
    archive.flush(); // Flush after adding
    expect(archive.hasFile("customdata/test.txt")).toBe(true);
    
    archive.close();
  });

  it("should rename a file in Tutorial stormmap", () => {
    const archive = new Archive();
    archive.open(testArchivePath);
    
    // Add a test file first
    archive.addFile(newFile, "original.txt");
    archive.flush(); // Flush after adding
    expect(archive.hasFile("original.txt")).toBe(true);
    
    // Rename it
    const result = archive.renameFile("original.txt", "renamed.txt");
    expect(result).toBe(true);
    archive.flush(); // Flush after renaming
    expect(archive.hasFile("original.txt")).toBe(false);
    expect(archive.hasFile("renamed.txt")).toBe(true);
    
    archive.close();
  });
});
