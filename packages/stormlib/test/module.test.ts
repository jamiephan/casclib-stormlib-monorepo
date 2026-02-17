import { MpqArchive, MpqFile, Archive, File } from '../lib';

describe('StormLib Module Exports', () => {
  describe('Named exports', () => {
    it('should export MpqArchive class', () => {
      expect(MpqArchive).toBeDefined();
      expect(typeof MpqArchive).toBe('function');
    });

    it('should export MpqFile class', () => {
      expect(MpqFile).toBeDefined();
      expect(typeof MpqFile).toBe('function');
    });

    it('should export Archive binding', () => {
      expect(Archive).toBeDefined();
      expect(typeof Archive).toBe('function');
    });

    it('should export File binding', () => {
      expect(File).toBeDefined();
      expect(typeof File).toBe('function');
    });
  });

  describe('MpqArchive instantiation', () => {
    it('should create an archive instance', () => {
      const archive = new MpqArchive();
      expect(archive).toBeInstanceOf(MpqArchive);
      archive.close();
    });

    it('should create multiple independent instances', () => {
      const archive1 = new MpqArchive();
      const archive2 = new MpqArchive();
      
      expect(archive1).toBeInstanceOf(MpqArchive);
      expect(archive2).toBeInstanceOf(MpqArchive);
      expect(archive1).not.toBe(archive2);
      
      archive1.close();
      archive2.close();
    });
  });

  describe('Type safety', () => {
    it('should have correct method signatures on MpqArchive', () => {
      const archive = new MpqArchive();
      
      expect(typeof archive.open).toBe('function');
      expect(typeof archive.create).toBe('function');
      expect(typeof archive.close).toBe('function');
      expect(typeof archive.hasFile).toBe('function');
      expect(typeof archive.openFile).toBe('function');
      expect(typeof archive.extractFile).toBe('function');
      expect(typeof archive.addFile).toBe('function');
      expect(typeof archive.removeFile).toBe('function');
      expect(typeof archive.renameFile).toBe('function');
      expect(typeof archive.compact).toBe('function');
      expect(typeof archive.getMaxFileCount).toBe('function');
      
      archive.close();
    });

    it('should have correct method signatures on MpqFile', () => {
      const archive = new MpqArchive();
      // Note: We can't actually create an MpqFile without a valid archive and file,
      // but we can check the class has the right methods
      expect(MpqFile.prototype.read).toBeDefined();
      expect(MpqFile.prototype.readAll).toBeDefined();
      expect(MpqFile.prototype.getSize).toBeDefined();
      expect(MpqFile.prototype.getPosition).toBeDefined();
      expect(MpqFile.prototype.setPosition).toBeDefined();
      expect(MpqFile.prototype.close).toBeDefined();
      
      archive.close();
    });
  });

  describe('Default export', () => {
    it('should have default export with all classes', async () => {
      const defaultExport = await import('../lib');
      expect(defaultExport.default).toBeDefined();
      expect(defaultExport.default.MpqArchive).toBe(MpqArchive);
      expect(defaultExport.default.MpqFile).toBe(MpqFile);
      expect(defaultExport.default.Archive).toBe(Archive);
      expect(defaultExport.default.File).toBe(File);
    });
  });
});
