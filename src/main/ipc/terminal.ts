import { ipcMain, BrowserWindow } from 'electron';
import { terminalService } from '../services/TerminalService';
import { fileService } from '../services/FileService';

export function setupTerminalIPC(mainWindow: BrowserWindow): void {
  // Create a new terminal
  ipcMain.handle('terminal:create', (_event, id: string, cwd: string) => {
    terminalService.create(id, cwd);
    
    // Register cwd as allowed root for file access
    fileService.addAllowedRoot(cwd);
    
    // Set up data handler to send output to renderer
    terminalService.onData(id, (data) => {
      mainWindow.webContents.send('terminal:data', id, data);
    });

    // Set up exit handler
    terminalService.onExit(id, (exitCode) => {
      mainWindow.webContents.send('terminal:exit', id, exitCode);
    });

    return id;
  });

  // Write to terminal
  ipcMain.handle('terminal:write', (_event, id: string, data: string) => {
    terminalService.write(id, data);
  });

  // Resize terminal
  ipcMain.handle('terminal:resize', (_event, id: string, cols: number, rows: number) => {
    terminalService.resize(id, cols, rows);
  });

  // Kill terminal
  ipcMain.handle('terminal:kill', (_event, id: string) => {
    terminalService.kill(id);
  });
}
