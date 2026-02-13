import { app } from 'electron';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getBundledNodeRoot, getCopilotBootstrapDir, getCopilotLocalNodeModulesDir } from './AppPaths';
import { createLogger } from './Logger';

const log = createLogger('CopilotBootstrap');
let bootstrapPromise: Promise<void> | null = null;
const isWindows = process.platform === 'win32';

export function getLocalCopilotNodeModulesDir(): string {
  return getCopilotLocalNodeModulesDir();
}

function getBundledNodePath(): string | null {
  const root = getBundledNodeRoot();
  if (!root) return null;
  return isWindows
    ? path.join(root, 'node.exe')
    : path.join(root, 'bin', 'node');
}

function getBundledNpmCliPath(): string | null {
  const root = getBundledNodeRoot();
  if (!root) return null;
  return isWindows
    ? path.join(root, 'node_modules', 'npm', 'bin', 'npm-cli.js')
    : path.join(root, 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js');
}

export function getLocalCopilotCliPath(): string | null {
  const modulesDir = getLocalCopilotNodeModulesDir();
  const nestedCli = path.join(
    modulesDir,
    '@github',
    'copilot-sdk',
    'node_modules',
    '@github',
    'copilot',
    'npm-loader.js',
  );
  if (fs.existsSync(nestedCli)) return nestedCli;

  const flatCli = path.join(modulesDir, '@github', 'copilot', 'npm-loader.js');
  if (fs.existsSync(flatCli)) return flatCli;

  return null;
}

export function isLocalCopilotInstallReady(): boolean {
  const sdkPackage = path.join(
    getLocalCopilotNodeModulesDir(),
    '@github',
    'copilot-sdk',
    'package.json',
  );
  return fs.existsSync(sdkPackage) && Boolean(getLocalCopilotCliPath());
}

async function runNpmInstall(): Promise<void> {
  const nodePath = getBundledNodePath();
  const npmCliPath = getBundledNpmCliPath();
  if (!nodePath || !npmCliPath) {
    throw new Error('Bundled Node runtime not found. Please reinstall cmux.');
  }

  const prefixDir = getCopilotBootstrapDir();
  const cacheDir = path.join(prefixDir, '.npm-cache');
  fs.mkdirSync(prefixDir, { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const child = spawn(nodePath, [
      npmCliPath,
      'install',
      '--no-fund',
      '--no-audit',
      '--loglevel=warn',
      '--prefix',
      prefixDir,
      '@github/copilot-sdk',
    ], {
      env: {
        ...process.env,
        npm_config_prefix: prefixDir,
        npm_config_cache: cacheDir,
        npm_config_update_notifier: 'false',
      },
    });

    child.stdout.on('data', (data) => {
      log.info(data.toString().trim());
    });
    child.stderr.on('data', (data) => {
      log.warn(data.toString().trim());
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install exited with code ${code}`));
    });
  });
}

function ensureCopilotShim(): void {
  const cliPath = getLocalCopilotCliPath();
  const nodePath = getBundledNodePath();
  if (!cliPath || !nodePath) return;
  if (!fs.existsSync(cliPath) || !fs.existsSync(nodePath)) return;

  const shimPath = path.join(getCopilotBootstrapDir(), isWindows ? 'copilot.cmd' : 'copilot');
  const shimContent = isWindows
    ? `@echo off\r\n"${nodePath}" "${cliPath}" %*\r\n`
    : `#!/bin/sh\n"${nodePath}" "${cliPath}" "$@"\n`;
  const existing = fs.existsSync(shimPath) ? fs.readFileSync(shimPath, 'utf-8') : null;
  if (existing === shimContent) return;

  fs.mkdirSync(getCopilotBootstrapDir(), { recursive: true });
  fs.writeFileSync(shimPath, shimContent, { encoding: 'utf-8' });
  if (!isWindows) {
    fs.chmodSync(shimPath, 0o755);
  }
}

export async function ensureCopilotInstalled(): Promise<void> {
  if (!app.isPackaged) {
    return;
  }

  if (isLocalCopilotInstallReady()) {
    ensureCopilotShim();
    return;
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    log.info('Installing GitHub Copilot runtime...');
    await runNpmInstall();
    if (!isLocalCopilotInstallReady()) {
      throw new Error('Copilot runtime installation did not complete.');
    }
    ensureCopilotShim();
  })();

  try {
    await bootstrapPromise;
  } catch (error) {
    log.error('Install failed:', error);
    throw error;
  } finally {
    bootstrapPromise = null;
  }
}
