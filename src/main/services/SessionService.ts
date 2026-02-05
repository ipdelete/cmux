import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const SESSION_FILE = 'session.json';
const SESSION_VERSION = 1;

export interface SessionTerminal {
  id: string;
  label: string;
  cwd: string;
  openFiles: SessionFile[];
}

export interface SessionFile {
  id: string;
  path: string;
  name: string;
  parentTerminalId: string;
}

export interface SessionData {
  version: number;
  terminals: SessionTerminal[];
  activeItemId: string | null;
  activeTerminalId: string | null;
}

class SessionService {
  private getSessionPath(): string {
    return path.join(app.getPath('userData'), SESSION_FILE);
  }

  save(data: Omit<SessionData, 'version'>): void {
    const sessionData: SessionData = {
      version: SESSION_VERSION,
      ...data,
    };

    try {
      const sessionPath = this.getSessionPath();
      fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  load(): SessionData | null {
    try {
      const sessionPath = this.getSessionPath();
      
      if (!fs.existsSync(sessionPath)) {
        return null;
      }

      const content = fs.readFileSync(sessionPath, 'utf-8');
      const data = JSON.parse(content) as SessionData;

      // Validate version
      if (data.version !== SESSION_VERSION) {
        console.warn('Session version mismatch, starting fresh');
        return null;
      }

      // Validate structure
      if (!Array.isArray(data.terminals)) {
        return null;
      }

      // Filter out terminals with non-existent directories
      data.terminals = data.terminals.filter(terminal => {
        if (!fs.existsSync(terminal.cwd)) {
          console.warn(`Terminal directory no longer exists: ${terminal.cwd}`);
          return false;
        }
        return true;
      });

      // Filter out non-existent files from each terminal
      data.terminals = data.terminals.map(terminal => ({
        ...terminal,
        openFiles: terminal.openFiles.filter(file => {
          if (!fs.existsSync(file.path)) {
            console.warn(`File no longer exists: ${file.path}`);
            return false;
          }
          return true;
        }),
      }));

      // Fix activeTerminalId if it points to a removed terminal
      if (data.activeTerminalId && !data.terminals.find(t => t.id === data.activeTerminalId)) {
        data.activeTerminalId = data.terminals[0]?.id ?? null;
      }

      // Fix activeItemId if it points to a removed item
      if (data.activeItemId) {
        const isValidTerminal = data.terminals.some(t => t.id === data.activeItemId);
        const isValidFile = data.terminals.some(t => 
          t.openFiles.some(f => f.id === data.activeItemId)
        );
        if (!isValidTerminal && !isValidFile) {
          data.activeItemId = data.activeTerminalId;
        }
      }

      return data;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }
}

export const sessionService = new SessionService();
