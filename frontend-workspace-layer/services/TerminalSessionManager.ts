import { NativeBridge } from './NativeBridge';

/**
 * TerminalSessionManager — handles raw input streams between the client-side
 * xterm.js instance and the native process pipeline.
 */
export class TerminalSessionManager {
  private workspacePath: string | null = null;
  private onDataHandler: ((data: string) => void) | null = null;
  private onExitHandler: (() => void) | null = null;
  private emitter = NativeBridge.terminalEvents();

  public onData(handler: (data: string) => void): void {
    this.onDataHandler = handler;
    this.emitter?.addListener('onPtyData', handler);
  }

  public onExit(handler: () => void): void {
    this.onExitHandler = handler;
    this.emitter?.addListener('onPtyExit', handler);
  }

  public initializeActiveSession(workspacePath: string): void {
    this.workspacePath = workspacePath;
    NativeBridge.createPtySession(workspacePath);
  }

  public write(input: string): void {
    NativeBridge.writeToPty(input);
  }

  public resize(columns: number, rows: number): void {
    NativeBridge.resizePty(columns, rows);
  }

  public destroy(): void {
    if (this.onDataHandler) {
      this.emitter?.removeAllListeners('onPtyData');
      this.onDataHandler = null;
    }
    if (this.onExitHandler) {
      this.emitter?.removeAllListeners('onPtyExit');
      this.onExitHandler = null;
    }
    NativeBridge.destroyPtySession();
    this.workspacePath = null;
  }
}
