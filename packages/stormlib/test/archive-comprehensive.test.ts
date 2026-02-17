import { MpqArchive, MpqFile } from '../lib';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// MPQ File flags (from StormLib.h)
const MPQ_FILE_COMPRESS = 0x00000200;
const MPQ_FILE_ENCRYPTED = 0x00010000;
const MPQ_FILE_SINGLE_UNIT = 0x01000000;
const MPQ_FILE_SECTOR_CRC = 0x04000000;

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

  describe('Advanced MpqArchive Operations', () => {
    let archive: MpqArchive;
    let tempArchivePath: string;
    let testFilePath: string;

    beforeEach(() => {
      archive = new MpqArchive();
      tempArchivePath = path.join(os.tmpdir(), `test-advanced-${Date.now()}.mpq`);
      testFilePath = path.join(os.tmpdir(), `testdata-${Date.now()}.txt`);
    });

    afterEach(() => {
      if (archive) {
        try {
          archive.close();
        } catch (e) {
          // Ignore
        }
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

    describe('Archive creation with different options', () => {
      it('should create archive with custom max file count', () => {
        archive.create(tempArchivePath, { maxFileCount: 500 });
        const maxCount = archive.getMaxFileCount();
        expect(maxCount).toBeGreaterThanOrEqual(500);
        console.log('Max file count:', maxCount);
      });

      it('should create archive with minimal file count', () => {
        archive.create(tempArchivePath, { maxFileCount: 4 });
        expect(fs.existsSync(tempArchivePath)).toBe(true);
      });

      it('should create archive with large file count', () => {
        archive.create(tempArchivePath, { maxFileCount: 10000 });
        const maxCount = archive.getMaxFileCount();
        expect(maxCount).toBeGreaterThanOrEqual(10000);
      });
    });

    describe('File operations with compression flags', () => {
      beforeEach(() => {
        fs.writeFileSync(testFilePath, 'Test data for compression');
        archive.create(tempArchivePath, { maxFileCount: 100 });
      });

      it('should add file with compression', () => {
        const result = archive.addFile(testFilePath, 'compressed.txt', { 
          flags: MPQ_FILE_COMPRESS 
        });
        expect(result).toBe(true);
        expect(archive.hasFile('compressed.txt')).toBe(true);
      });

      it('should add file with compression and CRC', () => {
        const result = archive.addFile(testFilePath, 'compressed-crc.txt', { 
          flags: MPQ_FILE_COMPRESS | MPQ_FILE_SECTOR_CRC 
        });
        expect(result).toBe(true);
        
        const file = archive.openFile('compressed-crc.txt');
        const content = file.readAll();
        expect(content.toString()).toBe('Test data for compression');
        file.close();
      });

      it('should add file as single unit', () => {
        const result = archive.addFile(testFilePath, 'single-unit.txt', { 
          flags: MPQ_FILE_SINGLE_UNIT 
        });
        expect(result).toBe(true);
      });

      it('should read compressed file correctly', () => {
        archive.addFile(testFilePath, 'test.txt', { flags: MPQ_FILE_COMPRESS });
        
        const file = archive.openFile('test.txt');
        const content = file.readAll();
        expect(content.toString()).toBe('Test data for compression');
        file.close();
      });
    });

    describe('Multiple file operations', () => {
      beforeEach(() => {
        archive.create(tempArchivePath, { maxFileCount: 100 });
      });

      it('should add multiple files', () => {
        const files = ['file1.txt', 'file2.txt', 'file3.txt'];
        
        files.forEach((filename, index) => {
          const filePath = path.join(os.tmpdir(), `temp-${index}-${Date.now()}.txt`);
          fs.writeFileSync(filePath, `Content of ${filename}`);
          
          archive.addFile(filePath, filename);
          
          fs.unlinkSync(filePath);
        });

        files.forEach(filename => {
          expect(archive.hasFile(filename)).toBe(true);
        });

        console.log('Successfully added', files.length, 'files');
      });

      it('should handle file operations on multiple files', () => {
        const numFiles = 10;
        const tempFiles: string[] = [];

        // Add files
        for (let i = 0; i < numFiles; i++) {
          const filePath = path.join(os.tmpdir(), `bulk-${i}-${Date.now()}.txt`);
          fs.writeFileSync(filePath, `File ${i} content`);
          tempFiles.push(filePath);
          
          archive.addFile(filePath, `file${i}.txt`);
        }

        // Verify all exist
        for (let i = 0; i < numFiles; i++) {
          expect(archive.hasFile(`file${i}.txt`)).toBe(true);
        }

        // Read some files
        for (let i = 0; i < 3; i++) {
          const file = archive.openFile(`file${i}.txt`);
          const content = file.readAll();
          expect(content.toString()).toBe(`File ${i} content`);
          file.close();
        }

        // Cleanup temp files
        tempFiles.forEach(f => fs.unlinkSync(f));
      });

      it('should rename multiple files', () => {
        const filePath = path.join(os.tmpdir(), `rename-test-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'Rename test content');

        archive.addFile(filePath, 'original1.txt');
        archive.addFile(filePath, 'original2.txt');
        archive.addFile(filePath, 'original3.txt');

        archive.renameFile('original1.txt', 'renamed1.txt');
        archive.renameFile('original2.txt', 'renamed2.txt');
        archive.renameFile('original3.txt', 'renamed3.txt');

        expect(archive.hasFile('renamed1.txt')).toBe(true);
        expect(archive.hasFile('renamed2.txt')).toBe(true);
        expect(archive.hasFile('renamed3.txt')).toBe(true);
        expect(archive.hasFile('original1.txt')).toBe(false);

        fs.unlinkSync(filePath);
      });

      it('should remove multiple files', () => {
        const filePath = path.join(os.tmpdir(), `remove-test-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'Remove test content');

        const files = ['remove1.txt', 'remove2.txt', 'remove3.txt'];
        files.forEach(filename => archive.addFile(filePath, filename));

        files.forEach(filename => archive.removeFile(filename));

        files.forEach(filename => {
          expect(archive.hasFile(filename)).toBe(false);
        });

        fs.unlinkSync(filePath);
      });
    });

    describe('File extraction operations', () => {
      beforeEach(() => {
        archive.create(tempArchivePath, { maxFileCount: 100 });
        fs.writeFileSync(testFilePath, 'Extraction test data');
        archive.addFile(testFilePath, 'extract-test.txt');
      });

      it('should extract file to different location', () => {
        const extractPath = path.join(os.tmpdir(), `extracted-${Date.now()}.txt`);
        
        const result = archive.extractFile('extract-test.txt', extractPath);
        expect(result).toBe(true);
        expect(fs.existsSync(extractPath)).toBe(true);
        
        const content = fs.readFileSync(extractPath, 'utf8');
        expect(content).toBe('Extraction test data');
        
        fs.unlinkSync(extractPath);
      });

      it('should extract multiple files', () => {
        const filePath = path.join(os.tmpdir(), `multi-extract-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'Multi extract test');
        
        archive.addFile(filePath, 'extract1.txt');
        archive.addFile(filePath, 'extract2.txt');

        const extractPaths = [
          path.join(os.tmpdir(), `extracted1-${Date.now()}.txt`),
          path.join(os.tmpdir(), `extracted2-${Date.now()}.txt`)
        ];

        archive.extractFile('extract1.txt', extractPaths[0]);
        archive.extractFile('extract2.txt', extractPaths[1]);

        extractPaths.forEach(extractPath => {
          expect(fs.existsSync(extractPath)).toBe(true);
          const content = fs.readFileSync(extractPath, 'utf8');
          expect(content).toBe('Multi extract test');
          fs.unlinkSync(extractPath);
        });

        fs.unlinkSync(filePath);
      });
    });

    describe('Archive compacting', () => {
      it('should compact archive after file operations', () => {
        archive.create(tempArchivePath, { maxFileCount: 100 });
        
        const filePath = path.join(os.tmpdir(), `compact-test-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'A'.repeat(1000));

        // Add and remove files to create gaps
        for (let i = 0; i < 5; i++) {
          archive.addFile(filePath, `temp${i}.txt`);
        }
        
        for (let i = 0; i < 3; i++) {
          archive.removeFile(`temp${i}.txt`);
        }

        const result = archive.compact();
        expect(result).toBe(true);

        // Verify remaining files still accessible
        expect(archive.hasFile('temp3.txt')).toBe(true);
        expect(archive.hasFile('temp4.txt')).toBe(true);

        fs.unlinkSync(filePath);
      });
    });

    describe('Edge cases and error handling', () => {
      beforeEach(() => {
        archive.create(tempArchivePath, { maxFileCount: 100 });
      });

      it('should handle empty file', () => {
        const emptyFilePath = path.join(os.tmpdir(), `empty-${Date.now()}.txt`);
        fs.writeFileSync(emptyFilePath, '');

        archive.addFile(emptyFilePath, 'empty.txt');
        expect(archive.hasFile('empty.txt')).toBe(true);

        const file = archive.openFile('empty.txt');
        expect(file.getSize()).toBe(0);
        const content = file.readAll();
        expect(content.length).toBe(0);
        file.close();

        fs.unlinkSync(emptyFilePath);
      });

      it('should handle large file', () => {
        const largeFilePath = path.join(os.tmpdir(), `large-${Date.now()}.txt`);
        const largeContent = 'X'.repeat(100000); // 100KB
        fs.writeFileSync(largeFilePath, largeContent);

        archive.addFile(largeFilePath, 'large.txt', { flags: MPQ_FILE_COMPRESS });
        expect(archive.hasFile('large.txt')).toBe(true);

        const file = archive.openFile('large.txt');
        expect(file.getSize()).toBe(100000);
        const content = file.readAll();
        expect(content.toString()).toBe(largeContent);
        file.close();

        console.log('Successfully handled 100KB file');
        fs.unlinkSync(largeFilePath);
      });

      it('should handle file with special characters in name', () => {
        const specialFilePath = path.join(os.tmpdir(), `special-${Date.now()}.txt`);
        fs.writeFileSync(specialFilePath, 'Special name test');

        archive.addFile(specialFilePath, 'path/to/file-name_123.txt');
        expect(archive.hasFile('path/to/file-name_123.txt')).toBe(true);

        fs.unlinkSync(specialFilePath);
      });

      it('should return false for non-existent file check', () => {
        expect(archive.hasFile('does-not-exist.txt')).toBe(false);
        expect(archive.hasFile('')).toBe(false);
      });

      it('should throw when opening non-existent file', () => {
        expect(() => {
          archive.openFile('non-existent.txt');
        }).toThrow();
      });

      it('should throw when extracting non-existent file', () => {
        const extractPath = path.join(os.tmpdir(), `extract-fail-${Date.now()}.txt`);
        expect(() => {
          archive.extractFile('non-existent.txt', extractPath);
        }).toThrow();
      });

      it('should handle rename of non-existent file', () => {
        expect(() => {
          archive.renameFile('non-existent.txt', 'new-name.txt');
        }).toThrow();
      });

      it('should handle remove of non-existent file', () => {
        expect(() => {
          archive.removeFile('non-existent.txt');
        }).toThrow();
      });

      it('should handle adding same file twice with replace', () => {
        const filePath = path.join(os.tmpdir(), `duplicate-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'First version');

        archive.addFile(filePath, 'duplicate.txt');
        
        fs.writeFileSync(filePath, 'Second version');
        archive.addFile(filePath, 'duplicate.txt', { flags: 0x80000000 }); // MPQ_FILE_REPLACEEXISTING

        const file = archive.openFile('duplicate.txt');
        const content = file.readAll().toString();
        file.close();

        expect(content).toBe('Second version');
        fs.unlinkSync(filePath);
      });
    });
  });

  describe('Advanced MpqFile Operations', () => {
    let archive: MpqArchive;
    let tempArchivePath: string;

    beforeEach(() => {
      archive = new MpqArchive();
      tempArchivePath = path.join(os.tmpdir(), `test-file-ops-${Date.now()}.mpq`);
    });

    afterEach(() => {
      if (archive) {
        try {
          archive.close();
        } catch (e) {
          // Ignore
        }
      }
      
      if (fs.existsSync(tempArchivePath)) {
        try {
          fs.unlinkSync(tempArchivePath);
        } catch (e) {
          // Ignore
        }
      }
    });

    describe('File positioning and seeking', () => {
      it('should seek to beginning', () => {
        const filePath = path.join(os.tmpdir(), `seek-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'seek.txt');

        const file = archive.openFile('seek.txt');
        
        file.read(10);
        expect(file.getPosition()).toBeGreaterThan(0);
        
        file.setPosition(0);
        expect(file.getPosition()).toBe(0);
        
        const content = file.read(5);
        expect(content.toString()).toBe('ABCDE');
        
        file.close();
        fs.unlinkSync(filePath);
      });

      it('should seek to end', () => {
        const filePath = path.join(os.tmpdir(), `seek-end-${Date.now()}.txt`);
        const content = 'Test content for seeking';
        fs.writeFileSync(filePath, content);
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'seek-end.txt');

        const file = archive.openFile('seek-end.txt');
        const size = file.getSize();
        
        file.setPosition(size);
        expect(file.getPosition()).toBe(size);
        
        file.close();
        fs.unlinkSync(filePath);
      });

      it('should seek to middle and read forward', () => {
        const filePath = path.join(os.tmpdir(), `seek-middle-${Date.now()}.txt`);
        fs.writeFileSync(filePath, '0123456789ABCDEFGHIJ');
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'seek-middle.txt');

        const file = archive.openFile('seek-middle.txt');
        
        file.setPosition(10);
        const content = file.read(5);
        expect(content.toString()).toBe('ABCDE');
        expect(file.getPosition()).toBe(15);
        
        file.close();
        fs.unlinkSync(filePath);
      });

      it('should handle multiple seeks', () => {
        const filePath = path.join(os.tmpdir(), `multi-seek-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'AAAABBBBCCCCDDDDEEEE');
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'multi-seek.txt');

        const file = archive.openFile('multi-seek.txt');
        
        // Seek to different positions
        file.setPosition(4);
        expect(file.read(4).toString()).toBe('BBBB');
        
        file.setPosition(8);
        expect(file.read(4).toString()).toBe('CCCC');
        
        file.setPosition(0);
        expect(file.read(4).toString()).toBe('AAAA');
        
        file.close();
        fs.unlinkSync(filePath);
      });
    });

    describe('Reading patterns', () => {
      it('should read entire file in one call', () => {
        const filePath = path.join(os.tmpdir(), `read-all-${Date.now()}.txt`);
        const content = 'Complete file content';
        fs.writeFileSync(filePath, content);
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'read-all.txt');

        const file = archive.openFile('read-all.txt');
        const data = file.readAll();
        
        expect(data.toString()).toBe(content);
        expect(file.getPosition()).toBe(content.length);
        
        file.close();
        fs.unlinkSync(filePath);
      });

      it('should read file in small chunks', () => {
        const filePath = path.join(os.tmpdir(), `chunks-${Date.now()}.txt`);
        const content = 'A'.repeat(1000);
        fs.writeFileSync(filePath, content);
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'chunks.txt');

        const file = archive.openFile('chunks.txt');
        const chunks: Buffer[] = [];
        
        while (file.getPosition() < file.getSize()) {
          chunks.push(file.read(50));
        }
        
        const reconstructed = Buffer.concat(chunks).toString();
        expect(reconstructed).toBe(content);
        expect(chunks.length).toBeGreaterThan(10);
        
        file.close();
        fs.unlinkSync(filePath);
      });

      it('should handle sequential reads', () => {
        const filePath = path.join(os.tmpdir(), `sequential-${Date.now()}.txt`);
        fs.writeFileSync(filePath, '1234567890');
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'sequential.txt');

        const file = archive.openFile('sequential.txt');
        
        expect(file.read(2).toString()).toBe('12');
        expect(file.read(2).toString()).toBe('34');
        expect(file.read(2).toString()).toBe('56');
        expect(file.read(2).toString()).toBe('78');
        expect(file.read(2).toString()).toBe('90');
        
        file.close();
        fs.unlinkSync(filePath);
      });

      it('should read with varying chunk sizes', () => {
        const filePath = path.join(os.tmpdir(), `varying-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'A'.repeat(100));
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'varying.txt');

        const file = archive.openFile('varying.txt');
        
        const chunk1 = file.read(10);
        const chunk2 = file.read(25);
        const chunk3 = file.read(5);
        const chunk4 = file.read(60);
        
        expect(chunk1.length).toBe(10);
        expect(chunk2.length).toBe(25);
        expect(chunk3.length).toBe(5);
        expect(chunk4.length).toBe(60);
        
        expect(file.getPosition()).toBe(100);
        
        file.close();
        fs.unlinkSync(filePath);
      });
    });

    describe('Edge cases for file operations', () => {
      it('should handle reading past EOF', () => {
        const filePath = path.join(os.tmpdir(), `eof-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'Short');
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'eof.txt');

        const file = archive.openFile('eof.txt');
        const size = file.getSize();
        
        // Position near end and try to read more than available
        file.setPosition(size - 2);
        
        // StormLib may either return partial data or throw an error
        // Let's handle both cases
        try {
          const chunk = file.read(100);
          // If it succeeds, should return at most 2 bytes
          expect(chunk.length).toBeLessThanOrEqual(2);
        } catch (e) {
          // If it throws, that's also acceptable behavior for reading past EOF
          expect(e).toBeDefined();
        }
        
        file.close();
        fs.unlinkSync(filePath);
      });

      it('should handle position at file size', () => {
        const filePath = path.join(os.tmpdir(), `pos-size-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'Content');
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'pos-size.txt');

        const file = archive.openFile('pos-size.txt');
        const size = file.getSize();
        
        file.setPosition(size);
        expect(file.getPosition()).toBe(size);
        
        file.close();
        fs.unlinkSync(filePath);
      });

      it('should handle reading empty file', () => {
        const filePath = path.join(os.tmpdir(), `empty-read-${Date.now()}.txt`);
        fs.writeFileSync(filePath, '');
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'empty-read.txt');

        const file = archive.openFile('empty-read.txt');
        
        expect(file.getSize()).toBe(0);
        expect(file.getPosition()).toBe(0);
        
        const content = file.readAll();
        expect(content.length).toBe(0);
        
        file.close();
        fs.unlinkSync(filePath);
      });

      it('should handle file close and verify cannot read after close', () => {
        const filePath = path.join(os.tmpdir(), `close-test-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'Test close');
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'close-test.txt');

        const file = archive.openFile('close-test.txt');
        const result = file.close();
        expect(result).toBe(true);

        // After closing, operations should fail
        expect(() => {
          file.read(10);
        }).toThrow();
        
        fs.unlinkSync(filePath);
      });
    });

    describe('Opening files with options', () => {
      it('should open file with default options', () => {
        const filePath = path.join(os.tmpdir(), `options-${Date.now()}.txt`);
        fs.writeFileSync(filePath, 'Options test');
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'options.txt');

        const file = archive.openFile('options.txt', { flags: 0 });
        expect(file).toBeInstanceOf(MpqFile);
        
        const content = file.readAll();
        expect(content.toString()).toBe('Options test');
        
        file.close();
        fs.unlinkSync(filePath);
      });

      it('should open and read from compressed file', () => {
        const filePath = path.join(os.tmpdir(), `compressed-read-${Date.now()}.txt`);
        const largeContent = 'Repeated content '.repeat(100);
        fs.writeFileSync(filePath, largeContent);
        
        archive.create(tempArchivePath, { maxFileCount: 10 });
        archive.addFile(filePath, 'compressed-read.txt', { 
          flags: MPQ_FILE_COMPRESS 
        });

        const file = archive.openFile('compressed-read.txt');
        
        // Read in chunks
        const chunk1 = file.read(100);
        expect(Buffer.isBuffer(chunk1)).toBe(true);
        expect(chunk1.length).toBe(100);
        
        // Read all remaining
        file.setPosition(0);
        const allContent = file.readAll();
        expect(allContent.toString()).toBe(largeContent);
        
        file.close();
        fs.unlinkSync(filePath);
      });
    });
  });
});
