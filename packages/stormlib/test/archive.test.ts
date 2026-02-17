import { MpqArchive, MPQ_FILE_COMPRESS, MPQ_FILE_ENCRYPTED, MPQ_FILE_SINGLE_UNIT, MPQ_FILE_SECTOR_CRC, MPQ_FILE_REPLACEEXISTING } from '../lib';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('MpqArchive Basic Operations', () => {
  let archive: MpqArchive;
  let tempArchivePath: string;

  beforeEach(() => {
    archive = new MpqArchive();
    tempArchivePath = path.join(os.tmpdir(), `test-archive-${Date.now()}.mpq`);
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

  describe('Opening archives', () => {
    it('should throw error when opening non-existent archive', () => {
      expect(() => {
        archive.open('/non/existent/archive.mpq');
      }).toThrow();
    });

    it('should throw error when opening with invalid path', () => {
      expect(() => {
        archive.open('');
      }).toThrow();
    });

    it('should throw error with null path', () => {
      expect(() => {
        archive.open(null as any);
      }).toThrow();
    });

    it('should throw error with undefined path', () => {
      expect(() => {
        archive.open(undefined as any);
      }).toThrow();
    });

    it('should throw with non-MPQ file', () => {
      const textFilePath = path.join(os.tmpdir(), `not-mpq-${Date.now()}.txt`);
      fs.writeFileSync(textFilePath, 'This is not an MPQ file');

      expect(() => {
        archive.open(textFilePath);
      }).toThrow();

      fs.unlinkSync(textFilePath);
    });
  });

  describe('Creating archives', () => {
    it('should create a new archive', () => {
      expect(() => {
        archive.create(tempArchivePath, { maxFileCount: 100 });
      }).not.toThrow();
      
      expect(fs.existsSync(tempArchivePath)).toBe(true);
    });

    it('should create archive with default max file count', () => {
      archive.create(tempArchivePath);
      expect(fs.existsSync(tempArchivePath)).toBe(true);
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

    it('should create archive with custom flags', () => {
      archive.create(tempArchivePath, { maxFileCount: 100, flags: 0 });
      expect(fs.existsSync(tempArchivePath)).toBe(true);
    });

    it('should throw when creating with empty path', () => {
      expect(() => {
        archive.create('');
      }).toThrow();
    });

    it('should throw when creating with null path', () => {
      expect(() => {
        archive.create(null as any);
      }).toThrow();
    });

    it('should handle negative max file count', () => {
      // StormLib may normalize negative values internally
      // Just verify it doesn't crash
      try {
        archive.create(tempArchivePath, { maxFileCount: -1 });
        expect(fs.existsSync(tempArchivePath)).toBe(true);
      } catch (e) {
        // Also acceptable if it throws
        expect(e).toBeDefined();
      }
    });
  });

  describe('Closing archives', () => {
    it('should close successfully without opening', () => {
      const result = archive.close();
      expect(typeof result).toBe('boolean');
    });

    it('should close after creating', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      const result = archive.close();
      expect(result).toBe(true);
    });

    it('should handle multiple close calls', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.close();
      const result = archive.close();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('File existence checks', () => {
    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
    });

    it('should return false for non-existent file', () => {
      const exists = archive.hasFile('nonexistent.txt');
      expect(exists).toBe(false);
    });

    it('should return true after adding file', () => {
      const testFilePath = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'Test content');
      
      archive.addFile(testFilePath, 'test.txt');
      expect(archive.hasFile('test.txt')).toBe(true);
      
      fs.unlinkSync(testFilePath);
    });

    it('should return false after removing file', () => {
      const testFilePath = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'Test content');
      
      archive.addFile(testFilePath, 'test.txt');
      archive.removeFile('test.txt');
      expect(archive.hasFile('test.txt')).toBe(false);
      
      fs.unlinkSync(testFilePath);
    });

    it('should handle empty filename', () => {
      const exists = archive.hasFile('');
      expect(exists).toBe(false);
    });

    it('should handle null filename', () => {
      expect(() => {
        archive.hasFile(null as any);
      }).toThrow();
    });

    it('should handle undefined filename', () => {
      expect(() => {
        archive.hasFile(undefined as any);
      }).toThrow();
    });
  });

  describe('Adding files', () => {
    let testFilePath: string;

    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      testFilePath = path.join(os.tmpdir(), `addfile-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'Add file test content');
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should add file to archive', () => {
      const result = archive.addFile(testFilePath, 'test.txt');
      expect(result).toBe(true);
      expect(archive.hasFile('test.txt')).toBe(true);
    });

    it('should add file with compression', () => {
      const result = archive.addFile(testFilePath, 'compressed.txt', {
        flags: MPQ_FILE_COMPRESS
      });
      expect(result).toBe(true);
    });

    it('should add file with compression and CRC', () => {
      const result = archive.addFile(testFilePath, 'compressed-crc.txt', {
        flags: MPQ_FILE_COMPRESS | MPQ_FILE_SECTOR_CRC
      });
      expect(result).toBe(true);
    });

    it('should add file as single unit', () => {
      const result = archive.addFile(testFilePath, 'single.txt', {
        flags: MPQ_FILE_SINGLE_UNIT
      });
      expect(result).toBe(true);
    });

    it('should add file with path in archive name', () => {
      const result = archive.addFile(testFilePath, 'dir/subdir/file.txt');
      expect(result).toBe(true);
      expect(archive.hasFile('dir/subdir/file.txt')).toBe(true);
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

    it('should throw when adding with empty archive name', () => {
      expect(() => {
        archive.addFile(testFilePath, '');
      }).toThrow();
    });

    it('should replace existing file', () => {
      archive.addFile(testFilePath, 'replace.txt');
      
      fs.writeFileSync(testFilePath, 'Updated content');
      const result = archive.addFile(testFilePath, 'replace.txt', {
        flags: MPQ_FILE_REPLACEEXISTING
      });
      
      expect(result).toBe(true);
    });
  });

  describe('Removing files', () => {
    let testFilePath: string;

    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      testFilePath = path.join(os.tmpdir(), `removefile-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'Remove file test');
      archive.addFile(testFilePath, 'test.txt');
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should remove file from archive', () => {
      expect(archive.hasFile('test.txt')).toBe(true);
      const result = archive.removeFile('test.txt');
      expect(result).toBe(true);
      expect(archive.hasFile('test.txt')).toBe(false);
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

    it('should throw when removing same file twice', () => {
      archive.removeFile('test.txt');
      expect(() => {
        archive.removeFile('test.txt');
      }).toThrow();
    });
  });

  describe('Renaming files', () => {
    let testFilePath: string;

    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      testFilePath = path.join(os.tmpdir(), `renamefile-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'Rename file test');
      archive.addFile(testFilePath, 'old-name.txt');
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should rename file in archive', () => {
      const result = archive.renameFile('old-name.txt', 'new-name.txt');
      expect(result).toBe(true);
      expect(archive.hasFile('new-name.txt')).toBe(true);
      expect(archive.hasFile('old-name.txt')).toBe(false);
    });

    it('should rename file with path', () => {
      const result = archive.renameFile('old-name.txt', 'dir/new-name.txt');
      expect(result).toBe(true);
      expect(archive.hasFile('dir/new-name.txt')).toBe(true);
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
      expect(() => {
        archive.renameFile('old-name.txt', '');
      }).toThrow();
    });
  });

  describe('Extracting files', () => {
    let testFilePath: string;
    const testContent = 'Extract file test content';

    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      testFilePath = path.join(os.tmpdir(), `extractfile-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, testContent);
      archive.addFile(testFilePath, 'test.txt');
      fs.unlinkSync(testFilePath); // Remove source file
    });

    it('should extract file from archive', () => {
      const extractPath = path.join(os.tmpdir(), `extracted-${Date.now()}.txt`);
      
      const result = archive.extractFile('test.txt', extractPath);
      expect(result).toBe(true);
      expect(fs.existsSync(extractPath)).toBe(true);
      
      const content = fs.readFileSync(extractPath, 'utf8');
      expect(content).toBe(testContent);
      
      fs.unlinkSync(extractPath);
    });

    it('should throw when extracting non-existent file', () => {
      const extractPath = path.join(os.tmpdir(), `extracted-${Date.now()}.txt`);
      
      expect(() => {
        archive.extractFile('nonexistent.txt', extractPath);
      }).toThrow();
    });

    it('should throw when extracting with empty source', () => {
      const extractPath = path.join(os.tmpdir(), `extracted-${Date.now()}.txt`);
      
      expect(() => {
        archive.extractFile('', extractPath);
      }).toThrow();
    });

    it('should throw when extracting with empty destination', () => {
      expect(() => {
        archive.extractFile('test.txt', '');
      }).toThrow();
    });
  });

  describe('Archive maximum file count', () => {
    it('should return max file count after creation', () => {
      archive.create(tempArchivePath, { maxFileCount: 500 });
      const maxCount = archive.getMaxFileCount();
      expect(typeof maxCount).toBe('number');
      expect(maxCount).toBeGreaterThanOrEqual(500);
    });

    it('should return max file count for large archive', () => {
      archive.create(tempArchivePath, { maxFileCount: 10000 });
      const maxCount = archive.getMaxFileCount();
      expect(maxCount).toBeGreaterThanOrEqual(10000);
    });

    it('should throw when getting max file count on closed archive', () => {
      expect(() => {
        archive.getMaxFileCount();
      }).toThrow();
    });
  });

  describe('Archive compacting', () => {
    let testFilePath: string;

    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      testFilePath = path.join(os.tmpdir(), `compact-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'A'.repeat(1000));
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should compact empty archive', () => {
      const result = archive.compact();
      expect(result).toBe(true);
    });

    it('should compact archive with files', () => {
      archive.addFile(testFilePath, 'file1.txt');
      archive.addFile(testFilePath, 'file2.txt');
      
      const result = archive.compact();
      expect(result).toBe(true);
    });

    it('should compact after removing files', () => {
      for (let i = 0; i < 5; i++) {
        archive.addFile(testFilePath, `file${i}.txt`);
      }
      
      for (let i = 0; i < 3; i++) {
        archive.removeFile(`file${i}.txt`);
      }
      
      const result = archive.compact();
      expect(result).toBe(true);
      
      // Verify remaining files still accessible
      expect(archive.hasFile('file3.txt')).toBe(true);
      expect(archive.hasFile('file4.txt')).toBe(true);
    });

    it('should throw when compacting closed archive', () => {
      archive.close();
      expect(() => {
        archive.compact();
      }).toThrow();
    });
  });

  describe('Opening existing archives', () => {
    let testFilePath: string;

    beforeEach(() => {
      testFilePath = path.join(os.tmpdir(), `opentest-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'Open test content');
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should open newly created archive', () => {
      // Create archive
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
      archive.close();

      // Open archive
      const archive2 = new MpqArchive();
      expect(() => {
        archive2.open(tempArchivePath);
      }).not.toThrow();

      expect(archive2.hasFile('test.txt')).toBe(true);
      archive2.close();
    });

    it('should read files from opened archive', () => {
      // Create and populate archive
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
      archive.close();

      // Open and read
      const archive2 = new MpqArchive();
      archive2.open(tempArchivePath);
      
      const file = archive2.openFile('test.txt');
      const content = file.readAll();
      expect(content.toString()).toBe('Open test content');
      
      file.close();
      archive2.close();
    });
  });
});
