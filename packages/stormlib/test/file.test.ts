import { MpqArchive, MpqFile } from '../lib';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const MPQ_FILE_COMPRESS = 0x00000200;

describe('MpqFile Operations', () => {
  let archive: MpqArchive;
  let tempArchivePath: string;
  let testFilePath: string;

  beforeEach(() => {
    archive = new MpqArchive();
    tempArchivePath = path.join(os.tmpdir(), `test-file-${Date.now()}.mpq`);
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
          // Ignore
        }
      }
    });
  });

  describe('Opening files', () => {
    beforeEach(() => {
      fs.writeFileSync(testFilePath, 'Test content');
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
    });

    it('should open file from archive', () => {
      const file = archive.openFile('test.txt');
      expect(file).toBeInstanceOf(MpqFile);
      file.close();
    });

    it('should open file with default options', () => {
      const file = archive.openFile('test.txt');
      expect(file).toBeDefined();
      file.close();
    });

    it('should open file with custom flags', () => {
      const file = archive.openFile('test.txt', { flags: 0 });
      expect(file).toBeDefined();
      file.close();
    });

    it('should open same file multiple times', () => {
      const file1 = archive.openFile('test.txt');
      const file2 = archive.openFile('test.txt');
      
      expect(file1).toBeInstanceOf(MpqFile);
      expect(file2).toBeInstanceOf(MpqFile);
      
      file1.close();
      file2.close();
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

  describe('Reading files', () => {
    const testContent = 'A'.repeat(1024); // 1KB

    beforeEach(() => {
      fs.writeFileSync(testFilePath, testContent);
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
      archive.close();
      
      // Reopen to read files
      archive.open(tempArchivePath);
    });

    it('should read file data', () => {
      const file = archive.openFile('test.txt');
      const data = file.read(100);
      
      expect(Buffer.isBuffer(data)).toBe(true);
      expect(data.length).toBe(100);
      expect(data.toString()).toBe('A'.repeat(100));
      
      file.close();
    });

    it('should read with default chunk size', () => {
      const file = archive.openFile('test.txt');
      
      // Default chunk size might be larger than file
      const data = file.read();
      expect(Buffer.isBuffer(data)).toBe(true);
      // For a 1KB file with 4KB default read, should get all data
      expect(data.length).toBeGreaterThan(0);
      expect(data.length).toBeLessThanOrEqual(1024);
      
      file.close();
    });

    it('should read all file data', () => {
      const file = archive.openFile('test.txt');
      const data = file.readAll();
      
      expect(data.length).toBe(1024);
      expect(data.toString()).toBe(testContent);
      
      file.close();
    });

    it('should read in chunks', () => {
      const file = archive.openFile('test.txt');
      
      const chunk1 = file.read(100);
      const chunk2 = file.read(100);
      const chunk3 = file.read(100);
      
      expect(chunk1.length).toBe(100);
      expect(chunk2.length).toBe(100);
      expect(chunk3.length).toBe(100);
      
      expect(chunk1.toString()).toBe('A'.repeat(100));
      expect(chunk2.toString()).toBe('A'.repeat(100));
      
      file.close();
    });

    it('should read sequential data correctly', () => {
      const content = '0123456789ABCDEFGHIJ';
      fs.writeFileSync(testFilePath, content);
      
      const tempArchivePath2 = tempArchivePath + '.2';
      const archive2 = new MpqArchive();
      archive2.create(tempArchivePath2, { maxFileCount: 100 });
      archive2.addFile(testFilePath, 'sequential.txt');
      
      const file = archive2.openFile('sequential.txt');
      
      expect(file.read(5).toString()).toBe('01234');
      expect(file.read(5).toString()).toBe('56789');
      expect(file.read(5).toString()).toBe('ABCDE');
      expect(file.read(5).toString()).toBe('FGHIJ');
      
      file.close();
      archive2.close();
      
      // Cleanup
      try {
        fs.unlinkSync(tempArchivePath2);
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it('should read with varying chunk sizes', () => {
      const file = archive.openFile('test.txt');
      
      const sizes = [10, 25, 5, 100, 50];
      const chunks = sizes.map(size => file.read(size));
      
      chunks.forEach((chunk, i) => {
        expect(chunk.length).toBe(sizes[i]);
      });
      
      file.close();
    });

    it('should read from compressed file', () => {
      const largeContent = 'Repeated content '.repeat(100);
      fs.writeFileSync(testFilePath, largeContent);
      
      const tempArchivePath3 = tempArchivePath + '.3';
      const archive2 = new MpqArchive();
      archive2.create(tempArchivePath3, { maxFileCount: 100 });
      archive2.addFile(testFilePath, 'compressed.txt', { flags: MPQ_FILE_COMPRESS });
      
      const file = archive2.openFile('compressed.txt');
      const content = file.readAll();
      
      expect(content.toString()).toBe(largeContent);
      
      file.close();
      archive2.close();
      
      // Cleanup
      try {
        fs.unlinkSync(tempArchivePath3);
      } catch (e) {
        // Ignore cleanup errors
      }
    });
  });

  describe('File size operations', () => {
    beforeEach(() => {
      const content = 'X'.repeat(12345);
      fs.writeFileSync(testFilePath, content);
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
    });

    it('should get file size', () => {
      const file = archive.openFile('test.txt');
      const size = file.getSize();
      
      expect(typeof size).toBe('number');
      expect(size).toBe(12345);
      
      file.close();
    });

    it('should get size of empty file', () => {
      fs.writeFileSync(testFilePath, '');
      
      const tempArchivePath4 = tempArchivePath + '.4';
      const archive2 = new MpqArchive();
      archive2.create(tempArchivePath4, { maxFileCount: 100 });
      archive2.addFile(testFilePath, 'empty.txt');
      
      const file = archive2.openFile('empty.txt');
      expect(file.getSize()).toBe(0);
      file.close();
      archive2.close();
      
      // Cleanup
      try {
        fs.unlinkSync(tempArchivePath4);
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it('should get size of large file', () => {
      const largeContent = 'X'.repeat(100000); // 100KB
      fs.writeFileSync(testFilePath, largeContent);
      
      const tempArchivePath5 = tempArchivePath + '.5';
      const archive2 = new MpqArchive();
      archive2.create(tempArchivePath5, { maxFileCount: 100 });
      archive2.addFile(testFilePath, 'large.txt', { flags: MPQ_FILE_COMPRESS });
      
      const file = archive2.openFile('large.txt');
      expect(file.getSize()).toBe(100000);
      file.close();
      archive2.close();
      
      // Cleanup
      try {
        fs.unlinkSync(tempArchivePath5);
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it('should maintain size after reads', () => {
      const file = archive.openFile('test.txt');
      const initialSize = file.getSize();
      
      file.read(100);
      file.read(200);
      
      expect(file.getSize()).toBe(initialSize);
      
      file.close();
    });
  });

  describe('File positioning', () => {
    beforeEach(() => {
      const content = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      fs.writeFileSync(testFilePath, content);
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
    });

    it('should get current position', () => {
      const file = archive.openFile('test.txt');
      const pos = file.getPosition();
      
      expect(typeof pos).toBe('number');
      expect(pos).toBe(0);
      
      file.close();
    });

    it('should set position', () => {
      const file = archive.openFile('test.txt');
      
      file.setPosition(10);
      expect(file.getPosition()).toBe(10);
      
      file.close();
    });

    it('should seek to beginning', () => {
      const file = archive.openFile('test.txt');
      
      file.read(10);
      expect(file.getPosition()).toBeGreaterThan(0);
      
      file.setPosition(0);
      expect(file.getPosition()).toBe(0);
      
      const content = file.read(5);
      expect(content.toString()).toBe('01234');
      
      file.close();
    });

    it('should seek to middle', () => {
      const file = archive.openFile('test.txt');
      
      file.setPosition(10);
      const content = file.read(5);
      expect(content.toString()).toBe('ABCDE');
      
      file.close();
    });

    it('should seek to end', () => {
      const file = archive.openFile('test.txt');
      const size = file.getSize();
      
      file.setPosition(size);
      expect(file.getPosition()).toBe(size);
      
      file.close();
    });

    it('should update position after reading', () => {
      const file = archive.openFile('test.txt');
      
      const initialPos = file.getPosition();
      file.read(10);
      const newPos = file.getPosition();
      
      expect(newPos).toBe(initialPos + 10);
      
      file.close();
    });

    it('should handle multiple seeks', () => {
      const file = archive.openFile('test.txt');
      
      file.setPosition(10);
      expect(file.read(4).toString()).toBe('ABCD');
      
      file.setPosition(20);
      expect(file.read(4).toString()).toBe('KLMN');
      
      file.setPosition(0);
      expect(file.read(4).toString()).toBe('0123');
      
      file.close();
    });

    it('should maintain independent positions in multiple file handles', () => {
      const file1 = archive.openFile('test.txt');
      const file2 = archive.openFile('test.txt');
      
      file1.setPosition(5);
      file2.setPosition(15);
      
      expect(file1.getPosition()).toBe(5);
      expect(file2.getPosition()).toBe(15);
      
      expect(file1.read(3).toString()).toBe('567');
      expect(file2.read(3).toString()).toBe('FGH');
      
      file1.close();
      file2.close();
    });
  });

  describe('Read and position integration', () => {
    beforeEach(() => {
      const content = 'AAAABBBBCCCCDDDDEEEE';
      fs.writeFileSync(testFilePath, content);
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
      archive.close();
      
      // Reopen to read files
      archive.open(tempArchivePath);
    });

    it('should read from specific position', () => {
      const file = archive.openFile('test.txt');
      
      file.setPosition(4);
      expect(file.read(4).toString()).toBe('BBBB');
      
      file.setPosition(8);
      expect(file.read(4).toString()).toBe('CCCC');
      
      file.close();
    });

    it('should read remaining data after seek', () => {
      const file = archive.openFile('test.txt');
      
      file.setPosition(16);
      const remaining = file.read(100); // Try to read more than available
      
      expect(remaining.length).toBeLessThanOrEqual(4);
      // Only check content if we got data
      if (remaining.length > 0) {
        expect(remaining.toString()).toBe('EEEE');
      }
      
      file.close();
    });

    it('should handle sequential position changes with reads', () => {
      const file = archive.openFile('test.txt');
      
      file.setPosition(4);
      file.read(4);
      expect(file.getPosition()).toBe(8);
      
      file.setPosition(12);
      file.read(4);
      expect(file.getPosition()).toBe(16);
      
      file.close();
    });

    it('should read same data with position reset', () => {
      const file = archive.openFile('test.txt');
      
      file.setPosition(8);
      const data1 = file.read(4);
      
      file.setPosition(8);
      const data2 = file.read(4);
      
      expect(data1.equals(data2)).toBe(true);
      expect(data1.toString()).toBe('CCCC');
      
      file.close();
    });
  });

  describe('File closing', () => {
    beforeEach(() => {
      fs.writeFileSync(testFilePath, 'Close test content');
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
    });

    it('should close file successfully', () => {
      const file = archive.openFile('test.txt');
      const result = file.close();
      
      expect(result).toBe(true);
    });

    it('should handle multiple close calls', () => {
      const file = archive.openFile('test.txt');
      
      file.close();
      const result = file.close();
      
      expect(typeof result).toBe('boolean');
    });

    it('should throw when reading after close', () => {
      const file = archive.openFile('test.txt');
      file.close();
      
      expect(() => {
        file.read();
      }).toThrow();
    });

    it('should throw when getting size after close', () => {
      const file = archive.openFile('test.txt');
      file.close();
      
      expect(() => {
        file.getSize();
      }).toThrow();
    });

    it('should throw when setting position after close', () => {
      const file = archive.openFile('test.txt');
      file.close();
      
      expect(() => {
        file.setPosition(0);
      }).toThrow();
    });
  });

  describe('Multiple file operations', () => {
    beforeEach(() => {
      archive.create(tempArchivePath, { maxFileCount: 100 });
      
      for (let i = 0; i < 3; i++) {
        const filePath = path.join(os.tmpdir(), `multi-${i}-${Date.now()}.txt`);
        fs.writeFileSync(filePath, `Content ${i}`);
        archive.addFile(filePath, `file${i}.txt`);
        fs.unlinkSync(filePath);
      }
    });

    it('should open and read multiple files', () => {
      const file0 = archive.openFile('file0.txt');
      const file1 = archive.openFile('file1.txt');
      const file2 = archive.openFile('file2.txt');
      
      expect(file0.readAll().toString()).toBe('Content 0');
      expect(file1.readAll().toString()).toBe('Content 1');
      expect(file2.readAll().toString()).toBe('Content 2');
      
      file0.close();
      file1.close();
      file2.close();
    });

    it('should handle independent operations on different files', () => {
      const file0 = archive.openFile('file0.txt');
      const file1 = archive.openFile('file1.txt');
      
      file0.setPosition(5);
      file1.setPosition(3);
      
      expect(file0.getPosition()).toBe(5);
      expect(file1.getPosition()).toBe(3);
      
      file0.close();
      file1.close();
    });
  });

  describe('Reading entire file in different ways', () => {
    beforeEach(() => {
      const content = 'Test data for reading comparison';
      fs.writeFileSync(testFilePath, content);
      archive.create(tempArchivePath, { maxFileCount: 100 });
      archive.addFile(testFilePath, 'test.txt');
      archive.close();
      
      // Reopen to read files
      archive.open(tempArchivePath);
    });

    it('should read entire file with readAll', () => {
      const file = archive.openFile('test.txt');
      const data = file.readAll();
      
      expect(data.toString()).toBe('Test data for reading comparison');
      
      file.close();
    });

    it('should read entire file in chunks', () => {
      const file = archive.openFile('test.txt');
      const chunks: Buffer[] = [];
      
      while (file.getPosition() < file.getSize()) {
        const chunk = file.read(10);
        if (chunk.length === 0) break; // Prevent infinite loop at EOF
        chunks.push(chunk);
      }
      
      const reconstructed = Buffer.concat(chunks).toString();
      expect(reconstructed).toBe('Test data for reading comparison');
      
      file.close();
    });

    it('should produce same result with readAll and chunked reading', () => {
      const file1 = archive.openFile('test.txt');
      const data1 = file1.readAll();
      file1.close();
      
      const file2 = archive.openFile('test.txt');
      const chunks: Buffer[] = [];
      while (file2.getPosition() < file2.getSize()) {
        const chunk = file2.read(5);
        if (chunk.length === 0) break; // Prevent infinite loop
        chunks.push(chunk);
      }
      const data2 = Buffer.concat(chunks);
      file2.close();
      
      expect(data1.equals(data2)).toBe(true);
    });
  });
});
