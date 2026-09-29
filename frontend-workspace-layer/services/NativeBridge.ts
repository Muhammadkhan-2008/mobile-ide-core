import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

/**
 * JS-to-Native asynchronous execution communications layer.
 * Wraps the three native modules registered in CoreNativePackage and exposes
 * typed, promise-based accessors plus a PTY event emitter for the terminal.
 */

const { StorageBridgePlugin, TerminalBridgePlugin, SecureKeystore } = NativeModules;

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: number;
}

export class NativeBridge {
  static get isNativeAvailable(): boolean {
    return Platform.OS === 'android' && !!StorageBridgePlugin;
  }

  // --- Storage ---
  static async readDirectory(targetPath: string): Promise<FileEntry[]> {
    if (!this.isNativeAvailable) return [];
    return StorageBridgePlugin.getDirectoryFiles(targetPath);
  }

  static async readFile(filePath: string): Promise<string> {
    if (!this.isNativeAvailable) return '';
    return StorageBridgePlugin.readFileContents(filePath);
  }

  static async writeFile(filePath: string, content: string): Promise<boolean> {
    if (!this.isNativeAvailable) return false;
    return StorageBridgePlugin.writeFileContents(filePath, content);
  }

  static async createDirectory(parentPath: string, name: string): Promise<boolean> {
    if (!this.isNativeAvailable) return false;
    return StorageBridgePlugin.createDirectory(parentPath, name);
  }

  static async deletePath(targetPath: string): Promise<boolean> {
    if (!this.isNativeAvailable) return false;
    return StorageBridgePlugin.deletePath(targetPath);
  }

  // --- Terminal ---
  static createPtySession(workspacePath: string): void {
    if (!this.isNativeAvailable) return;
    TerminalBridgePlugin.createPtySession(workspacePath);
  }

  static writeToPty(input: string): void {
    if (!this.isNativeAvailable) return;
    TerminalBridgePlugin.writeToPtyStream(input);
  }

  static resizePty(columns: number, rows: number): void {
    if (!this.isNativeAvailable) return;
    TerminalBridgePlugin.resizePty(columns, rows);
  }

  static destroyPtySession(): void {
    if (!this.isNativeAvailable) return;
    TerminalBridgePlugin.destroySession();
  }

  static terminalEvents(): NativeEventEmitter | null {
    if (!this.isNativeAvailable) return null;
    return new NativeEventEmitter(TerminalBridgePlugin);
  }

  // --- Secure Keystore (BYOK) ---
  static async storeSecret(key: string, value: string): Promise<boolean> {
    if (!this.isNativeAvailable) return false;
    return SecureKeystore.storeKey(key, value);
  }

  static async getSecret(key: string): Promise<string | null> {
    if (!this.isNativeAvailable) return null;
    return SecureKeystore.getKey(key);
  }

  static async deleteSecret(key: string): Promise<boolean> {
    if (!this.isNativeAvailable) return false;
    return SecureKeystore.deleteKey(key);
  }
}
