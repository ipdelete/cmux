import { ipcMain, BrowserWindow } from 'electron';
import { agentSessionService } from '../services/AgentSessionService';
import { unregisterAgent } from '../services/OrchestratorTools';

export function setupAgentSessionIPC(mainWindow: BrowserWindow): void {
  // Route agent session events to renderer
  agentSessionService.onEvent((agentId, event) => {
    mainWindow.webContents.send('agent-session:event', agentId, event);
  });

  // Permissions are auto-approved in AgentSessionService (default fallback).
  // A UI-based permission flow can be added later.

  ipcMain.handle('agent-session:create', async (_event, agentId: string, cwd: string, model?: string) => {
    await agentSessionService.createSession(agentId, cwd, model);
  });

  ipcMain.handle('agent-session:send', async (_event, agentId: string, prompt: string) => {
    await agentSessionService.sendPrompt(agentId, prompt);
  });

  ipcMain.handle('agent-session:stop', async (_event, agentId: string) => {
    await agentSessionService.stopAgent(agentId);
  });

  ipcMain.handle('agent-session:destroy', async (_event, agentId: string) => {
    await agentSessionService.destroySession(agentId);
    unregisterAgent(agentId);
  });
}
