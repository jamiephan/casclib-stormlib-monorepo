import { Archive, File } from "../lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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


// Clean up entire STORMLIB_TEST folder before all tests
beforeAll(() => {
  const stormlibTestDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap");
  cleanupDir(stormlibTestDir);
  ensureDir(stormlibTestDir);
});

afterAll(() => {
  const stormlibTestDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap");
  cleanupDir(stormlibTestDir);
});


describe("StormMap Basic Open/Close Tests", () => {
  it("should open and close AlteracPass20260219.stormmap", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "basic-open-close", "test1");
    ensureDir(testDir);
    const alteracPassCopy = path.join(testDir, "AlteracPass.stormmap");
    fs.copyFileSync(alteracPassMap, alteracPassCopy);
    
    const archive = new Archive();
    archive.open(alteracPassCopy);
    const result = archive.close();
    expect(result).toBe(true);
  });

  it("should open and close ManualTutorialMapMechanics20260219.stormmap", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "basic-open-close", "test2");
    ensureDir(testDir);
    const tutorialMapCopy = path.join(testDir, "Tutorial.stormmap");
    fs.copyFileSync(tutorialMap, tutorialMapCopy);
    
    const archive = new Archive();
    archive.open(tutorialMapCopy);
    const result = archive.close();
    expect(result).toBe(true);
  });
});

describe("AlteracPass20260219.stormmap - MapScript.galaxy", () => {
  it("should contain MapScript.galaxy file", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "alterac-mapscript", "test1");
    ensureDir(testDir);
    const alteracPassCopy = path.join(testDir, "AlteracPass.stormmap");
    fs.copyFileSync(alteracPassMap, alteracPassCopy);
    
    const archive = new Archive();
    archive.open(alteracPassCopy);
    expect(archive.hasFile("MapScript.galaxy")).toBe(true);
    archive.close();
  });

  it("should read MapScript.galaxy and contain 'Alterac Pass'", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "alterac-mapscript", "test2");
    ensureDir(testDir);
    const alteracPassCopy = path.join(testDir, "AlteracPass.stormmap");
    fs.copyFileSync(alteracPassMap, alteracPassCopy);
    
    const archive = new Archive();
    archive.open(alteracPassCopy);
    const file = archive.openFile("MapScript.galaxy");
    const content = file.readAll().toString("utf-8");
    expect(content).toContain("Alterac Pass");
    file.close();
    archive.close();
  });

  it("should read MapScript.galaxy and contain 'InitMap'", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "alterac-mapscript", "test3");
    ensureDir(testDir);
    const alteracPassCopy = path.join(testDir, "AlteracPass.stormmap");
    fs.copyFileSync(alteracPassMap, alteracPassCopy);
    
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
  it("should contain enUS.StormData\\LocalizedData\\GameStrings.txt file", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "alterac-gamestrings", "test1");
    ensureDir(testDir);
    const alteracPassCopy = path.join(testDir, "AlteracPass.stormmap");
    fs.copyFileSync(alteracPassMap, alteracPassCopy);
    
    const archive = new Archive();
    archive.open(alteracPassCopy);
    expect(archive.hasFile("enUS.StormData\\LocalizedData\\GameStrings.txt")).toBe(true);
    archive.close();
  });

  it("should read GameStrings.txt and contain 'DocInfo/Name=Alterac Pass'", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "alterac-gamestrings", "test2");
    ensureDir(testDir);
    const alteracPassCopy = path.join(testDir, "AlteracPass.stormmap");
    fs.copyFileSync(alteracPassMap, alteracPassCopy);
    
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
  it("should contain mapscript.galaxy file (lowercase)", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "tutorial-mapscript", "test1");
    ensureDir(testDir);
    const tutorialMapCopy = path.join(testDir, "Tutorial.stormmap");
    fs.copyFileSync(tutorialMap, tutorialMapCopy);
    
    const archive = new Archive();
    archive.open(tutorialMapCopy);
    expect(archive.hasFile("mapscript.galaxy")).toBe(true);
    archive.close();
  });

  it("should read mapscript.galaxy and contain 'Tutorial Map Mechanics'", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "tutorial-mapscript", "test2");
    ensureDir(testDir);
    const tutorialMapCopy = path.join(testDir, "Tutorial.stormmap");
    fs.copyFileSync(tutorialMap, tutorialMapCopy);
    
    const archive = new Archive();
    archive.open(tutorialMapCopy);
    const file = archive.openFile("mapscript.galaxy");
    const content = file.readAll().toString("utf-8");
    expect(content).toContain("Tutorial Map Mechanics");
    file.close();
    archive.close();
  });

  it("should read mapscript.galaxy and contain 'InitMap'", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "tutorial-mapscript", "test3");
    ensureDir(testDir);
    const tutorialMapCopy = path.join(testDir, "Tutorial.stormmap");
    fs.copyFileSync(tutorialMap, tutorialMapCopy);
    
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
  it("should contain enus.stormdata\\localizeddata\\gamestrings.txt file (lowercase)", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "tutorial-gamestrings", "test1");
    ensureDir(testDir);
    const tutorialMapCopy = path.join(testDir, "Tutorial.stormmap");
    fs.copyFileSync(tutorialMap, tutorialMapCopy);
    
    const archive = new Archive();
    archive.open(tutorialMapCopy);
    expect(archive.hasFile("enus.stormdata\\localizeddata\\gamestrings.txt")).toBe(true);
    archive.close();
  });

  it("should read gamestrings.txt and contain 'DocInfo/Name=Tutorial Map Mechanics'", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "tutorial-gamestrings", "test2");
    ensureDir(testDir);
    const tutorialMapCopy = path.join(testDir, "Tutorial.stormmap");
    fs.copyFileSync(tutorialMap, tutorialMapCopy);
    
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
  it("should add a file to a stormmap archive", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "file-operations", "test1");
    ensureDir(testDir);
    const testArchivePath = path.join(testDir, "test-operations.stormmap");
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "Test content for file operations");
    
    const archive = new Archive();
    archive.create(testArchivePath);
    
    const result = archive.addFile(sourceFile, "test.txt");
    expect(result).toBe(true);
    expect(archive.hasFile("test.txt")).toBe(true);
    
    archive.close();
  });

  it("should remove a file from a stormmap archive", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "file-operations", "test2");
    ensureDir(testDir);
    const testArchivePath = path.join(testDir, "test-operations.stormmap");
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "Test content for file operations");
    
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
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "file-operations", "test3");
    ensureDir(testDir);
    const testArchivePath = path.join(testDir, "test-operations.stormmap");
    const sourceFile = path.join(testDir, "source.txt");
    createTestFile(sourceFile, "Test content for file operations");
    
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
  it("should get and set max file count for stormmap archive", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "file-count", "test1");
    ensureDir(testDir);
    const testArchivePath = path.join(testDir, "test-count.stormmap");
    
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
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "file-count", "test2");
    ensureDir(testDir);
    const testArchivePath = path.join(testDir, "test-count.stormmap");
    const sourceFile1 = path.join(testDir, "source1.txt");
    const sourceFile2 = path.join(testDir, "source2.txt");
    const sourceFile3 = path.join(testDir, "source3.txt");
    createTestFile(sourceFile1, "Content 1");
    createTestFile(sourceFile2, "Content 2");
    createTestFile(sourceFile3, "Content 3");
    
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
  it("should add a new file to AlteracPass stormmap", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "alterac-modify", "test1");
    ensureDir(testDir);
    const testArchivePath = path.join(testDir, "AlteracPass-copy.stormmap");
    const newFile = path.join(testDir, "new-file.txt");
    fs.copyFileSync(alteracPassMap, testArchivePath);
    createTestFile(newFile, "New test file content");
    
    const archive = new Archive();
    archive.open(testArchivePath);
    
    const result = archive.addFile(newFile, "CustomData/test.txt");
    expect(result).toBe(true);
    archive.flush(); // Flush after adding
    expect(archive.hasFile("CustomData/test.txt")).toBe(true);
    
    archive.close();
  });

  it("should extract and re-add a file to AlteracPass stormmap", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "alterac-modify", "test2");
    ensureDir(testDir);
    const testArchivePath = path.join(testDir, "AlteracPass-copy.stormmap");
    fs.copyFileSync(alteracPassMap, testArchivePath);
    
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
  it("should add a new file to Tutorial stormmap", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "tutorial-modify", "test1");
    ensureDir(testDir);
    const testArchivePath = path.join(testDir, "Tutorial-copy.stormmap");
    const newFile = path.join(testDir, "new-file.txt");
    fs.copyFileSync(tutorialMap, testArchivePath);
    createTestFile(newFile, "New tutorial file content");
    
    const archive = new Archive();
    archive.open(testArchivePath);
    
    const result = archive.addFile(newFile, "customdata/test.txt");
    expect(result).toBe(true);
    archive.flush(); // Flush after adding
    expect(archive.hasFile("customdata/test.txt")).toBe(true);
    
    archive.close();
  });

  it("should rename a file in Tutorial stormmap", () => {
    const testDir = path.join(os.tmpdir(), "STORMLIB_TEST", "stormmap", "tutorial-modify", "test2");
    ensureDir(testDir);
    const testArchivePath = path.join(testDir, "Tutorial-copy.stormmap");
    const newFile = path.join(testDir, "new-file.txt");
    fs.copyFileSync(tutorialMap, testArchivePath);
    createTestFile(newFile, "New tutorial file content");
    
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
