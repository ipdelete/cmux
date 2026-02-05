// TerminalService using node-pty for proper PTY support
import * as pty from '@homebridge/node-pty-prebuilt-multiarch';
import * as os from 'os';

interface TerminalInstance {
  id: string;
  pty: pty.IPty;
  cwd: string;
}

class TerminalService {
  private terminals: Map<string, TerminalInstance> = new Map();

  getDefaultShell(): string {
    if (os.platform() === 'win32') {
      return 'powershell.exe';
    }
    return process.env.SHELL || '/bin/bash';
  }

  create(id: string, cwd: string): string {
    // Return existing terminal if already created (prevents duplicate PTY on session restore)
    if (this.terminals.has(id)) {
      return id;
    }

    const shell = this.getDefaultShell();
    
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: process.env as { [key: string]: string },
    });

    const instance: TerminalInstance = {
      id,
      pty: ptyProcess,
      cwd,
    };

    this.terminals.set(id, instance);
    return id;
  }

  write(id: string, data: string): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.pty.write(data);
    }
  }

  resize(id: string, cols: number, rows: number): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.pty.resize(cols, rows);
    }
  }

  kill(id: string): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.pty.kill();
      this.terminals.delete(id);
    }
  }

  onData(id: string, callback: (data: string) => void): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.pty.onData(callback);
    }
  }

  onExit(id: string, callback: (exitCode: number) => void): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.pty.onExit(({ exitCode }) => {
        callback(exitCode);
        this.terminals.delete(id);
      });
    }
  }

  getTerminal(id: string): TerminalInstance | undefined {
    return this.terminals.get(id);
  }

  getAllTerminals(): string[] {
    return Array.from(this.terminals.keys());
  }
}

export const terminalService = new TerminalService();
