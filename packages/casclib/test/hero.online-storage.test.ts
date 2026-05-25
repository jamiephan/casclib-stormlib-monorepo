import { Storage, File, withStorage } from "../lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const TEMP_DIR = os.tmpdir() + "/CASCLIB_TESTS_hero";

describe("CascLib - Heroes of the Storm (hero)", () => {
  describe("Online Storage", () => {
    let storage: Storage;

    const TEST_ONLINE_STORAGE = `${TEMP_DIR}*hero*us`;

    // Open storage once before all tests to reuse cached data
    beforeAll(() => {
      storage = new Storage();
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    // Clean up after all tests complete
    afterAll(() => {
      if (storage) {
        storage.close();
        // Delete temp directory if it exists
        if (fs.existsSync(TEMP_DIR)) {
          try {
            fs.rmSync(TEMP_DIR, { recursive: true, force: true });
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    });

    it("should list XML files (total file count > 1)", () => {
      let fileCount = 0;
      const findData = storage.findFirstFile("*.xml");

      if (findData) {
        fileCount++;

        // Count additional files
        while (storage.findNextFile()) {
          fileCount++;
        }

        storage.findClose();
      }

      expect(fileCount).toBeGreaterThan(1);
    });

    it("should read DataBuildId.txt and content should start with 'B'", () => {
      const fileName = "mods/core.stormmod/base.stormdata/DataBuildId.txt";
      expect(storage.fileExists(fileName)).toBe(true);

      const file = storage.openFile(fileName);
      const content = file.readAll();
      const contentStr = content.toString("utf8");

      expect(contentStr.startsWith("B")).toBe(true);

      file.close();
    });

    it("should get file info for DataBuildId.txt", () => {
      const fileName = "mods/core.stormmod/base.stormdata/DataBuildId.txt";
      const info = storage.getFileInfo(fileName);

      expect(info).not.toBeNull();
      expect(info).toHaveProperty("name");
      expect(info).toHaveProperty("size");
      expect(typeof info?.size).toBe("number");
      expect(info?.size).toBeGreaterThan(0);
    });

    it("should verify file does not exist for invalid path", () => {
      const invalidFileName = "non/existent/file.txt";
      const exists = storage.fileExists(invalidFileName);

      expect(exists).toBe(false);
    });

    it("should throw when opening non-existent file", () => {
      expect(() => {
        storage.openFile("non/existent/file.txt");
      }).toThrow();
    });

    it("should read file in chunks", () => {
      const fileName = "mods/core.stormmod/base.stormdata/DataBuildId.txt";
      const file = storage.openFile(fileName);

      const chunk1 = file.read(5);
      const chunk2 = file.read(5);

      expect(Buffer.isBuffer(chunk1)).toBe(true);
      expect(Buffer.isBuffer(chunk2)).toBe(true);
      expect(chunk1.length).toBeLessThanOrEqual(5);
      expect(chunk2.length).toBeLessThanOrEqual(5);

      file.close();
    });

    it("should handle file positioning", () => {
      const fileName = "mods/core.stormmod/base.stormdata/DataBuildId.txt";
      const file = storage.openFile(fileName);
      const size = file.getSize();

      expect(size).toBeGreaterThan(0);

      // Set position to middle of file
      const midPos = Math.floor(size / 2);
      file.setPosition(midPos);
      const currentPos = file.getPosition();

      expect(currentPos).toBe(midPos);

      file.close();
    });

    it("should list multiple file types", () => {
      const patterns = ["*.xml", "*.txt"];
      const results: { [key: string]: number } = {};

      for (const pattern of patterns) {
        let count = 0;
        const findData = storage.findFirstFile(pattern);

        if (findData) {
          count++;
          while (storage.findNextFile()) {
            count++;
          }
          storage.findClose();
        }

        results[pattern] = count;
      }

      // Expect at least some files for each pattern
      expect(results["*.xml"]).toBeGreaterThan(0);
      expect(results["*.txt"]).toBeGreaterThan(0);
    });

    it("should verify file size matches between getFileInfo and file.getSize", () => {
      const fileName = "mods/core.stormmod/base.stormdata/DataBuildId.txt";
      const info = storage.getFileInfo(fileName);
      const file = storage.openFile(fileName);
      const fileSize = file.getSize();

      expect(info?.size).toBe(fileSize);

      file.close();
    });

    it("should handle multiple sequential file operations", () => {
      const fileName = "mods/core.stormmod/base.stormdata/DataBuildId.txt";

      // First operation
      const file1 = storage.openFile(fileName);
      const content1 = file1.readAll();
      file1.close();

      // Second operation
      const file2 = storage.openFile(fileName);
      const content2 = file2.readAll();
      file2.close();

      // Both should read the same content
      expect(content1.equals(content2)).toBe(true);
    });
  });

  describe("CascStorage", () => {
    let storage: Storage;

    beforeEach(() => {
      storage = new Storage();
    });

    afterEach(() => {
      if (storage) {
        storage.close();
      }
    });

    it("should create a storage instance", () => {
      expect(storage).toBeInstanceOf(Storage);
    });

    it("should throw error when opening non-existent storage", () => {
      expect(() => {
        storage.open("/non/existent/path");
      }).toThrow();
    });
  });

  describe("Module exports", () => {
    it("should export Storage", () => {
      expect(Storage).toBeDefined();
      expect(typeof Storage).toBe("function");
    });

    it("should export File", () => {
      expect(File).toBeDefined();
      expect(typeof File).toBe("function");
    });
  });

  // =====================================================================
  // Coverage for commit c3ce564: Symbol.dispose, withStorage, hasFile
  // alias, readFile/readFileAsString/readFileAsJson, extractFile,
  // findAllFiles, getFileNames, forEachFile, getTotalFileCount.
  // =====================================================================

  describe("Helpers (commit c3ce564)", () => {
    let helperStorage: Storage;
    const dataBuildId = "mods/heroesdata.stormmod/base.stormdata/GameData/DataBuildId.txt";
    const HELPERS_TEMP_DIR = os.tmpdir() + "/CASCLIB_TESTS_helpers_hero";
    const HELPERS_CONN = `${HELPERS_TEMP_DIR}*hero*us`;

    beforeAll(() => {
      helperStorage = new Storage();
      helperStorage.openOnline(HELPERS_CONN);
    });

    afterAll(() => {
      if (helperStorage) {
        try { helperStorage.close(); } catch { /* ignore */ }
        if (fs.existsSync(HELPERS_TEMP_DIR)) {
          try { fs.rmSync(HELPERS_TEMP_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
        }
      }
    });

    describe("Storage.hasFile (alias for fileExists)", () => {
      it("returns same result as fileExists for existing file", () => {
        expect(helperStorage.hasFile(dataBuildId)).toBe(true);
        expect(helperStorage.hasFile(dataBuildId)).toBe(helperStorage.fileExists(dataBuildId));
      });

      it("returns false for missing file", () => {
        expect(helperStorage.hasFile("does/not/exist.xyz")).toBe(false);
      });
    });

    describe("Storage.readFile / readFileAsString / readFileAsJson", () => {
      it("readFile returns non-empty Buffer", () => {
        const buf = helperStorage.readFile(dataBuildId);
        expect(Buffer.isBuffer(buf)).toBe(true);
        expect(buf.length).toBeGreaterThan(0);
      });

      it("readFileAsString decodes the same bytes as readFile", () => {
        const buf = helperStorage.readFile(dataBuildId);
        const str = helperStorage.readFileAsString(dataBuildId);
        expect(str).toBe(buf.toString("utf-8"));
        expect(str.startsWith("B")).toBe(true);
      });

      it("readFileAsJson throws SyntaxError on non-JSON content", () => {
        expect(() => helperStorage.readFileAsJson(dataBuildId)).toThrow(SyntaxError);
      });
    });

    describe("Storage.extractFile", () => {
      it("writes contents to disk and returns byte count", () => {
        const out = path.join(os.tmpdir(), `casclib_extractFile_${Date.now()}.bin`);
        try {
          const written = helperStorage.extractFile(dataBuildId, out);
          const stat = fs.statSync(out);
          expect(written).toBe(stat.size);
          expect(written).toBeGreaterThan(0);
        } finally {
          if (fs.existsSync(out)) fs.unlinkSync(out);
        }
      });
    });

    describe("Storage.findAllFiles / getFileNames / forEachFile", () => {
      it("findAllFiles returns an array of CascFindData entries", () => {
        const entries = helperStorage.findAllFiles("*.xml");
        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBeGreaterThan(0);
        expect(entries[0]).toHaveProperty("fileName");
        expect(entries[0]).toHaveProperty("fileSize");
      });

      it("getFileNames returns string array equal to fileName-mapped entries", () => {
        const names = helperStorage.getFileNames("*.txt");
        const entries = helperStorage.findAllFiles("*.txt");
        expect(names).toEqual(entries.map(e => e.fileName));
      });

      it("forEachFile visits each entry exactly once", () => {
        const seen: string[] = [];
        helperStorage.forEachFile("*.txt", e => { seen.push(e.fileName); });
        const names = helperStorage.getFileNames("*.txt");
        expect(seen.slice().sort()).toEqual(names.slice().sort());
      });

      it("forEachFile stops when callback returns false", () => {
        let count = 0;
        helperStorage.forEachFile("*.xml", () => {
          count++;
          if (count >= 2) return false;
          return undefined;
        });
        expect(count).toBe(2);
      });
    });

    describe("Storage.getTotalFileCount", () => {
      it("returns a positive integer", () => {
        const total = helperStorage.getTotalFileCount();
        expect(Number.isInteger(total)).toBe(true);
        expect(total).toBeGreaterThan(0);
      });
    });

    describe("withStorage", () => {
      const WS_TEMP_DIR = os.tmpdir() + "/CASCLIB_TESTS_withStorage_hero";
      const WS_CONN = `${WS_TEMP_DIR}*hero*us`;

      afterAll(() => {
        if (fs.existsSync(WS_TEMP_DIR)) {
          try { fs.rmSync(WS_TEMP_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
        }
      });

      it("invokes callback and returns its value", () => {
        const got = withStorage(s => {
          s.openOnline(WS_CONN);
          return s.fileExists(dataBuildId);
        });
        expect(got).toBe(true);
      });

      it("closes storage even when callback throws", () => {
        const sentinel = new Error("boom");
        expect(() => withStorage(s => {
          s.openOnline(WS_CONN);
          throw sentinel;
        })).toThrow(sentinel);
      });

      it("tolerates a callback that closes the storage itself", () => {
        expect(() => withStorage(s => {
          s.openOnline(WS_CONN);
          s.close();
        })).not.toThrow();
      });
    });

    describe("Symbol.dispose", () => {
      it("is defined on the global Symbol after module load", () => {
        expect(typeof (Symbol as any).dispose).toBe("symbol");
      });

      it("Storage[Symbol.dispose] closes the storage", () => {
        const tmp = os.tmpdir() + "/CASCLIB_TESTS_dispose_hero";
        const conn = `${tmp}*hero*us`;
        const s = new Storage();
        try {
          s.openOnline(conn);
          expect(s.fileExists(dataBuildId)).toBe(true);
          (s as any)[(Symbol as any).dispose]();
          expect(() => s.fileExists("anything")).toThrow(/not open/i);
        } finally {
          try { s.close(); } catch { /* already closed */ }
          if (fs.existsSync(tmp)) {
            try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
          }
        }
      });

      it("File[Symbol.dispose] closes the file", () => {
        const f = helperStorage.openFile(dataBuildId);
        expect(f.readAll().length).toBeGreaterThan(0);
        (f as any)[(Symbol as any).dispose]();
        expect(f.close()).toBe(false);
      });
    });
  });
});
