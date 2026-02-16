import { CascStorage, CascFile } from '../lib';
import * as path from 'path';
import * as fs from 'fs';

describe('CascLib', () => {
  describe('CascStorage', () => {
    let storage: CascStorage;

    beforeEach(() => {
      storage = new CascStorage();
    });

    afterEach(() => {
      if (storage) {
        storage.close();
      }
    });

    it('should create a storage instance', () => {
      expect(storage).toBeInstanceOf(CascStorage);
    });

    it('should throw error when opening non-existent storage', () => {
      expect(() => {
        storage.open('/non/existent/path');
      }).toThrow();
    });

    // Note: These tests require actual CASC storage to run
    // You'll need to provide a test CASC storage path
    describe('with valid storage', () => {
      const TEST_STORAGE_PATH = process.env.TEST_CASC_PATH;

      beforeEach(() => {
        if (!TEST_STORAGE_PATH) {
          console.warn('Skipping storage tests: TEST_CASC_PATH not set');
          return;
        }
        if (!fs.existsSync(TEST_STORAGE_PATH)) {
          console.warn(`Skipping storage tests: ${TEST_STORAGE_PATH} does not exist`);
          return;
        }
      });

      it('should open storage successfully', () => {
        if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) return;
        
        expect(() => {
          storage.open(TEST_STORAGE_PATH);
        }).not.toThrow();
      });

      it('should close storage successfully', () => {
        if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) return;
        
        storage.open(TEST_STORAGE_PATH);
        const result = storage.close();
        expect(result).toBe(true);
      });

      it('should check if file exists', () => {
        if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) return;
        
        storage.open(TEST_STORAGE_PATH);
        // This will depend on your test storage content
        const exists = storage.fileExists('test-file.txt');
        expect(typeof exists).toBe('boolean');
      });

      it('should get file info', () => {
        if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) return;
        
        storage.open(TEST_STORAGE_PATH);
        const info = storage.getFileInfo('test-file.txt');
        
        if (info) {
          expect(info).toHaveProperty('name');
          expect(info).toHaveProperty('size');
          expect(typeof info.name).toBe('string');
          expect(typeof info.size).toBe('number');
        }
      });
    });
  });

  describe('CascFile', () => {
    const TEST_STORAGE_PATH = process.env.TEST_CASC_PATH;
    let storage: CascStorage;
    let file: CascFile | null = null;

    beforeEach(() => {
      if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) {
        return;
      }
      storage = new CascStorage();
      storage.open(TEST_STORAGE_PATH);
    });

    afterEach(() => {
      if (file) {
        file.close();
        file = null;
      }
      if (storage) {
        storage.close();
      }
    });

    it('should open a file', () => {
      if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) return;
      
      // Adjust filename based on your test storage
      if (storage.fileExists('test-file.txt')) {
        file = storage.openFile('test-file.txt');
        expect(file).toBeInstanceOf(CascFile);
      }
    });

    it('should read file content', () => {
      if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) return;
      
      if (storage.fileExists('test-file.txt')) {
        file = storage.openFile('test-file.txt');
        const content = file.readAll();
        expect(Buffer.isBuffer(content)).toBe(true);
      }
    });

    it('should get file size', () => {
      if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) return;
      
      if (storage.fileExists('test-file.txt')) {
        file = storage.openFile('test-file.txt');
        const size = file.getSize();
        expect(typeof size).toBe('number');
        expect(size).toBeGreaterThanOrEqual(0);
      }
    });

    it('should read in chunks', () => {
      if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) return;
      
      if (storage.fileExists('test-file.txt')) {
        file = storage.openFile('test-file.txt');
        const chunk = file.read(100);
        expect(Buffer.isBuffer(chunk)).toBe(true);
        expect(chunk.length).toBeLessThanOrEqual(100);
      }
    });

    it('should handle file positioning', () => {
      if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) return;
      
      if (storage.fileExists('test-file.txt')) {
        file = storage.openFile('test-file.txt');
        const size = file.getSize();
        
        if (size > 10) {
          file.setPosition(10);
          const pos = file.getPosition();
          expect(pos).toBe(10);
        }
      }
    });

    it('should close file successfully', () => {
      if (!TEST_STORAGE_PATH || !fs.existsSync(TEST_STORAGE_PATH)) return;
      
      if (storage.fileExists('test-file.txt')) {
        file = storage.openFile('test-file.txt');
        const result = file.close();
        expect(result).toBe(true);
        file = null;
      }
    });
  });

  describe('Module exports', () => {
    it('should export CascStorage', () => {
      expect(CascStorage).toBeDefined();
      expect(typeof CascStorage).toBe('function');
    });

    it('should export CascFile', () => {
      expect(CascFile).toBeDefined();
      expect(typeof CascFile).toBe('function');
    });
  });
});
