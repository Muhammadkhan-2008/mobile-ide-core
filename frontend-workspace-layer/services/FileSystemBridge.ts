import { NativeBridge, FileEntry } from './NativeBridge';

/**
 * FileSystemBridge — links the JavaScript tree layout views directly with the
 * Android native storage layer. A thin typed facade over NativeBridge so UI
 * components never touch NativeModules directly.
 */
export class NativeFileSystem {
  static async readDirectory(targetPath: string): Promise<FileEntry[]> {
    return NativeBridge.readDirectory(targetPath);
  }

  static async readFile(filePath: string): Promise<string> {
    return NativeBridge.readFile(filePath);
  }

  static async writeFile(filePath: string, content: string): Promise<boolean> {
    return NativeBridge.writeFile(filePath, content);
  }

  static async createDirectory(parentPath: string, name: string): Promise<boolean> {
    return NativeBridge.createDirectory(parentPath, name);
  }

  static async deletePath(targetPath: string): Promise<boolean> {
    return NativeBridge.deletePath(targetPath);
  }
}
