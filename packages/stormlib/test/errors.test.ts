import { StormError, StormErrorCode } from "../lib";
import { invoke, invokeAsync } from "../lib/errors";

describe("StormError", () => {
  it("defaults code to 0 and codeName to UNKNOWN", () => {
    const err = new StormError("plain message");
    expect(err.name).toBe("StormError");
    expect(err.message).toBe("plain message");
    expect(err.code).toBe(0);
    expect(err.codeName).toBe("UNKNOWN");
  });

  it("exposes well-known error codes", () => {
    expect(StormErrorCode.FileNotFound).toBe(2);
    expect(StormErrorCode.FileCorrupt).toBe(1004);
  });

  describe("StormError.from()", () => {
    it("passes through existing StormError instances unchanged", () => {
      const original = new StormError("already wrapped", 2, "ERROR_FILE_NOT_FOUND");
      expect(StormError.from(original)).toBe(original);
    });

    it("wraps native-shaped errors, preserving code, codeName and stack", () => {
      const native = {
        message: "native failure",
        code: 1004,
        codeName: "ERROR_FILE_CORRUPT",
        stack: "fake native stack"
      };
      const wrapped = StormError.from(native) as StormError;
      expect(wrapped).toBeInstanceOf(StormError);
      expect(wrapped.message).toBe("native failure");
      expect(wrapped.code).toBe(1004);
      expect(wrapped.codeName).toBe("ERROR_FILE_CORRUPT");
      expect(wrapped.stack).toBe("fake native stack");
    });

    it("defaults codeName to UNKNOWN when the native error has none", () => {
      const wrapped = StormError.from({ message: "no name", code: 5 }) as StormError;
      expect(wrapped).toBeInstanceOf(StormError);
      expect(wrapped.codeName).toBe("UNKNOWN");
    });

    it("passes through values that don't look like native errors", () => {
      const plain = new Error("no code property");
      expect(StormError.from(plain)).toBe(plain);
      expect(StormError.from("a string")).toBe("a string");
      expect(StormError.from(null)).toBe(null);
      expect(StormError.from({ message: "code is wrong type", code: "2" })).toEqual({
        message: "code is wrong type",
        code: "2"
      });
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
      ).toThrow(StormError);
    });

    it("invokeAsync resolves with the promise value on success", async () => {
      await expect(invokeAsync(Promise.resolve("ok"))).resolves.toBe("ok");
    });

    it("invokeAsync translates native-shaped rejections", async () => {
      const rejection = Promise.reject({ message: "boom", code: 2, codeName: "ERROR_FILE_NOT_FOUND" });
      await expect(invokeAsync(rejection)).rejects.toBeInstanceOf(StormError);
    });
  });
});
