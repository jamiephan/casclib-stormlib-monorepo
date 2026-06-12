import { Storage, File, withStorage, CascError } from "../lib";
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

  describe("Helpers", () => {
    let helperStorage: Storage;
    const dataBuildId = "mods/core.stormmod/base.stormdata/DataBuildId.txt";
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

      it("readFileAsStringAsync matches the sync variant", async () => {
        const sync = helperStorage.readFileAsString(dataBuildId);
        await expect(helperStorage.readFileAsStringAsync(dataBuildId)).resolves.toBe(sync);
      });

    });

    describe("Storage.getFileSize", () => {
      it("matches the size reported by getFileInfo", () => {
        const size = helperStorage.getFileSize(dataBuildId);
        expect(size).toBeGreaterThan(0);
        expect(size).toBe(helperStorage.getFileInfo(dataBuildId)?.size);
      });

      it("throws CascError for missing files", () => {
        expect(() => helperStorage.getFileSize("does/not/exist.xyz")).toThrow(CascError);
      });
    });

    describe("Storage.getProductInfo", () => {
      it("returns the product code name and build number", () => {
        const info = helperStorage.getProductInfo();
        expect(info.codeName).toBe("hero");
        expect(info.buildNumber).toBeGreaterThan(0);
      });
    });

    describe("Storage.findFilesMatching", () => {
      it("returns only entries whose fileName matches the regex", () => {
        // CASC find data normalizes file names to lowercase
        const pattern = /databuildid\.txt$/i;
        const matches = helperStorage.findFilesMatching(pattern);
        expect(matches.length).toBeGreaterThan(0);
        expect(matches.every(f => pattern.test(f.fileName))).toBe(true);
        expect(matches.length).toBe(
          helperStorage.findAllFiles("*DataBuildId.txt").length
        );
      });

      it("returns an empty array when nothing matches", () => {
        expect(helperStorage.findFilesMatching(/^no-such-file-anywhere$/)).toEqual([]);
      });
    });

    describe("Storage.extractFiles / extractFilesAsync", () => {
      it("extracts files matching a regex, preserving directory structure", () => {
        const outDir = path.join(os.tmpdir(), `casclib_extractFiles_${Date.now()}`);
        try {
          const { extracted, failed } = helperStorage.extractFiles(outDir, /databuildid\.txt$/i);
          expect(extracted.length).toBeGreaterThan(0);
          expect(failed).toEqual([]);
          for (const name of extracted) {
            const onDisk = path.join(outDir, ...name.split(/[\\/]+/));
            expect(fs.existsSync(onDisk)).toBe(true);
          }
        } finally {
          fs.rmSync(outDir, { recursive: true, force: true });
        }
      });

      it("accepts a CASC mask string and matches the sync regex variant", async () => {
        const outDir = path.join(os.tmpdir(), `casclib_extractFilesAsync_${Date.now()}`);
        try {
          const result = await helperStorage.extractFilesAsync(outDir, "*DataBuildId.txt");
          expect(result.extracted.length).toBeGreaterThan(0);
          expect(result.failed).toEqual([]);
          const onDisk = path.join(outDir, ...result.extracted[0].split(/[\\/]+/));
          expect(fs.existsSync(onDisk)).toBe(true);
        } finally {
          fs.rmSync(outDir, { recursive: true, force: true });
        }
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

    describe("File 64-bit positioning and info", () => {
      it("getSize64 / setPosition64 / getPosition64 work", () => {
        const file = helperStorage.openFile(dataBuildId);
        try {
          const size = file.getSize64();
          expect(size).toBe(file.getSize());

          expect(file.setPosition64(2)).toBe(2);
          expect(file.getPosition64()).toBe(2);
          expect(file.getPosition()).toBe(2);
        } finally {
          file.close();
        }
      });

      it("getFileInfo(FullInfo) reports the content size", () => {
        const file = helperStorage.openFile(dataBuildId);
        try {
          const info = file.getFileInfo(2 /* CascFileInfoClass.FullInfo */);
          expect(info).toBeDefined();
          expect(info.contentSize).toBe(file.getSize64());
        } finally {
          file.close();
        }
      });
    });

    describe("Encryption keys", () => {
      it("addEncryptionKey and findEncryptionKey round-trip", () => {
        const keyName = 0x1122334455;
        const key = Buffer.from("00112233445566778899AABBCCDDEEFF", "hex");
        expect(helperStorage.addEncryptionKey(keyName, key)).toBe(true);
        const found = helperStorage.findEncryptionKey(keyName);
        expect(found).not.toBeNull();
        expect(found!.equals(key)).toBe(true);
      });

      it("addStringEncryptionKey registers a hex-string key", () => {
        expect(
          helperStorage.addStringEncryptionKey(0x66778899, "FFEEDDCCBBAA99887766554433221100")
        ).toBe(true);
        expect(helperStorage.findEncryptionKey(0x66778899)?.length).toBe(16);
      });

      it("importKeysFromString imports a key list", () => {
        const keyList = "00000000deadbeef 000102030405060708090A0B0C0D0E0F\n";
        expect(helperStorage.importKeysFromString(keyList)).toBe(true);
        const found = helperStorage.findEncryptionKey(0xdeadbeef);
        expect(found!.equals(Buffer.from("000102030405060708090A0B0C0D0E0F", "hex"))).toBe(true);
      });

      it("importKeysFromFile imports a key file", () => {
        const keyFile = path.join(os.tmpdir(), `casclib_keys_${Date.now()}.txt`);
        fs.writeFileSync(keyFile, "00000000cafebabe 0F0E0D0C0B0A09080706050403020100\n");
        try {
          expect(helperStorage.importKeysFromFile(keyFile)).toBe(true);
          expect(helperStorage.findEncryptionKey(0xcafebabe)?.length).toBe(16);
        } finally {
          fs.unlinkSync(keyFile);
        }
      });

      it("findEncryptionKey returns null for an unknown key", () => {
        expect(helperStorage.findEncryptionKey(0x424242424242)).toBeNull();
      });

      it("getNotFoundEncryptionKey returns a number or null", () => {
        const value = helperStorage.getNotFoundEncryptionKey();
        expect(value === null || typeof value === "number").toBe(true);
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

    describe("Modern API (factories, async, iterators, CascError)", () => {
      const MODERN_TEMP_DIR = os.tmpdir() + "/CASCLIB_TESTS_modern_hero";
      const MODERN_CONN = `${MODERN_TEMP_DIR}*hero*us`;

      afterAll(() => {
        if (fs.existsSync(MODERN_TEMP_DIR)) {
          try { fs.rmSync(MODERN_TEMP_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
        }
      });

      it("Storage.openOnlineAsync factory opens without blocking and reads async", async () => {
        const s = await Storage.openOnlineAsync(MODERN_CONN);
        try {
          expect(s.isOpen).toBe(true);
          const buf = await s.readFileAsync(dataBuildId);
          expect(Buffer.isBuffer(buf)).toBe(true);
          expect(buf.toString("utf-8").startsWith("B")).toBe(true);
        } finally {
          s.close();
        }
        expect(s.isOpen).toBe(false);
      }, 300_000); // opening an online storage downloads manifests from the CDN

      it("Storage.openOnline factory returns an opened storage", () => {
        // Reuses the cache populated by the async factory test above
        const s = Storage.openOnline(MODERN_CONN);
        try {
          expect(s.isOpen).toBe(true);
          expect(s.fileExists(dataBuildId)).toBe(true);
        } finally {
          s.close();
        }
        expect(s.isOpen).toBe(false);
      });

      it("File.readAllAsync matches sync readAll", async () => {
        const sync = helperStorage.readFile(dataBuildId);
        const file = helperStorage.openFile(dataBuildId);
        try {
          const async = await file.readAllAsync();
          expect(async.equals(sync)).toBe(true);
        } finally {
          file.close();
        }
      });

      it("files() generator lazily iterates and supports early break", () => {
        const seen: string[] = [];
        for (const entry of helperStorage.files("*.xml")) {
          seen.push(entry.fileName);
          if (seen.length >= 3) break;
        }
        expect(seen.length).toBe(3);
        // The find handle must have been released — a fresh full scan still works
        expect(helperStorage.findAllFiles("*.xml").length).toBeGreaterThanOrEqual(3);
      });

      it("sync open failure throws CascError with code and codeName", () => {
        const s = new Storage();
        try {
          s.open("/non/existent/casc/storage");
          fail("expected open() to throw");
        } catch (err) {
          expect(err).toBeInstanceOf(CascError);
          expect(typeof (err as CascError).code).toBe("number");
          expect((err as CascError).code).toBeGreaterThan(0);
          expect(typeof (err as CascError).codeName).toBe("string");
        }
      });

      it("async open failure rejects with CascError", async () => {
        const s = new Storage();
        await expect(s.openAsync("/non/existent/casc/storage")).rejects.toBeInstanceOf(CascError);
      });
    });
  });
});
