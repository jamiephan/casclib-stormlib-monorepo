import { Storage, File } from "../lib";
import * as fs from "fs";
import * as os from "os";

const TEMP_DIR = os.tmpdir() + "/CASCLIB_TESTS_rtro";

describe("CascLib - Blizzard Arcade Collection Retail (rtro)", () => {
  describe("Online Storage", () => {
    let storage: Storage;

    const TEST_ONLINE_STORAGE = `${TEMP_DIR}*rtro*us`;

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

    it("should list EXE files (total file count >= 1)", () => {
      let fileCount = 0;
      const findData = storage.findFirstFile("*.exe");

      if (findData) {
        fileCount++;

        // Count additional files
        while (storage.findNextFile()) {
          fileCount++;
        }

        storage.findClose();
      }

      expect(fileCount).toBeGreaterThanOrEqual(1);
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

    it("should find at least one EXE file and retrieve its info", () => {
      const findData = storage.findFirstFile("*.exe");
      expect(findData).not.toBeNull();

      if (findData) {
        const exeFileName = findData.fileName;

        const info = storage.getFileInfo(exeFileName);
        expect(info).not.toBeNull();
        expect(info).toHaveProperty("name");
        expect(info).toHaveProperty("size");
        expect(typeof info?.size).toBe("number");
        expect(info?.size).toBeGreaterThan(0);

        storage.findClose();
      }
    });

    // The online storage was already fully downloaded into TEMP_DIR by the
    // beforeAll above, so TEMP_DIR itself is now a complete, valid local CASC
    // storage directory. Reopening it directly (no CDN params) exercises the
    // success paths of open()/openAsync()/openEx() without any extra network
    // access — those paths are otherwise only reachable with real CASC data.
    describe("reopening the downloaded cache as a local storage", () => {
      it("Storage.open() / instance open() succeed for a real local storage", () => {
        const local = Storage.open(TEMP_DIR);
        expect(local.isOpen).toBe(true);
        local.close();
      });

      it("Storage.openAsync() / instance openAsync() succeed for a real local storage", async () => {
        const local = await Storage.openAsync(TEMP_DIR);
        expect(local.isOpen).toBe(true);
        local.close();
      });

      it("Storage.openEx() / instance openEx() succeed for a real local storage", () => {
        const local = Storage.openEx(TEMP_DIR);
        expect(local.isOpen).toBe(true);
        local.close();
      });
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
});
