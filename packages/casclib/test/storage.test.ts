import { CascStorage } from '../lib';
import * as os from 'os';
import * as fs from 'fs';

const TEMP_DIR = os.tmpdir() + '/CASCLIB_TESTS_STORAGE';

describe('CascStorage', () => {
  let storage: CascStorage;

  beforeEach(() => {
    storage = new CascStorage();
  });

  afterEach(() => {
    if (storage) {
      try {
        storage.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    if (fs.existsSync(TEMP_DIR)) {
      try {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Opening storage', () => {
    it('should throw error when opening non-existent storage', () => {
      expect(() => {
        storage.open('/non/existent/path');
      }).toThrow();
    });

    it('should throw error when opening with invalid path', () => {
      expect(() => {
        storage.open('');
      }).toThrow();
    });

    it('should throw error when opening null path', () => {
      expect(() => {
        storage.open(null as any);
      }).toThrow();
    });

    it('should throw error when opening undefined path', () => {
      expect(() => {
        storage.open(undefined as any);
      }).toThrow();
    });
  });

  describe('Closing storage', () => {
    it('should close successfully without opening', () => {
      const result = storage.close();
      expect(typeof result).toBe('boolean');
    });

    it('should handle multiple close calls', () => {
      storage.close();
      const result = storage.close();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('File existence checks', () => {
    it('should throw when checking file existence on closed storage', () => {
      expect(() => {
        storage.fileExists('test.txt');
      }).toThrow();
    });

    it('should handle null filename gracefully', () => {
      expect(() => {
        storage.fileExists(null as any);
      }).toThrow();
    });

    it('should handle undefined filename gracefully', () => {
      expect(() => {
        storage.fileExists(undefined as any);
      }).toThrow();
    });

    it('should handle empty filename', () => {
      expect(() => {
        storage.fileExists('');
      }).toThrow();
    });
  });

  describe('Opening files', () => {
    it('should throw when opening file on closed storage', () => {
      expect(() => {
        storage.openFile('test.txt');
      }).toThrow();
    });

    it('should handle invalid filename', () => {
      expect(() => {
        storage.openFile('');
      }).toThrow();
    });

    it('should handle null filename', () => {
      expect(() => {
        storage.openFile(null as any);
      }).toThrow();
    });
  });

  describe('File info retrieval', () => {
    it('should throw when getting file info on closed storage', () => {
      expect(() => {
        storage.getFileInfo('test.txt');
      }).toThrow();
    });

    it('should handle invalid filename for info', () => {
      expect(() => {
        storage.getFileInfo('');
      }).toThrow();
    });
  });

  describe('Find operations', () => {
    it('should handle find operations on closed storage', () => {
      expect(() => {
        storage.findFirstFile('*.txt');
      }).toThrow();
    });

    it('should handle findNextFile without findFirstFile', () => {
      const result = storage.findNextFile();
      expect(result).toBeNull();
    });

    it('should handle findClose without findFirstFile', () => {
      const result = storage.findClose();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Encryption key operations', () => {
    it('should handle adding encryption key to closed storage', () => {
      const key = Buffer.from('testkey');
      expect(() => {
        storage.addEncryptionKey(1, key);
      }).toThrow();
    });

    it('should handle invalid key buffer', () => {
      expect(() => {
        storage.addEncryptionKey(1, null as any);
      }).toThrow();
    });

    it('should handle string encryption key on closed storage', () => {
      expect(() => {
        storage.addStringEncryptionKey(1, 'testkey');
      }).toThrow();
    });

    it('should handle importing keys from empty string', () => {
      expect(() => {
        storage.importKeysFromString('');
      }).toThrow();
    });

    it('should handle importing keys from non-existent file', () => {
      expect(() => {
        storage.importKeysFromFile('/non/existent/keyfile.txt');
      }).toThrow();
    });

    it('should handle finding encryption key on closed storage', () => {
      expect(() => {
        storage.findEncryptionKey(1);
      }).toThrow();
    });

    it('should handle getting not found encryption key', () => {
      const result = storage.getNotFoundEncryptionKey();
      expect(result).toBeNull();
    });
  });

  describe('Storage info retrieval', () => {
    it('should throw when getting storage info on closed storage', () => {
      expect(() => {
        storage.getStorageInfo(0);
      }).toThrow();
    });

    it('should handle invalid info class', () => {
      expect(() => {
        storage.getStorageInfo(-1);
      }).toThrow();
    });
  });

  describe('Online storage operations', () => {
    it('should handle invalid online storage URL', () => {
      expect(() => {
        storage.openOnline('');
      }).toThrow();
    });

    it('should handle null online storage URL', () => {
      expect(() => {
        storage.openOnline(null as any);
      }).toThrow();
    });
  });

  describe('Extended open operations', () => {
    it('should handle openEx with invalid parameters', () => {
      expect(() => {
        storage.openEx('');
      }).toThrow();
    });

    it('should handle openEx with null parameters', () => {
      expect(() => {
        storage.openEx(null as any);
      }).toThrow();
    });
  });
});
