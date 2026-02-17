import { CascStorage, CascFile, Storage, File } from '../lib';

describe('CascLib Module Exports', () => {
  describe('Named exports', () => {
    it('should export CascStorage class', () => {
      expect(CascStorage).toBeDefined();
      expect(typeof CascStorage).toBe('function');
    });

    it('should export CascFile class', () => {
      expect(CascFile).toBeDefined();
      expect(typeof CascFile).toBe('function');
    });

    it('should export Storage binding', () => {
      expect(Storage).toBeDefined();
      expect(typeof Storage).toBe('function');
    });

    it('should export File binding', () => {
      expect(File).toBeDefined();
      expect(typeof File).toBe('function');
    });
  });

  describe('CascStorage instantiation', () => {
    it('should create a storage instance', () => {
      const storage = new CascStorage();
      expect(storage).toBeInstanceOf(CascStorage);
      storage.close();
    });

    it('should create multiple independent instances', () => {
      const storage1 = new CascStorage();
      const storage2 = new CascStorage();
      
      expect(storage1).toBeInstanceOf(CascStorage);
      expect(storage2).toBeInstanceOf(CascStorage);
      expect(storage1).not.toBe(storage2);
      
      storage1.close();
      storage2.close();
    });
  });

  describe('Type safety', () => {
    it('should have correct method signatures on CascStorage', () => {
      const storage = new CascStorage();
      
      expect(typeof storage.open).toBe('function');
      expect(typeof storage.openOnline).toBe('function');
      expect(typeof storage.openEx).toBe('function');
      expect(typeof storage.close).toBe('function');
      expect(typeof storage.fileExists).toBe('function');
      expect(typeof storage.getFileInfo).toBe('function');
      expect(typeof storage.openFile).toBe('function');
      expect(typeof storage.findFirstFile).toBe('function');
      expect(typeof storage.findNextFile).toBe('function');
      expect(typeof storage.findClose).toBe('function');
      expect(typeof storage.getStorageInfo).toBe('function');
      expect(typeof storage.addEncryptionKey).toBe('function');
      expect(typeof storage.addStringEncryptionKey).toBe('function');
      expect(typeof storage.importKeysFromString).toBe('function');
      expect(typeof storage.importKeysFromFile).toBe('function');
      expect(typeof storage.findEncryptionKey).toBe('function');
      expect(typeof storage.getNotFoundEncryptionKey).toBe('function');
      
      storage.close();
    });
  });
});
