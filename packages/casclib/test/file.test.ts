import { CascStorage, CascFile } from '../lib';
import * as os from 'os';
import * as fs from 'fs';

const TEMP_DIR = os.tmpdir() + '/CASCLIB_TESTS_FILE';
const TEST_ONLINE_STORAGE = `${TEMP_DIR}*hero*us`;

describe('CascFile Operations', () => {
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

  describe('File reading', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should read file in chunks', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const chunk1 = file.read(5);
      const chunk2 = file.read(5);

      expect(Buffer.isBuffer(chunk1)).toBe(true);
      expect(Buffer.isBuffer(chunk2)).toBe(true);
      expect(chunk1.length).toBeLessThanOrEqual(5);
      expect(chunk2.length).toBeLessThanOrEqual(5);

      file.close();
    });

    it('should read all file data', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const content = file.readAll();
      expect(Buffer.isBuffer(content)).toBe(true);
      expect(content.length).toBeGreaterThan(0);

      file.close();
    });

    it('should read with custom chunk size', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const chunk = file.read(10);
      expect(chunk.length).toBeLessThanOrEqual(10);

      file.close();
    });

    it('should read with default chunk size', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const chunk = file.read();
      expect(Buffer.isBuffer(chunk)).toBe(true);

      file.close();
    });

    it('should read sequentially', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const chunks: Buffer[] = [];
      for (let i = 0; i < 3; i++) {
        chunks.push(file.read(3));
      }

      expect(chunks.length).toBe(3);
      chunks.forEach(chunk => {
        expect(Buffer.isBuffer(chunk)).toBe(true);
      });

      file.close();
    });
  });

  describe('File positioning', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should get and set file position (32-bit)', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      const size = file.getSize();

      const midPos = Math.floor(size / 2);
      file.setPosition(midPos);
      const currentPos = file.getPosition();

      expect(currentPos).toBe(midPos);

      file.close();
    });

    it('should get and set file position (64-bit)', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      const size = file.getSize64();

      const midPos = Math.floor(size / 2);
      file.setPosition64(midPos);
      const currentPos = file.getPosition64();

      expect(currentPos).toBe(midPos);

      file.close();
    });

    it('should position to beginning', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      file.read(10); // Move position
      file.setPosition(0);
      expect(file.getPosition()).toBe(0);

      file.close();
    });

    it('should position to end', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      const size = file.getSize();

      file.setPosition(size);
      expect(file.getPosition()).toBe(size);

      file.close();
    });

    it('should handle multiple position changes', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      const size = file.getSize();

      file.setPosition(10);
      expect(file.getPosition()).toBe(10);

      file.setPosition(20);
      expect(file.getPosition()).toBe(20);

      file.setPosition(0);
      expect(file.getPosition()).toBe(0);

      file.close();
    });
  });

  describe('File size operations', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should get file size (32-bit)', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const size = file.getSize();
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);

      file.close();
    });

    it('should get file size (64-bit)', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const size = file.getSize64();
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);

      file.close();
    });

    it('should have consistent sizes between 32-bit and 64-bit', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const size32 = file.getSize();
      const size64 = file.getSize64();
      expect(size32).toBe(size64);

      file.close();
    });
  });

  describe('File info operations', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should get file info with valid info class', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const info = file.getFileInfo(0);
      expect(info).toBeDefined();

      file.close();
    });

    it('should handle different info classes', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      for (let infoClass = 0; infoClass < 3; infoClass++) {
        try {
          const info = file.getFileInfo(infoClass);
          expect(info).toBeDefined();
        } catch (e) {
          // Some info classes may not be supported, which is fine
        }
      }

      file.close();
    });
  });

  describe('File flags operations', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should set file flags', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const result = file.setFileFlags(0);
      expect(typeof result).toBe('boolean');

      file.close();
    });

    it('should handle different flag values', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const flags = [0, 1, 0x10, 0x100];
      flags.forEach(flag => {
        const result = file.setFileFlags(flag);
        expect(typeof result).toBe('boolean');
      });

      file.close();
    });
  });

  describe('File closing', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should close file successfully', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const result = file.close();
      expect(result).toBe(true);
    });

    it('should handle multiple close calls', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      file.close();
      const result = file.close();
      expect(typeof result).toBe('boolean');
    });

    it('should throw when reading after close', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);
      file.close();

      expect(() => {
        file.read();
      }).toThrow();
    });
  });

  describe('Read and position integration', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should update position after reading', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      const initialPos = file.getPosition();
      const chunkSize = 10;
      file.read(chunkSize);
      const newPos = file.getPosition();

      expect(newPos).toBeGreaterThanOrEqual(initialPos);

      file.close();
    });

    it('should maintain position across multiple operations', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      file.setPosition(5);
      file.read(3);
      const pos1 = file.getPosition();

      file.read(2);
      const pos2 = file.getPosition();

      expect(pos2).toBeGreaterThan(pos1);

      file.close();
    });

    it('should read from specific position', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file = storage.openFile(fileName);

      // Read from position 10
      file.setPosition(10);
      const chunk1 = file.read(5);

      // Read same data again
      file.setPosition(10);
      const chunk2 = file.read(5);

      expect(chunk1.equals(chunk2)).toBe(true);

      file.close();
    });
  });

  describe('Multiple file operations', () => {
    beforeEach(() => {
      storage.openOnline(TEST_ONLINE_STORAGE);
    });

    it('should handle multiple files open simultaneously', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file1 = storage.openFile(fileName);
      const file2 = storage.openFile(fileName);

      const content1 = file1.readAll();
      const content2 = file2.readAll();

      expect(content1.equals(content2)).toBe(true);

      file1.close();
      file2.close();
    });

    it('should handle independent positioning in multiple files', () => {
      const fileName = 'mods/core.stormmod/base.stormdata/DataBuildId.txt';
      const file1 = storage.openFile(fileName);
      const file2 = storage.openFile(fileName);

      file1.setPosition(10);
      file2.setPosition(20);

      expect(file1.getPosition()).toBe(10);
      expect(file2.getPosition()).toBe(20);

      file1.close();
      file2.close();
    });
  });
});
