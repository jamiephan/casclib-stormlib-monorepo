import { Archive, StormError, withArchiveAsync } from "../lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const BASE_DIR = path.join(os.tmpdir(), "STORMLIB_TEST", "modern-api");

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

describe("Static factories", () => {
  it("Archive.create returns an opened archive", () => {
    const testDir = getTestDir("factory-create");
    ensureDir(testDir);
    const archive = Archive.create(path.join(testDir, "test.mpq"));
    expect(archive.isOpen).toBe(true);
    archive.close();
    expect(archive.isOpen).toBe(false);
  });

  it("Archive.open returns an opened archive", () => {
    const archivePath = buildArchive("factory-open", { "hello.txt": "hi" });
    const archive = Archive.open(archivePath);
    expect(archive.isOpen).toBe(true);
    expect(archive.hasFile("hello.txt")).toBe(true);
    archive.close();
  });

  it("Archive.openAsync opens on a worker thread", async () => {
    const archivePath = buildArchive("factory-open-async", { "hello.txt": "hi" });
    const archive = await Archive.openAsync(archivePath);
    expect(archive.isOpen).toBe(true);
    expect(archive.hasFile("hello.txt")).toBe(true);
    archive.close();
  });
});

describe("Async file operations", () => {
  const content = "Async file content — read me off the event loop!";

  it("readFileAsync / File.readAllAsync match sync reads", async () => {
    const archivePath = buildArchive("async-read", { "data.txt": content });
    const archive = Archive.open(archivePath);
    try {
      const sync = archive.readFile("data.txt");
      const viaArchive = await archive.readFileAsync("data.txt");
      expect(viaArchive.equals(sync)).toBe(true);

      const file = archive.openFile("data.txt");
      try {
        const viaFile = await file.readAllAsync();
        expect(viaFile.toString()).toBe(content);
      } finally {
        file.close();
      }
    } finally {
      archive.close();
    }
  });

  it("extractFileAsync writes the file to disk", async () => {
    const archivePath = buildArchive("async-extract", { "data.txt": content });
    const out = path.join(getTestDir("async-extract"), "out.txt");
    const archive = Archive.open(archivePath);
    try {
      const ok = await archive.extractFileAsync("data.txt", out);
      expect(ok).toBe(true);
      expect(fs.readFileSync(out, "utf-8")).toBe(content);
    } finally {
      archive.close();
    }
  });

  it("withArchiveAsync closes the archive after the callback resolves", async () => {
    const archivePath = buildArchive("with-archive-async", { "data.txt": content });
    let captured: Archive | undefined;
    const text = await withArchiveAsync(async a => {
      captured = a;
      await a.openAsync(archivePath);
      return (await a.readFileAsync("data.txt")).toString();
    });
    expect(text).toBe(content);
    expect(captured!.isOpen).toBe(false);
  });
});

describe("StormError", () => {
  it("sync open failure throws StormError with code and codeName", () => {
    const archive = new Archive();
    try {
      archive.open(path.join(getTestDir("storm-error"), "missing.mpq"));
      fail("expected open() to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(StormError);
      expect(typeof (err as StormError).code).toBe("number");
      expect((err as StormError).code).toBeGreaterThan(0);
      expect(typeof (err as StormError).codeName).toBe("string");
    }
  });

  it("async open failure rejects with StormError", async () => {
    const archive = new Archive();
    await expect(
      archive.openAsync(path.join(getTestDir("storm-error"), "missing.mpq"))
    ).rejects.toBeInstanceOf(StormError);
  });

  it("opening a missing file in an archive throws StormError", () => {
    const archivePath = buildArchive("storm-error-file", { "exists.txt": "x" });
    const archive = Archive.open(archivePath);
    try {
      expect(() => archive.openFile("missing.txt")).toThrow(StormError);
    } finally {
      archive.close();
    }
  });
});

describe("Iteration", () => {
  it("files() and Symbol.iterator yield archive entries", () => {
    const archivePath = buildArchive("iteration", {
      "a.txt": "A",
      "b.txt": "B",
      "sub/c.txt": "C"
    });
    const archive = Archive.open(archivePath);
    try {
      const viaFiles = [...archive.files("*.txt")].map(f => f.name);
      expect(viaFiles).toEqual(expect.arrayContaining(["a.txt", "b.txt"]));

      const viaIterator = [...archive].map(f => f.name);
      expect(viaIterator).toEqual(expect.arrayContaining(["a.txt", "b.txt", "sub/c.txt"]));
    } finally {
      archive.close();
    }
  });
});
