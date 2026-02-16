import { MpqArchive, MpqFile } from '../lib';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('StormLib', () => {
  describe('MpqArchive', () => {
    let archive: MpqArchive;
    let tempArchivePath: string;

    beforeEach(() => {
      archive = new MpqArchive();
      tempArchivePath = path.join(os.tmpdir(), `test-${Date.now()}.mpq`);
    });

    afterEach(() => {
      if (archive) {
        archive.close();
      }
      // Clean up temp archive
      if (fs.existsSync(tempArchivePath)) {
        try {
          fs.unlinkSync(tempArchivePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    it('should create an archive instance', () => {
      expect(archive).toBeInstanceOf(MpqArchive);
    });

    it('should throw error when opening non-existent archive', () => {
      expect(() => {
        archive.open('/non/existent/archive.mpq');
      }).toThrow();
    });

    it('should create a new archive', () => {
      expect(() => {
        archive.create(tempArchivePath, { maxFileCount: 100 });
      }).not.toThrow();
      
      expect(fs.existsSync(tempArchivePath)).toBe(true);
    });

    describe('with a created archive', () => {
      let testFilePath: string;

      beforeEach(() => {
        // Create a test file
        testFilePath = path.join(os.tmpdir(), `testfile-${Date.now()}.txt`);
        fs.writeFileSync(testFilePath, 'Hello, StormLib!');

        // Create archive
        archive.create(tempArchivePath, { maxFileCount: 100 });
      });

      afterEach(() => {
        // Clean up test file
        if (fs.existsSync(testFilePath)) {
          try {
            fs.unlinkSync(testFilePath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      });

      it('should add a file to the archive', () => {
        expect(() => {
          archive.addFile(testFilePath, 'test.txt');
        }).not.toThrow();
      });

      it('should check if file exists after adding', () => {
        archive.addFile(testFilePath, 'test.txt');
        expect(archive.hasFile('test.txt')).toBe(true);
        expect(archive.hasFile('nonexistent.txt')).toBe(false);
      });

      it('should read file from archive', () => {
        archive.addFile(testFilePath, 'test.txt');
        
        const file = archive.openFile('test.txt');
        expect(file).toBeInstanceOf(MpqFile);
        
        const content = file.readAll();
        expect(content.toString()).toBe('Hello, StormLib!');
        
        file.close();
      });

      it('should extract file from archive', () => {
        archive.addFile(testFilePath, 'test.txt');
        
        const extractPath = path.join(os.tmpdir(), `extracted-${Date.now()}.txt`);
        
        try {
          archive.extractFile('test.txt', extractPath);
          expect(fs.existsSync(extractPath)).toBe(true);
          
          const content = fs.readFileSync(extractPath, 'utf8');
          expect(content).toBe('Hello, StormLib!');
        } finally {
          if (fs.existsSync(extractPath)) {
            fs.unlinkSync(extractPath);
          }
        }
      });

      it('should rename file in archive', () => {
        archive.addFile(testFilePath, 'old-name.txt');
        archive.renameFile('old-name.txt', 'new-name.txt');
        
        expect(archive.hasFile('new-name.txt')).toBe(true);
        expect(archive.hasFile('old-name.txt')).toBe(false);
      });

      it('should remove file from archive', () => {
        archive.addFile(testFilePath, 'test.txt');
        expect(archive.hasFile('test.txt')).toBe(true);
        
        archive.removeFile('test.txt');
        expect(archive.hasFile('test.txt')).toBe(false);
      });

      it('should get max file count', () => {
        const maxCount = archive.getMaxFileCount();
        expect(typeof maxCount).toBe('number');
        expect(maxCount).toBeGreaterThan(0);
      });

      it('should compact archive', () => {
        archive.addFile(testFilePath, 'test.txt');
        
        expect(() => {
          archive.compact();
        }).not.toThrow();
      });

      it('should close archive successfully', () => {
        const result = archive.close();
        expect(result).toBe(true);
      });
    });

    // Note: These tests require actual MPQ archives to run
    describe('with existing MPQ archive', () => {
      const TEST_MPQ_PATH = process.env.TEST_MPQ_PATH;

      beforeEach(() => {
        if (!TEST_MPQ_PATH) {
          console.warn('Skipping MPQ tests: TEST_MPQ_PATH not set');
          return;
        }
        if (!fs.existsSync(TEST_MPQ_PATH)) {
          console.warn(`Skipping MPQ tests: ${TEST_MPQ_PATH} does not exist`);
          return;
        }
      });

      it('should open existing archive', () => {
        if (!TEST_MPQ_PATH || !fs.existsSync(TEST_MPQ_PATH)) return;
        
        expect(() => {
          archive.open(TEST_MPQ_PATH);
        }).not.toThrow();
      });
    });
  });

  describe('MpqFile', () => {
    let archive: MpqArchive;
    let tempArchivePath: string;
    let testFilePath: string;

    beforeEach(() => {
      archive = new MpqArchive();
      tempArchivePath = path.join(os.tmpdir(), `test-file-${Date.now()}.mpq`);
      testFilePath = path.join(os.tmpdir(), `testdata-${Date.now()}.txt`);
      
      // Create test data (1KB)
      const testData = 'A'.repeat(1024);
      fs.writeFileSync(testFilePath, testData);
      
      // Create archive and add file
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
    });

    afterEach(() => {
      if (archive) {
        archive.close();
      }
      
      [tempArchivePath, testFilePath].forEach(p => {
        if (fs.existsSync(p)) {
          try {
            fs.unlinkSync(p);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      });
    });

    it('should get file size', () => {
      const file = archive.openFile('test.txt');
      const size = file.getSize();
      
      expect(typeof size).toBe('number');
      expect(size).toBe(1024);
      
      file.close();
    });

    it('should read in chunks', () => {
      const file = archive.openFile('test.txt');
      
      const chunk = file.read(100);
      expect(Buffer.isBuffer(chunk)).toBe(true);
      expect(chunk.length).toBe(100);
      expect(chunk.toString()).toBe('A'.repeat(100));
      
      file.close();
    });

    it('should handle file positioning', () => {
      const file = archive.openFile('test.txt');
      
      file.setPosition(500);
      const pos = file.getPosition();
      expect(pos).toBe(500);
      
      const chunk = file.read(10);
      expect(chunk.toString()).toBe('A'.repeat(10));
      
      file.close();
    });

    it('should read all data', () => {
      const file = archive.openFile('test.txt');
      
      const content = file.readAll();
      expect(content.length).toBe(1024);
      expect(content.toString()).toBe('A'.repeat(1024));
      
      file.close();
    });
  });

  describe('Module exports', () => {
    it('should export MpqArchive', () => {
      expect(MpqArchive).toBeDefined();
      expect(typeof MpqArchive).toBe('function');
    });

    it('should export MpqFile', () => {
      expect(MpqFile).toBeDefined();
      expect(typeof MpqFile).toBe('function');
    });
  });
});
