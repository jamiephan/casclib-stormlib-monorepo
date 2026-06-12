/**
 * Offline tests — no Blizzard CDN access required.
 *
 * Covers the error-translation layer, the File wrapper (via CascOpenLocalFile,
 * which works on plain disk files), and storage lifecycle/error paths.
 */
import {
  Storage,
  File,
  CascError,
  CascErrorCode,
  withStorage,
  withStorageAsync,
  CascOpenLocalFile,
  FILE_BEGIN,
  FILE_CURRENT,
  FILE_END
} from "../lib";
import { invoke, invokeAsync } from "../lib/errors";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const TEST_DIR = path.join(os.tmpdir(), "CASCLIB_TESTS_local");

beforeAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("CascError", () => {
  it("defaults code to 0 and codeName to UNKNOWN", () => {
    const err = new CascError("plain message");
    expect(err.name).toBe("CascError");
    expect(err.message).toBe("plain message");
    expect(err.code).toBe(0);
    expect(err.codeName).toBe("UNKNOWN");
  });

  it("exposes well-known error codes", () => {
    expect(CascErrorCode.FileNotFound).toBe(2);
    expect(CascErrorCode.FileCorrupt).toBe(1004);
  });

  describe("CascError.from()", () => {
    it("passes through existing CascError instances unchanged", () => {
      const original = new CascError("already wrapped", 2, "ERROR_FILE_NOT_FOUND");
      expect(CascError.from(original)).toBe(original);
    });

    it("wraps native-shaped errors, preserving code, codeName and stack", () => {
      const native = {
        message: "native failure",
        code: 1004,
        codeName: "ERROR_FILE_CORRUPT",
        stack: "fake native stack"
      };
      const wrapped = CascError.from(native) as CascError;
      expect(wrapped).toBeInstanceOf(CascError);
      expect(wrapped.message).toBe("native failure");
      expect(wrapped.code).toBe(1004);
      expect(wrapped.codeName).toBe("ERROR_FILE_CORRUPT");
      expect(wrapped.stack).toBe("fake native stack");
    });

    it("defaults codeName to UNKNOWN when the native error has none", () => {
      const wrapped = CascError.from({ message: "no name", code: 5 }) as CascError;
      expect(wrapped).toBeInstanceOf(CascError);
      expect(wrapped.codeName).toBe("UNKNOWN");
    });

    it("passes through values that don't look like native errors", () => {
      const plain = new Error("no code property");
      expect(CascError.from(plain)).toBe(plain);
      expect(CascError.from("a string")).toBe("a string");
      expect(CascError.from(null)).toBe(null);
    });
  });

  describe("invoke / invokeAsync", () => {
    it("invoke returns the function result on success", () => {
      expect(invoke(() => 42)).toBe(42);
    });

    it("invoke translates thrown native-shaped errors", () => {
      expect(() =>
        invoke(() => {
          throw { message: "boom", code: 6, codeName: "ERROR_INVALID_HANDLE" };
        })
      ).toThrow(CascError);
    });

    it("invokeAsync resolves with the promise value on success", async () => {
      await expect(invokeAsync(Promise.resolve("ok"))).resolves.toBe("ok");
    });

    it("invokeAsync translates native-shaped rejections", async () => {
      const rejection = Promise.reject({ message: "boom", code: 2, codeName: "ERROR_FILE_NOT_FOUND" });
      await expect(invokeAsync(rejection)).rejects.toBeInstanceOf(CascError);
    });
  });
});

describe("Storage error paths (offline)", () => {
  it("open() on a non-existent path throws CascError", () => {
    const storage = new Storage();
    try {
      storage.open(path.join(TEST_DIR, "no-such-storage"));
      fail("expected open() to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(CascError);
      expect((err as CascError).code).toBeGreaterThan(0);
    }
  });

  it("openAsync() on a non-existent path rejects with CascError", async () => {
    const storage = new Storage();
    await expect(storage.openAsync(path.join(TEST_DIR, "no-such-storage"))).rejects.toBeInstanceOf(
      CascError
    );
  });

  it("static Storage.open() propagates the error", () => {
    expect(() => Storage.open(path.join(TEST_DIR, "no-such-storage"))).toThrow(CascError);
  });

  it("static Storage.openAsync() propagates the rejection", async () => {
    await expect(Storage.openAsync(path.join(TEST_DIR, "no-such-storage"))).rejects.toBeInstanceOf(
      CascError
    );
  });

  it("a fresh storage reports isOpen === false", () => {
    expect(new Storage().isOpen).toBe(false);
  });
});

describe("extractFiles path traversal guard (offline)", () => {
  // Storage file names come from CASC metadata and are untrusted; entries
  // that would resolve outside outputDir must be rejected, not written.
  const fakeEntry = (fileName: string) => ({ fileName } as any);

  it("rejects entries that escape the output directory and extracts safe ones", () => {
    const storage = new Storage();
    const outDir = path.join(TEST_DIR, "extract-guard");
    const evilName = "../../evil.txt";
    const safeName = "sub/dir/ok.txt";
    jest
      .spyOn(storage, "findAllFiles")
      .mockReturnValue([fakeEntry(evilName), fakeEntry("..\\evil2.txt"), fakeEntry(safeName)]);
    const extractSpy = jest
      .spyOn(storage, "extractFile")
      .mockImplementation((_name: string, destination: string) => {
        fs.writeFileSync(destination, "x");
        return 1;
      });
    try {
      const { extracted, failed } = storage.extractFiles(outDir);
      expect(failed).toEqual([evilName, "..\\evil2.txt"]);
      expect(extracted).toEqual([safeName]);
      // The unsafe names never reach extractFile
      expect(extractSpy).toHaveBeenCalledTimes(1);
      const destination = extractSpy.mock.calls[0][1];
      expect(destination.startsWith(path.resolve(outDir) + path.sep)).toBe(true);
      expect(fs.existsSync(path.join(outDir, "sub", "dir", "ok.txt"))).toBe(true);
      expect(fs.existsSync(path.join(TEST_DIR, "evil.txt"))).toBe(false);
    } finally {
      jest.restoreAllMocks();
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("extractFilesAsync applies the same guard", async () => {
    const storage = new Storage();
    const outDir = path.join(TEST_DIR, "extract-guard-async");
    jest
      .spyOn(storage, "findAllFiles")
      .mockReturnValue([fakeEntry("../escape.txt"), fakeEntry("ok.txt")]);
    jest.spyOn(storage, "extractFileAsync").mockImplementation(async (_name, destination) => {
      fs.writeFileSync(destination, "x");
      return 1;
    });
    try {
      const { extracted, failed } = await storage.extractFilesAsync(outDir);
      expect(failed).toEqual(["../escape.txt"]);
      expect(extracted).toEqual(["ok.txt"]);
      expect(fs.existsSync(path.join(outDir, "ok.txt"))).toBe(true);
      expect(fs.existsSync(path.join(TEST_DIR, "escape.txt"))).toBe(false);
    } finally {
      jest.restoreAllMocks();
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });
});

describe("withStorage / withStorageAsync (offline)", () => {
  it("withStorage returns the callback value", () => {
    expect(withStorage(() => "value")).toBe("value");
  });

  it("withStorage closes the storage and rethrows on failure", () => {
    let captured: Storage | undefined;
    expect(() =>
      withStorage(s => {
        captured = s;
        s.open(path.join(TEST_DIR, "no-such-storage"));
      })
    ).toThrow(CascError);
    expect(captured!.isOpen).toBe(false);
  });

  it("withStorageAsync returns the resolved callback value", async () => {
    await expect(withStorageAsync(async () => "async value")).resolves.toBe("async value");
  });

  it("withStorageAsync closes the storage and rethrows on failure", async () => {
    let captured: Storage | undefined;
    await expect(
      withStorageAsync(async s => {
        captured = s;
        await s.openAsync(path.join(TEST_DIR, "no-such-storage"));
      })
    ).rejects.toBeInstanceOf(CascError);
    expect(captured!.isOpen).toBe(false);
  });
});

describe("CascOpenLocalFile (offline)", () => {
  it("throws for a non-existent local file", () => {
    expect(() => CascOpenLocalFile(path.join(TEST_DIR, "missing.blte"))).toThrow();
  });

  it("opens an existing file and the File wrapper can close it", () => {
    // CascOpenLocalFile expects BLTE-encoded CASC data files, so reads on a
    // plain file fail — but open/close lifecycle still works and is covered here.
    const localPath = path.join(TEST_DIR, "local-file.bin");
    fs.writeFileSync(localPath, "not a BLTE file");
    const file = new File(CascOpenLocalFile(localPath));
    expect(file.close()).toBe(true);
    // Closing again reports failure because the handle is gone
    expect(file.close()).toBe(false);
  });

  it("Symbol.dispose closes the file", () => {
    const localPath = path.join(TEST_DIR, "local-file-dispose.bin");
    fs.writeFileSync(localPath, "not a BLTE file");
    const file = new File(CascOpenLocalFile(localPath));
    (file as any)[(Symbol as any).dispose]();
    expect(file.close()).toBe(false);
  });
});

describe("Constants (offline)", () => {
  it("exposes file positioning constants from the native addon", () => {
    expect(FILE_BEGIN).toBe(0);
    expect(FILE_CURRENT).toBe(1);
    expect(FILE_END).toBe(2);
  });
});
