// Shared SDK loader — singleton CopilotClient for use by CopilotService and AgentSessionService.
// Loads @github/copilot-sdk from the global npm install rather than bundling it,
// since the SDK is ESM-only and spawns @github/copilot as a child process —
// both need to live on the real filesystem, not inside asar.

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';

type CopilotClientType = import('@github/copilot-sdk').CopilotClient;

const isWindows = process.platform === 'win32';

let sdkModule: typeof import('@github/copilot-sdk') | null = null;
let clientInstance: CopilotClientType | null = null;
let startPromise: Promise<CopilotClientType> | null = null;

let cachedPrefix: string | null = null;

function getNpmGlobalPrefix(): string {
  if (cachedPrefix) return cachedPrefix;

  // 1. Fast path: check env var (set when running under npm)
  if (process.env.npm_config_prefix) {
    const envPrefix = process.env.npm_config_prefix;
    if (fs.existsSync(envPrefix)) {
      cachedPrefix = envPrefix;
      return cachedPrefix;
    }
  }

  // 2. Shell out to npm (works on every OS)
  try {
    cachedPrefix = execSync('npm prefix -g', { encoding: 'utf-8' }).trim();
    return cachedPrefix;
  } catch {
    throw new Error(
      'Could not determine npm global prefix. Is npm installed?'
    );
  }
}

function getGlobalNodeModules(): string {
  const prefix = getNpmGlobalPrefix();
  // Windows: {prefix}/node_modules — Unix: {prefix}/lib/node_modules
  const modulesDir = isWindows
    ? path.join(prefix, 'node_modules')
    : path.join(prefix, 'lib', 'node_modules');

  if (!fs.existsSync(path.join(modulesDir, '@github', 'copilot-sdk', 'package.json'))) {
    throw new Error(
      '@github/copilot-sdk is not installed globally. Run: npm install -g @github/copilot-sdk'
    );
  }
  return modulesDir;
}

function getCopilotCliPath(): string {
  // The SDK spawns the CLI via child_process.spawn(). When cliPath ends with .js,
  // the SDK spawns `node <path>`. On Windows, .cmd files can't be spawned directly
  // without shell:true, so we return the .js entry point instead.
  const globalModules = getGlobalNodeModules();

  // Path to the CLI's JS entry point (works cross-platform via SDK's node detection)
  const jsEntry = path.join(globalModules, '@github', 'copilot-sdk', 'node_modules', '@github', 'copilot', 'npm-loader.js');
  if (fs.existsSync(jsEntry)) {
    return jsEntry;
  }

  // Fallback: check if CLI is hoisted to global bin (older npm behavior)
  const prefix = getNpmGlobalPrefix();
  const hoistedJs = isWindows
    ? null  // Windows global doesn't use symlinks to .js
    : path.join(prefix, 'lib', 'node_modules', '@github', 'copilot', 'npm-loader.js');

  if (hoistedJs && fs.existsSync(hoistedJs)) {
    return hoistedJs;
  }

  throw new Error(
    '@github/copilot CLI not found. Run: npm install -g @github/copilot-sdk'
  );
}

export async function loadSdk(): Promise<typeof import('@github/copilot-sdk')> {
  if (!sdkModule) {
    const globalModules = getGlobalNodeModules();
    const sdkEntry = path.join(globalModules, '@github', 'copilot-sdk', 'dist', 'index.js');
    // Use new Function to hide import() from webpack's static analysis,
    // but point it at the real filesystem path via pathToFileURL
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    sdkModule = await (new Function('url', 'return import(url)')(pathToFileURL(sdkEntry).href) as Promise<typeof import('@github/copilot-sdk')>);
  }
  return sdkModule;
}

export async function getSharedClient(): Promise<CopilotClientType> {
  if (clientInstance) return clientInstance;

  // Prevent concurrent start() calls
  if (startPromise) return startPromise;

  startPromise = (async () => {
    const { CopilotClient } = await loadSdk();
    const cliPath = getCopilotCliPath();
    const logDir = path.join(os.homedir(), '.copilot', 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    clientInstance = new CopilotClient({
      cliPath,
      logLevel: 'all',
      cliArgs: ['--log-dir', logDir],
    });
    await clientInstance.start();
    return clientInstance;
  })();

  try {
    const client = await startPromise;
    return client;
  } catch (err) {
    // Reset state so next call retries instead of returning broken client
    clientInstance = null;
    throw err;
  } finally {
    startPromise = null;
  }
}

export async function stopSharedClient(): Promise<void> {
  if (clientInstance) {
    await clientInstance.stop().catch(() => {});
    clientInstance = null;
  }
}
