import { app } from 'electron';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getBundledNodeRoot, getCopilotBootstrapDir, getCopilotLocalNodeModulesDir } from './AppPaths';
let bootstrapPromise: Promise<void> | null = null;

export function getLocalCopilotNodeModulesDir(): string {
  return getCopilotLocalNodeModulesDir();
}

function getBundledNodePath(): string | null {
  const root = getBundledNodeRoot();
  if (!root) return null;
  return process.platform === 'win32'
    ? path.join(root, 'node.exe')
    : path.join(root, 'bin', 'node');
}

function getBundledNpmCliPath(): string | null {
  const root = getBundledNodeRoot();
  if (!root) return null;
  return process.platform === 'win32'
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
      console.log(`[CopilotBootstrap] ${data.toString().trim()}`);
    });
    child.stderr.on('data', (data) => {
      console.warn(`[CopilotBootstrap] ${data.toString().trim()}`);
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install exited with code ${code}`));
    });
  });
}

export async function ensureCopilotInstalled(): Promise<void> {
  if (!app.isPackaged) {
    return;
  }

  if (isLocalCopilotInstallReady()) {
    return;
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    console.log('[CopilotBootstrap] Installing GitHub Copilot runtime...');
    await runNpmInstall();
    if (!isLocalCopilotInstallReady()) {
      throw new Error('Copilot runtime installation did not complete.');
    }
  })();

  try {
    await bootstrapPromise;
  } catch (error) {
    console.error('[CopilotBootstrap] Install failed:', error);
    throw error;
  } finally {
    bootstrapPromise = null;
  }
}
