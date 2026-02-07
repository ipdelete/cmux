import { ipcMain, BrowserWindow } from 'electron';
import { CopilotService } from '../services/CopilotService';

const copilotService = new CopilotService();

export function setupCopilotIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('copilot:send', async (_event, message: string, messageId: string) => {
    await copilotService.sendMessage(
      message,
      messageId,
      (msgId, content) => {
        mainWindow.webContents.send('copilot:chunk', msgId, content);
      },
      (msgId) => {
        mainWindow.webContents.send('copilot:done', msgId);
      },
      (msgId, error) => {
        mainWindow.webContents.send('copilot:error', msgId, error);
      },
    );
  });
}

export function getCopilotService(): CopilotService {
  return copilotService;
}
