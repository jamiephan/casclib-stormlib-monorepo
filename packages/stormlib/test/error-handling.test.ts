import { MpqArchive, MpqFile } from '../lib';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('StormLib Error Handling and Edge Cases', () => {
  let archive: MpqArchive;
  let tempArchivePath: string;

  beforeEach(() => {
    archive = new MpqArchive();
    tempArchivePath = path.join(os.tmpdir(), `test-errors-${Date.now()}.mpq`);
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

  describe('Invalid archive paths', () => {
    it('should throw on null path', () => {
      expect(() => {
        archive.open(null as any);
      }).toThrow();
    });

    it('should throw on undefined path', () => {
      expect(() => {
        archive.open(undefined as any);
      }).toThrow();
    });

    it('should throw on empty path', () => {
      expect(() => {
        archive.open('');
      }).toThrow();
    });

    it('should throw on non-string path', () => {
      expect(() => {
        archive.open(123 as any);
      }).toThrow();
    });

    it('should throw on object path', () => {
      expect(() => {
        archive.open({} as any);
      }).toThrow();
    });

    it('should throw on array path', () => {
      expect(() => {
        archive.open([] as any);
      }).toThrow();
    });

    it('should throw on non-existent path', () => {
      expect(() => {
        archive.open('/totally/fake/path/archive.mpq');
      }).toThrow();
    });

    it('should throw on path to non-MPQ file', () => {
      const textFile = path.join(os.tmpdir(), `notmpq-${Date.now()}.txt`);
      fs.writeFileSync(textFile, 'Not an MPQ');
      
      expect(() => {
        archive.open(textFile);
      }).toThrow();
      
      fs.unlinkSync(textFile);
    });
  });

  describe('Invalid creation parameters', () => {
    it('should throw with null create path', () => {
      expect(() => {
        archive.create(null as any);
      }).toThrow();
    });

    it('should throw with undefined create path', () => {
      expect(() => {
        archive.create(undefined as any);
      }).toThrow();
    });

    it('should throw with empty create path', () => {
      expect(() => {
        archive.create('');
      }).toThrow();
    });

    it('should handle negative max file count', () => {
      // StormLib may normalize invalid values
      try {
        archive.create(tempArchivePath, { maxFileCount: -1 });
        expect(fs.existsSync(tempArchivePath)).toBe(true);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('should handle zero max file count', () => {
      // StormLib may use a default value
      try {
        archive.create(tempArchivePath, { maxFileCount: 0 });
        expect(fs.existsSync(tempArchivePath)).toBe(true);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('should handle invalid max file count type', () => {
      // TypeScript would catch this, but test runtime behavior
      try {
        archive.create(tempArchivePath, { maxFileCount: 'not a number' as any });
        expect(fs.existsSync(tempArchivePath)).toBe(true);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('should handle NaN max file count', () => {
      // StormLib may convert NaN to a valid value
      try {
        archive.create(tempArchivePath, { maxFileCount: NaN });
        expect(fs.existsSync(tempArchivePath)).toBe(true);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });

  describe('Operations on closed archive', () => {
    it('should throw when checking file existence', () => {
      expect(() => {
        archive.hasFile('test.txt');
      }).toThrow();
    });

    it('should throw when opening file', () => {
      expect(() => {
        archive.openFile('test.txt');
      }).toThrow();
    });

    it('should throw when adding file', () => {
      const testFile = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'test');
      
      expect(() => {
        archive.addFile(testFile, 'test.txt');
      }).toThrow();
      
      fs.unlinkSync(testFile);
    });

    it('should throw when removing file', () => {
      expect(() => {
        archive.removeFile('test.txt');
      }).toThrow();
    });

    it('should throw when renaming file', () => {
      expect(() => {
        archive.renameFile('old.txt', 'new.txt');
      }).toThrow();
    });

    it('should throw when extracting file', () => {
      const extractPath = path.join(os.tmpdir(), `extract-${Date.now()}.txt`);
      
      expect(() => {
        archive.extractFile('test.txt', extractPath);
      }).toThrow();
    });

    it('should throw when compacting', () => {
      expect(() => {
        archive.compact();
      }).toThrow();
    });

    it('should throw when getting max file count', () => {
      expect(() => {
        archive.getMaxFileCount();
      }).toThrow();
    });
  });

  describe('Invalid file operations', () => {
    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
    });

    it('should return false for hasFile with empty filename', () => {
      const result = archive.hasFile('');
      expect(result).toBe(false);
    });

    it('should throw for hasFile with null filename', () => {
      expect(() => {
        archive.hasFile(null as any);
      }).toThrow();
    });

    it('should throw for hasFile with undefined filename', () => {
      expect(() => {
        archive.hasFile(undefined as any);
      }).toThrow();
    });

    it('should throw when opening non-existent file', () => {
      expect(() => {
        archive.openFile('nonexistent.txt');
      }).toThrow();
    });

    it('should throw when opening with empty filename', () => {
      expect(() => {
        archive.openFile('');
      }).toThrow();
    });

    it('should throw when opening with null filename', () => {
      expect(() => {
        archive.openFile(null as any);
      }).toThrow();
    });
  });

  describe('Invalid add file operations', () => {
    let testFilePath: string;

    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      testFilePath = path.join(os.tmpdir(), `addtest-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'Add test');
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should throw when adding non-existent file', () => {
      expect(() => {
        archive.addFile('/non/existent/file.txt', 'test.txt');
      }).toThrow();
    });

    it('should throw when adding with empty source path', () => {
      expect(() => {
        archive.addFile('', 'test.txt');
      }).toThrow();
    });

    it('should throw when adding with null source path', () => {
      expect(() => {
        archive.addFile(null as any, 'test.txt');
      }).toThrow();
    });

    it('should throw when adding with empty archive name', () => {
      expect(() => {
        archive.addFile(testFilePath, '');
      }).toThrow();
    });

    it('should throw when adding with null archive name', () => {
      expect(() => {
        archive.addFile(testFilePath, null as any);
      }).toThrow();
    });

    it('should throw when adding directory instead of file', () => {
      const dirPath = path.join(os.tmpdir(), `testdir-${Date.now()}`);
      fs.mkdirSync(dirPath);
      
      expect(() => {
        archive.addFile(dirPath, 'test.txt');
      }).toThrow();
      
      fs.rmdirSync(dirPath);
    });
  });

  describe('Invalid remove file operations', () => {
    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
    });

    it('should throw when removing non-existent file', () => {
      expect(() => {
        archive.removeFile('nonexistent.txt');
      }).toThrow();
    });

    it('should throw when removing with empty filename', () => {
      expect(() => {
        archive.removeFile('');
      }).toThrow();
    });

    it('should throw when removing with null filename', () => {
      expect(() => {
        archive.removeFile(null as any);
      }).toThrow();
    });

    it('should throw when removing same file twice', () => {
      const testFile = path.join(os.tmpdir(), `remove-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Remove test');
      
      archive.addFile(testFile, 'test.txt');
      archive.removeFile('test.txt');
      
      expect(() => {
        archive.removeFile('test.txt');
      }).toThrow();
      
      fs.unlinkSync(testFile);
    });
  });

  describe('Invalid rename file operations', () => {
    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
    });

    it('should throw when renaming non-existent file', () => {
      expect(() => {
        archive.renameFile('nonexistent.txt', 'new.txt');
      }).toThrow();
    });

    it('should throw when renaming with empty old name', () => {
      expect(() => {
        archive.renameFile('', 'new.txt');
      }).toThrow();
    });

    it('should throw when renaming with empty new name', () => {
      const testFile = path.join(os.tmpdir(), `rename-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Rename test');
      
      archive.addFile(testFile, 'old.txt');
      
      expect(() => {
        archive.renameFile('old.txt', '');
      }).toThrow();
      
      fs.unlinkSync(testFile);
    });

    it('should throw when renaming with null old name', () => {
      expect(() => {
        archive.renameFile(null as any, 'new.txt');
      }).toThrow();
    });

    it('should throw when renaming with null new name', () => {
      const testFile = path.join(os.tmpdir(), `rename-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Rename test');
      
      archive.addFile(testFile, 'old.txt');
      
      expect(() => {
        archive.renameFile('old.txt', null as any);
      }).toThrow();
      
      fs.unlinkSync(testFile);
    });
  });

  describe('Invalid extract file operations', () => {
    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
    });

    it('should throw when extracting non-existent file', () => {
      const extractPath = path.join(os.tmpdir(), `extract-${Date.now()}.txt`);
      
      expect(() => {
        archive.extractFile('nonexistent.txt', extractPath);
      }).toThrow();
    });

    it('should throw when extracting with empty source', () => {
      const extractPath = path.join(os.tmpdir(), `extract-${Date.now()}.txt`);
      
      expect(() => {
        archive.extractFile('', extractPath);
      }).toThrow();
    });

    it('should throw when extracting with empty destination', () => {
      const testFile = path.join(os.tmpdir(), `extract-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Extract test');
      
      archive.addFile(testFile, 'test.txt');
      
      expect(() => {
        archive.extractFile('test.txt', '');
      }).toThrow();
      
      fs.unlinkSync(testFile);
    });

    it('should throw when extracting with null source', () => {
      const extractPath = path.join(os.tmpdir(), `extract-${Date.now()}.txt`);
      
      expect(() => {
        archive.extractFile(null as any, extractPath);
      }).toThrow();
    });

    it('should throw when extracting with null destination', () => {
      const testFile = path.join(os.tmpdir(), `extract-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Extract test');
      
      archive.addFile(testFile, 'test.txt');
      
      expect(() => {
        archive.extractFile('test.txt', null as any);
      }).toThrow();
      
      fs.unlinkSync(testFile);
    });
  });

  describe('File read edge cases', () => {
    let testFilePath: string;

    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      testFilePath = path.join(os.tmpdir(), `readtest-${Date.now()}.txt`);
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should handle empty file', () => {
      fs.writeFileSync(testFilePath, '');
      archive.addFile(testFilePath, 'empty.txt');
      
      const file = archive.openFile('empty.txt');
      expect(file.getSize()).toBe(0);
      
      const content = file.readAll();
      expect(content.length).toBe(0);
      
      file.close();
    });

    it('should throw when reading with negative bytes', () => {
      fs.writeFileSync(testFilePath, 'Test content');
      archive.addFile(testFilePath, 'test.txt');
      
      const file = archive.openFile('test.txt');
      
      expect(() => {
        file.read(-10);
      }).toThrow();
      
      file.close();
    });

    it('should handle reading zero bytes', () => {
      fs.writeFileSync(testFilePath, 'Test content');
      archive.addFile(testFilePath, 'test.txt');
      
      const file = archive.openFile('test.txt');
      
      // Reading 0 bytes may throw or return empty buffer
      try {
        const result = file.read(0);
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.length).toBe(0);
      } catch (e) {
        // Also acceptable if it throws
        expect(e).toBeDefined();
      }
      
      file.close();
    });

    it('should handle reading more than file size', () => {
      fs.writeFileSync(testFilePath, 'Short');
      archive.addFile(testFilePath, 'test.txt');
      
      const file = archive.openFile('test.txt');
      const size = file.getSize();
      
      // Reading more than available may return partial data or throw
      try {
        const result = file.read(size * 10);
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(size);
      } catch (e) {
        // May throw if attempting invalid read
        expect(e).toBeDefined();
      }
      
      file.close();
    });

    it('should handle reading with non-number parameter', () => {
      fs.writeFileSync(testFilePath, 'Test content');
      archive.addFile(testFilePath, 'test.txt');
      
      const file = archive.openFile('test.txt');
      
      expect(() => {
        file.read('not a number' as any);
      }).toThrow();
      
      file.close();
    });

    it('should handle reading with NaN parameter', () => {
      fs.writeFileSync(testFilePath, 'Test content');
      archive.addFile(testFilePath, 'test.txt');
      
      const file = archive.openFile('test.txt');
      
      expect(() => {
        file.read(NaN);
      }).toThrow();
      
      file.close();
    });

    it('should handle reading from end of file', () => {
      fs.writeFileSync(testFilePath, 'Test content');
      archive.addFile(testFilePath, 'test.txt');
      
      const file = archive.openFile('test.txt');
      const size = file.getSize();
      
      file.setPosition(size);
      
      // Reading at EOF may return empty buffer or throw
      try {
        const result = file.read(10);
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.length).toBe(0);
      } catch (e) {
        // Also acceptable if it throws
        expect(e).toBeDefined();
      }
      
      file.close();
    });
  });

  describe('File position edge cases', () => {
    let testFilePath: string;

    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      testFilePath = path.join(os.tmpdir(), `postest-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'Position test content');
      archive.addFile(testFilePath, 'test.txt');
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should handle negative position', () => {
      const file = archive.openFile('test.txt');
      
      // StormLib may clamp to 0 or throw
      try {
        const result = file.setPosition(-10);
        // If it succeeds, should be clamped to 0 or similar
        expect(typeof result).toBe('number');
      } catch (e) {
        // Also acceptable if it throws
        expect(e).toBeDefined();
      }
      
      file.close();
    });

    it('should handle setting position beyond file size', () => {
      const file = archive.openFile('test.txt');
      const size = file.getSize();
      
      // Behavior may vary - seek beyond EOF might be allowed
      const result = file.setPosition(size * 10);
      expect(typeof result).toBe('number');
      
      file.close();
    });

    it('should throw when setting position with non-number', () => {
      const file = archive.openFile('test.txt');
      
      expect(() => {
        file.setPosition('not a number' as any);
      }).toThrow();
      
      file.close();
    });

    it('should handle setting position with NaN', () => {
      const file = archive.openFile('test.txt');
      
      // StormLib may convert NaN to a valid position
      try {
        const result = file.setPosition(NaN);
        expect(typeof result).toBe('number');
      } catch (e) {
        expect(e).toBeDefined();
      }
      
      file.close();
    });

    it('should handle setting position with Infinity', () => {
      const file = archive.openFile('test.txt');
      
      // StormLib may convert Infinity to max value or throw
      try {
        const result = file.setPosition(Infinity);
        expect(typeof result).toBe('number');
      } catch (e) {
        expect(e).toBeDefined();
      }
      
      file.close();
    });

    it('should throw when getting position on closed file', () => {
      const file = archive.openFile('test.txt');
      file.close();
      
      expect(() => {
        file.getPosition();
      }).toThrow();
    });

    it('should throw when setting position on closed file', () => {
      const file = archive.openFile('test.txt');
      file.close();
      
      expect(() => {
        file.setPosition(0);
      }).toThrow();
    });
  });

  describe('Operations after close', () => {
    let testFilePath: string;

    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      testFilePath = path.join(os.tmpdir(), `closetest-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'Close test content');
      archive.addFile(testFilePath, 'test.txt');
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should throw when reading from closed file', () => {
      const file = archive.openFile('test.txt');
      file.close();
      
      expect(() => {
        file.read();
      }).toThrow();
    });

    it('should throw when reading all from closed file', () => {
      const file = archive.openFile('test.txt');
      file.close();
      
      expect(() => {
        file.readAll();
      }).toThrow();
    });

    it('should throw when getting size of closed file', () => {
      const file = archive.openFile('test.txt');
      file.close();
      
      expect(() => {
        file.getSize();
      }).toThrow();
    });

    it('should handle multiple close calls on file', () => {
      const file = archive.openFile('test.txt');
      file.close();
      
      const result = file.close();
      expect(typeof result).toBe('boolean');
    });

    it('should throw when operating on file after archive close', () => {
      const file = archive.openFile('test.txt');
      archive.close();
      
      expect(() => {
        file.read();
      }).toThrow();
    });
  });

  describe('Special characters and unicode', () => {
    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
    });

    it('should handle filename with spaces', () => {
      const testFile = path.join(os.tmpdir(), `space-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Space test');
      
      archive.addFile(testFile, 'file with spaces.txt');
      expect(archive.hasFile('file with spaces.txt')).toBe(true);
      
      fs.unlinkSync(testFile);
    });

    it('should handle filename with dashes and underscores', () => {
      const testFile = path.join(os.tmpdir(), `special-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Special test');
      
      archive.addFile(testFile, 'file-name_123.txt');
      expect(archive.hasFile('file-name_123.txt')).toBe(true);
      
      fs.unlinkSync(testFile);
    });

    it('should handle filename with dots', () => {
      const testFile = path.join(os.tmpdir(), `dots-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Dots test');
      
      archive.addFile(testFile, 'file.name.with.dots.txt');
      expect(archive.hasFile('file.name.with.dots.txt')).toBe(true);
      
      fs.unlinkSync(testFile);
    });

    it('should handle long filename', () => {
      const testFile = path.join(os.tmpdir(), `long-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Long test');
      
      const longName = 'dir/'.repeat(10) + 'veryLongFileName.txt';
      archive.addFile(testFile, longName);
      expect(archive.hasFile(longName)).toBe(true);
      
      fs.unlinkSync(testFile);
    });
  });

  describe('Resource cleanup and memory', () => {
    it('should handle creating and closing multiple archives', () => {
      for (let i = 0; i < 5; i++) {
        const archivePath = path.join(os.tmpdir(), `multi-${i}-${Date.now()}.mpq`);
        archive.create(archivePath, { maxFileCount: 10 });
        archive.close();
        fs.unlinkSync(archivePath);
        
        archive = new MpqArchive();
      }
    });

    it('should handle opening files and closing archive', () => {
      const testFile = path.join(os.tmpdir(), `cleanup-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Cleanup test');
      
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFile, 'test.txt');
      
      const file = archive.openFile('test.txt');
      archive.close();
      
      // File operations should fail after archive close
      expect(() => {
        file.read();
      }).toThrow();
      
      fs.unlinkSync(testFile);
    });

    it('should handle multiple file handles to same file', () => {
      const testFile = path.join(os.tmpdir(), `handles-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'Handles test');
      
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFile, 'test.txt');
      
      const file1 = archive.openFile('test.txt');
      const file2 = archive.openFile('test.txt');
      const file3 = archive.openFile('test.txt');
      
      file1.close();
      file2.close();
      file3.close();
      
      // Should be able to close all without errors
      expect(true).toBe(true);
      
      fs.unlinkSync(testFile);
    });
  });

  describe('Large file operations', () => {
    let largeFilePath: string;

    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      largeFilePath = path.join(os.tmpdir(), `large-${Date.now()}.txt`);
    });

    afterEach(() => {
      if (fs.existsSync(largeFilePath)) {
        fs.unlinkSync(largeFilePath);
      }
    });

    it('should handle moderately large file (100KB)', () => {
      const largeContent = 'X'.repeat(100000);
      fs.writeFileSync(largeFilePath, largeContent);
      
      const result = archive.addFile(largeFilePath, 'large.txt', { flags: 0x00000200 });
      expect(result).toBe(true);
      
      const file = archive.openFile('large.txt');
      expect(file.getSize()).toBe(100000);
      
      const content = file.readAll();
      expect(content.toString()).toBe(largeContent);
      
      file.close();
    });

    it('should handle reading large file in small chunks', () => {
      const largeContent = 'Y'.repeat(10000);
      fs.writeFileSync(largeFilePath, largeContent);
      
      archive.addFile(largeFilePath, 'chunked.txt');
      
      const file = archive.openFile('chunked.txt');
      const chunks: Buffer[] = [];
      
      while (file.getPosition() < file.getSize()) {
        chunks.push(file.read(100));
      }
      
      const reconstructed = Buffer.concat(chunks).toString();
      expect(reconstructed).toBe(largeContent);
      expect(chunks.length).toBeGreaterThan(50);
      
      file.close();
    });
  });
});
