import { app } from 'electron';
import * as path from 'path';

export function getUserDataDir(): string {
  return app.getPath('userData');
}

export function getStateDir(): string {
  return path.join(getUserDataDir(), 'state');
}

export function getConversationsDir(): string {
  return path.join(getStateDir(), 'conversations');
}

export function getSessionPath(): string {
  return path.join(getStateDir(), 'session.json');
}

export function getLogsDir(): string {
  return path.join(getUserDataDir(), 'logs');
}

export function getCopilotChatLogPath(): string {
  return path.join(getLogsDir(), 'copilot-chat.log');
}

export function getCopilotLogsDir(): string {
  return path.join(getUserDataDir(), 'copilot', 'logs');
}

export function getCopilotBootstrapDir(): string {
  return path.join(getUserDataDir(), 'copilot');
}

export function getCopilotLocalNodeModulesDir(): string {
  return path.join(getCopilotBootstrapDir(), 'node_modules');
}

export function getBundledNodeRoot(): string | null {
  const override = process.env.CMUX_NODE_RUNTIME_DIR;
  if (override) return override;
  if (!app.isPackaged) return null;
  return path.join(process.resourcesPath, 'node');
}
