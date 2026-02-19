import { Storage, File } from "../lib";
import * as fs from "fs";
import * as os from "os";

const TEMP_DIR = os.tmpdir() + "/CASCLIB_TESTS_s2";

describe("CascLib - Starcraft II (s2)", () => {
  describe("Online Storage", () => {
    let storage: Storage;

    const TEST_ONLINE_STORAGE = `${TEMP_DIR}*s2*us`;

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

    it("should read buildid.txt and content should start with 'B'", () => {
      const fileName = "mods/core.sc2mod/base.sc2data/buildid.txt";
      expect(storage.fileExists(fileName)).toBe(true);

      const file = storage.openFile(fileName);
      const content = file.readAll();
      const contentStr = content.toString("utf8");

      expect(contentStr.startsWith("B")).toBe(true);

      file.close();
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

    it("should list TXT files (total file count > 1)", () => {
      let fileCount = 0;
      const findData = storage.findFirstFile("*.txt");

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

    it("should get file info for buildid.txt", () => {
      const fileName = "mods/core.sc2mod/base.sc2data/buildid.txt";
      const info = storage.getFileInfo(fileName);

      expect(info).not.toBeNull();
      expect(info).toHaveProperty("name");
      expect(info).toHaveProperty("size");
      expect(typeof info?.size).toBe("number");
      expect(info?.size).toBeGreaterThan(0);
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
