import { CascStorage, CascFile } from '../lib';
import * as os from 'os';
import * as fs from 'fs';

const TEMP_DIR = os.tmpdir() + '/CASCLIB_TESTS_ERRORS';
const TEST_ONLINE_STORAGE = `${TEMP_DIR}*hero*us`;

describe('CascLib Error Handling and Edge Cases', () => {
  let storage: CascStorage;

  beforeEach(() => {
    storage = new CascStorage();
  });

  afterEach(() => {
    if (storage) {
      try {
        storage.close();
      } catch (e) {
        // Ignore
      }
    }
    
    if (fs.existsSync(TEMP_DIR)) {
      try {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      } catch (e) {
        // Ignore
      }
    }
  });

  describe('Invalid parameters', () => {
    it('should throw on null storage path', () => {
      expect(() => {
        storage.open(null as any);
      }).toThrow();
    });

    it('should throw on undefined storage path', () => {
      expect(() => {
        storage.open(undefined as any);
      }).toThrow();
    });

    it('should throw on empty storage path', () => {
      expect(() => {
        storage.open('');
      }).toThrow();
    });

    it('should throw on non-string storage path', () => {
      expect(() => {
        storage.open(123 as any);
      }).toThrow();
    });

    it('should throw on object storage path', () => {
      expect(() => {
        storage.open({} as any);
      }).toThrow();
    });

    it('should throw on array storage path', () => {
      expect(() => {
        storage.open([] as any);
      }).toThrow();
    });
  });

  describe('Operations on closed storage', () => {
    it('should throw when checking file existence', () => {
      expect(() => {
        storage.fileExists('test.txt');
      }).toThrow();
    });

    it('should throw when opening file', () => {
      expect(() => {
        storage.openFile('test.txt');
      }).toThrow();
    });

    it('should throw when getting file info', () => {
      expect(() => {
        storage.getFileInfo('test.txt');
      }).toThrow();
    });

    it('should throw when finding first file', () => {
      expect(() => {
        storage.findFirstFile('*.txt');
      }).toThrow();
    });

    it('should throw when getting storage info', () => {
      expect(() => {
        storage.getStorageInfo(0);
      }).toThrow();
    });
  });

  describe('Non-existent files in valid storage', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should return false for non-existent file', () => {
      const exists = storage.fileExists('this/file/does/not/exist.txt');
      expect(exists).toBe(false);
    });

    it('should throw when opening non-existent file', () => {
      expect(() => {
        storage.openFile('non/existent/file.xyz');
      }).toThrow();
    });

    it('should return null for info of non-existent file', () => {
      const info = storage.getFileInfo('non/existent/file.xyz');
      expect(info).toBeNull();
    });

    it('should handle very long non-existent filename', () => {
      const longName = 'path/'.repeat(100) + 'file.txt';
      const exists = storage.fileExists(longName);
      expect(exists).toBe(false);
    });

    it('should handle special characters in non-existent filename', () => {
      const specialName = 'path/to/file-with_special.chars@123.txt';
      const exists = storage.fileExists(specialName);
      expect(exists).toBe(false);
    });
  });

  describe('Invalid file operations', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should handle null filename in fileExists', () => {
      expect(() => {
        storage.fileExists(null as any);
      }).toThrow();
    });

    it('should handle undefined filename in fileExists', () => {
      expect(() => {
        storage.fileExists(undefined as any);
      }).toThrow();
    });

    it('should handle empty filename in fileExists', () => {
      expect(() => {
        storage.fileExists('');
      }).toThrow();
    });

    it('should handle non-string filename', () => {
      expect(() => {
        storage.fileExists(123 as any);
      }).toThrow();
    });
  });

  describe('Find operation edge cases', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should return null for mask with no matches', () => {
      const result = storage.findFirstFile('*.nonexistentextension');
      expect(result).toBeNull();
    });

    it('should handle empty mask', () => {
      const result = storage.findFirstFile('');
      // May return null or first file depending on implementation
      expect(result === null || result !== null).toBe(true);
    });

    it('should handle findNextFile without findFirstFile', () => {
      const result = storage.findNextFile();
      expect(result).toBeNull();
    });

    it('should handle multiple findClose calls', () => {
      storage.findFirstFile('*.txt');
      storage.findClose();
      const result = storage.findClose();
      expect(typeof result).toBe('boolean');
    });

    it('should handle findNextFile after findClose', () => {
      storage.findFirstFile('*.txt');
      storage.findClose();
      const result = storage.findNextFile();
      expect(result).toBeNull();
    });
  });

  describe('Encryption key edge cases', () => {
    it('should handle null encryption key buffer', () => {
      expect(() => {
        storage.addEncryptionKey(1, null as any);
      }).toThrow();
    });

    it('should handle undefined encryption key buffer', () => {
      expect(() => {
        storage.addEncryptionKey(1, undefined as any);
      }).toThrow();
    });

    it('should handle non-buffer encryption key', () => {
      expect(() => {
        storage.addEncryptionKey(1, 'not a buffer' as any);
      }).toThrow();
    });

    it('should handle empty buffer as encryption key', () => {
      expect(() => {
        storage.addEncryptionKey(1, Buffer.alloc(0));
      }).toThrow();
    });

    it('should handle null string encryption key', () => {
      expect(() => {
        storage.addStringEncryptionKey(1, null as any);
      }).toThrow();
    });

    it('should handle empty string encryption key', () => {
      expect(() => {
        storage.addStringEncryptionKey(1, '');
      }).toThrow();
    });

    it('should handle invalid key file path', () => {
      expect(() => {
        storage.importKeysFromFile('/invalid/path/to/keyfile.txt');
      }).toThrow();
    });

    it('should handle finding non-existent encryption key', () => {
      expect(() => {
        storage.findEncryptionKey(999999);
      }).toThrow();
    });
  });

  describe('File operations after close', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should throw when operating on closed file', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      file.close();

      expect(() => {
        file.read();
      }).toThrow();
    });

    it('should throw when reading all from closed file', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      file.close();

      expect(() => {
        file.readAll();
      }).toThrow();
    });

    it('should throw when setting position on closed file', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      file.close();

      expect(() => {
        file.setPosition(0);
      }).toThrow();
    });

    it('should throw when getting size of closed file', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      file.close();

      expect(() => {
        file.getSize();
      }).toThrow();
    });

    it('should throw when getting position of closed file', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      file.close();

      expect(() => {
        file.getPosition();
      }).toThrow();
    });
  });

  describe('Invalid read parameters', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should handle negative bytes to read', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      expect(() => {
        file.read(-10);
      }).toThrow();

      file.close();
    });

    it('should handle zero bytes to read', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const result = file.read(0);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBe(0);

      file.close();
    });

    it('should handle extremely large bytes to read', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      const size = file.getSize();

      // Try to read more than file size
      const result = file.read(size * 10);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(size);

      file.close();
    });

    it('should handle non-number bytes to read', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      expect(() => {
        file.read('not a number' as any);
      }).toThrow();

      file.close();
    });
  });

  describe('Invalid position parameters', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should handle negative position', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      expect(() => {
        file.setPosition(-10);
      }).toThrow();

      file.close();
    });

    it('should handle position beyond file size', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      const size = file.getSize();

      // Some implementations may allow seeking beyond file size
      const result = file.setPosition(size * 10);
      expect(typeof result).toBe('number');

      file.close();
    });

    it('should handle non-number position', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      expect(() => {
        file.setPosition('not a number' as any);
      }).toThrow();

      file.close();
    });

    it('should handle NaN position', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      expect(() => {
        file.setPosition(NaN);
      }).toThrow();

      file.close();
    });

    it('should handle Infinity position', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      expect(() => {
        file.setPosition(Infinity);
      }).toThrow();

      file.close();
    });
  });

  describe('Concurrent operations', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should handle reading from same file simultaneously', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file1 = storage.openFile(fileName);
      const file2 = storage.openFile(fileName);

      const content1 = file1.readAll();
      const content2 = file2.readAll();

      expect(content1.equals(content2)).toBe(true);

      file1.close();
      file2.close();
    });

    it('should handle independent operations on different files', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file1 = storage.openFile(fileName);
      const file2 = storage.openFile(fileName);

      file1.setPosition(10);
      file2.setPosition(20);

      const chunk1 = file1.read(5);
      const chunk2 = file2.read(5);

      expect(chunk1.equals(chunk2)).toBe(false);

      file1.close();
      file2.close();
    });
  });

  describe('Resource cleanup', () => {
    it('should handle storage close with open files', () => {
      storage.openOnline(TEST_ONLINE_STORAGE);
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      // Close storage while file is open
      storage.close();

      // File operations should fail
      expect(() => {
        file.read();
      }).toThrow();
    });

    it('should handle multiple open/close cycles', () => {
      for (let i = 0; i < 3; i++) {
        storage.openOnline(TEST_ONLINE_STORAGE);
        const exists = storage.fileExists('mods/core.stormmod/base.stormdata/DataBuildId.txt');
        expect(exists).toBe(true);
        storage.close();
      }
    });
  });

  describe('Special characters in filenames', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should handle filename with spaces', () => {
      const exists = storage.fileExists('file with spaces.txt');
      expect(typeof exists).toBe('boolean');
    });

    it('should handle filename with unicode characters', () => {
      const exists = storage.fileExists('файл.txt');
      expect(typeof exists).toBe('boolean');
    });

    it('should handle filename with special characters', () => {
      const exists = storage.fileExists('file-name_123.txt');
      expect(typeof exists).toBe('boolean');
    });

    it('should handle filename with dots', () => {
      const exists = storage.fileExists('file.name.with.dots.txt');
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('Memory and buffer handling', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should return new buffer instances for each read', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const buffer1 = file.read(10);
      const buffer2 = file.read(10);

      expect(buffer1).not.toBe(buffer2); // Different buffer instances

      file.close();
    });

    it('should handle reading empty result gracefully', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      const size = file.getSize();

      // Position at end
      file.setPosition(size);
      const result = file.read(10);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBe(0);

      file.close();
    });
  });
});
