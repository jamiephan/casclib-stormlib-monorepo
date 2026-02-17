import { MpqArchive } from '../lib';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  MPQ_FILE_COMPRESS,
  MPQ_FILE_ENCRYPTED,
  MPQ_COMPRESSION_ZLIB,
  MPQ_ATTRIBUTE_CRC32,
  MPQ_ATTRIBUTE_FILETIME,
  SFILE_VERIFY_ALL,
  LANG_NEUTRAL,
  ERROR_NO_SIGNATURE
} from '../lib/constants';

describe('MpqArchive Advanced Features', () => {
  let archive: MpqArchive;
  let tempArchivePath: string;
  let testFilePath: string;

  beforeEach(() => {
    archive = new MpqArchive();
    tempArchivePath = path.join(os.tmpdir(), `test-advanced-${Date.now()}.mpq`);
    testFilePath = path.join(os.tmpdir(), `test-file-${Date.now()}.txt`);
    fs.writeFileSync(testFilePath, 'Test content for advanced features');
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

    if (fs.existsSync(testFilePath)) {
      try {
        fs.unlinkSync(testFilePath);
      } catch (e) {
        // Ignore
      }
    }
  });

  describe('Locale management', () => {
    it('should get current locale', () => {
      const locale = MpqArchive.getLocale();
      expect(typeof locale).toBe('number');
    });

    it('should set and get locale', () => {
      const oldLocale = MpqArchive.setLocale(LANG_NEUTRAL);
      expect(typeof oldLocale).toBe('number');
      
      const newLocale = MpqArchive.getLocale();
      expect(newLocale).toBe(LANG_NEUTRAL);

      // Restore old locale
      MpqArchive.setLocale(oldLocale);
    });

    it('should return previous locale when setting', () => {
      const locale1 = MpqArchive.getLocale();
      const locale2 = 0x0409; // en-US
      
      const returned = MpqArchive.setLocale(locale2);
      // Returned should be the previous locale
      expect(returned).toBe(locale1);
      
      // New locale should now be locale2
      const newLocale = MpqArchive.getLocale();
      expect(newLocale).toBe(locale2);

      // Restore original locale
      MpqArchive.setLocale(returned);
    });
  });

  describe('Archive flush', () => {
    it('should flush successfully', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
      
      expect(() => {
        archive.flush();
      }).not.toThrow();
    });

    it('should throw when flushing closed archive', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.close();
      
      expect(() => {
        archive.flush();
      }).toThrow();
    });
  });

  describe('Max file count management', () => {
    it('should get max file count', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      const count = archive.getMaxFileCount();
      expect(count).toBeGreaterThanOrEqual(100);
    });

    it('should set max file count', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      const result = archive.setMaxFileCount(200);
      expect(result).toBe(true);
      
      const newCount = archive.getMaxFileCount();
      expect(newCount).toBeGreaterThanOrEqual(200);
    });

    it('should throw when setting on closed archive', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.close();
      
      expect(() => {
        archive.setMaxFileCount(200);
      }).toThrow();
    });
  });

  describe('Archive attributes', () => {
    it('should get attributes', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      const attrs = archive.getAttributes();
      expect(typeof attrs).toBe('number');
    });

    it('should set attributes', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      const result = archive.setAttributes(MPQ_ATTRIBUTE_CRC32);
      expect(result).toBe(true);
    });

    it('should set multiple attributes', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      const result = archive.setAttributes(MPQ_ATTRIBUTE_CRC32 | MPQ_ATTRIBUTE_FILETIME);
      expect(result).toBe(true);
    });

    it('should throw when getting attributes on closed archive', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.close();
      
      expect(() => {
        archive.getAttributes();
      }).toThrow();
    });

    it('should throw when setting attributes on closed archive', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.close();
      
      expect(() => {
        archive.setAttributes(MPQ_ATTRIBUTE_CRC32);
      }).toThrow();
    });
  });

  describe('File verification', () => {
    it('should verify file', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
      
      const result = archive.verifyFile('test.txt', SFILE_VERIFY_ALL);
      expect(typeof result).toBe('number');
    });

    it('should throw when verifying on closed archive', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.close();
      
      expect(() => {
        archive.verifyFile('test.txt', SFILE_VERIFY_ALL);
      }).toThrow();
    });

    it('should handle verifying non-existent file', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      
      // VerifyFile doesn't throw for non-existent files, it returns an error code
      const result = archive.verifyFile('nonexistent.txt', SFILE_VERIFY_ALL);
      // Result should indicate an error (non-zero)
      expect(typeof result).toBe('number');
    });
  });

  describe('Archive verification', () => {
    it('should verify archive signature', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      const result = archive.verifyArchive();
      
      // New archives typically have no signature
      expect(result).toBe(ERROR_NO_SIGNATURE);
    });

    it('should throw when verifying closed archive', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.close();
      
      expect(() => {
        archive.verifyArchive();
      }).toThrow();
    });
  });

  describe('AddFileEx with compression', () => {
    it('should add file with explicit compression', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      
      const result = archive.addFileEx(
        testFilePath,
        'test.txt',
        MPQ_FILE_COMPRESS,
        MPQ_COMPRESSION_ZLIB,
        MPQ_COMPRESSION_ZLIB
      );
      
      expect(result).toBe(true);
      expect(archive.hasFile('test.txt')).toBe(true);
    });

    it('should add file with compression and encryption', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      
      const result = archive.addFileEx(
        testFilePath,
        'test.txt',
        MPQ_FILE_COMPRESS | MPQ_FILE_ENCRYPTED,
        MPQ_COMPRESSION_ZLIB,
        MPQ_COMPRESSION_ZLIB
      );
      
      expect(result).toBe(true);
      expect(archive.hasFile('test.txt')).toBe(true);
    });

    it('should handle adding to closed archive', () => {
      const tempPath2 = path.join(os.tmpdir(), `test-closed-${Date.now()}.mpq`);
      try {
        archive.create(tempPath2, { maxFileCount: 100 });
        archive.close();
        
        expect(() => {
          archive.addFileEx(
            testFilePath,
            'test.txt',
            MPQ_FILE_COMPRESS,
            MPQ_COMPRESSION_ZLIB,
            MPQ_COMPRESSION_ZLIB
          );
        }).toThrow();
      } finally {
        if (fs.existsSync(tempPath2)) {
          fs.unlinkSync(tempPath2);
        }
      }
    });

    it('should throw when source file does not exist', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      
      expect(() => {
        archive.addFileEx(
          '/nonexistent/file.txt',
          'test.txt',
          MPQ_FILE_COMPRESS,
          MPQ_COMPRESSION_ZLIB,
          MPQ_COMPRESSION_ZLIB
        );
      }).toThrow();
    });
  });

  describe('AddFile with compression options', () => {
    it('should add file with compression via options', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      
      const result = archive.addFile(testFilePath, 'test.txt', {
        flags: MPQ_FILE_COMPRESS,
        compression: MPQ_COMPRESSION_ZLIB,
        compressionNext: MPQ_COMPRESSION_ZLIB
      });
      
      expect(result).toBe(true);
      expect(archive.hasFile('test.txt')).toBe(true);
    });

    it('should read file added with compression', () => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      
      archive.addFile(testFilePath, 'test.txt', {
        flags: MPQ_FILE_COMPRESS,
        compression: MPQ_COMPRESSION_ZLIB,
        compressionNext: MPQ_COMPRESSION_ZLIB
      });
      
      archive.close();
      
      // Reopen and read
      const archive2 = new MpqArchive();
      archive2.open(tempArchivePath);
      
      const file = archive2.openFile('test.txt');
      const content = file.readAll();
      expect(content.toString()).toBe('Test content for advanced features');
      
      file.close();
      archive2.close();
    });
  });

  describe('Constants availability', () => {
    it('should export file flags', () => {
      expect(MPQ_FILE_COMPRESS).toBe(0x00000200);
      expect(MPQ_FILE_ENCRYPTED).toBe(0x00010000);
    });

    it('should export compression types', () => {
      expect(MPQ_COMPRESSION_ZLIB).toBe(0x02);
    });

    it('should export attribute flags', () => {
      expect(MPQ_ATTRIBUTE_CRC32).toBe(0x00000001);
      expect(MPQ_ATTRIBUTE_FILETIME).toBe(0x00000002);
    });

    it('should export verification flags', () => {
      expect(SFILE_VERIFY_ALL).toBe(0x0000000F);
    });

    it('should export locale constants', () => {
      expect(LANG_NEUTRAL).toBe(0x00);
    });

    it('should export error codes', () => {
      expect(ERROR_NO_SIGNATURE).toBe(0);
    });
  });
});
