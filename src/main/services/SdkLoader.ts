// Shared SDK loader — singleton CopilotClient for use by CopilotService and AgentSessionService.
// Uses dynamic import workaround for ESM-only @github/copilot-sdk in CJS Electron main process.

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

type CopilotClientType = import('@github/copilot-sdk').CopilotClient;

let sdkModule: typeof import('@github/copilot-sdk') | null = null;
let clientInstance: CopilotClientType | null = null;
let startPromise: Promise<CopilotClientType> | null = null;

export async function loadSdk(): Promise<typeof import('@github/copilot-sdk')> {
  if (!sdkModule) {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    sdkModule = await (new Function('return import("@github/copilot-sdk")')() as Promise<typeof import('@github/copilot-sdk')>);
  }
  return sdkModule;
}

export async function getSharedClient(): Promise<CopilotClientType> {
  if (clientInstance) return clientInstance;

  // Prevent concurrent start() calls
  if (startPromise) return startPromise;

  startPromise = (async () => {
    const { CopilotClient } = await loadSdk();
    const logDir = path.join(os.homedir(), '.copilot', 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    clientInstance = new CopilotClient({
      logLevel: 'all',
      cliArgs: ['--log-dir', logDir],
    });
    await clientInstance.start();
    return clientInstance;
  })();

  const client = await startPromise;
  startPromise = null;
  return client;
}

export async function stopSharedClient(): Promise<void> {
  if (clientInstance) {
    await clientInstance.stop().catch(() => {});
    clientInstance = null;
  }
}
