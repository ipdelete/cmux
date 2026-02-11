# SdkLoader: Loading the Copilot SDK in Electron

## The Problem

`@github/copilot-sdk` is **ESM-only** and spawns `@github/copilot` CLI as a child process. This creates two challenges in Electron:

1. **Asar incompatibility** — both the SDK and CLI must live on the real filesystem, not inside Electron's asar archive. They can't be bundled by webpack.
2. **Missing PATH in packaged apps** — GUI-launched Electron apps inherit a minimal system PATH that excludes `/usr/local/bin`, nvm, volta, fnm, and other Node version managers. `npm` isn't on PATH, so the globally-installed SDK can't be located via `npm prefix -g`.

## Architecture

```
SdkLoader (singleton)
  │
  ├── getNpmGlobalPrefix()     → 4-tier resolution to find npm global install
  ├── getGlobalNodeModules()   → maps prefix → node_modules dir (OS-aware)
  ├── getCopilotCliPath()      → finds @github/copilot JS entry point
  ├── loadSdk()                → ESM dynamic import of @github/copilot-sdk
  └── getSharedClient()        → singleton CopilotClient shared by all services
```

## npm Global Prefix Resolution (4 tiers)

`getNpmGlobalPrefix()` tries four strategies in order, caching the first success:

### Tier 1: `npm_config_prefix` env var
Fast path — set automatically when running under `npm start`. Works in dev, not in packaged app.

### Tier 2: `npm prefix -g`
Shells out to npm with the current process PATH. Works in dev when npm is on PATH. Fails in packaged Electron where PATH is minimal.

### Tier 3: User's login shell PATH
Spawns the user's actual shell (`zsh -ilc "echo $PATH"` or equivalent) to get the real PATH including nvm/volta/fnm paths, then retries `npm prefix -g` with that PATH. Solves the macOS GUI-launch problem.

### Tier 4: Well-known prefix probing
Hardcoded fallback locations, directly checking for `@github/copilot-sdk/package.json`:

| Platform | Locations checked |
|----------|-------------------|
| **Windows** | User `~/.npmrc` prefix, Node.js builtin npmrc prefix, `%APPDATA%/npm` |
| **macOS** | `/usr/local` (Intel Homebrew), `/opt/homebrew` (Apple Silicon) |
| **Linux** | `/usr` |
| **nvm** | `~/.nvm/versions/node/*/` (newest first) |
| **volta** | `~/.volta/tools/image/node/*/` (newest first) |
| **fnm** | `~/.local/share/fnm/node-versions/*/installation/` (newest first) |

## ESM Dynamic Import

Webpack's static analysis would try to bundle any `import()` call. The SDK is ESM-only and must load from the global install at runtime. The workaround:

```typescript
// new Function hides import() from webpack, pathToFileURL ensures valid ESM URL
const sdkModule = await (
  new Function('url', 'return import(url)')(pathToFileURL(sdkEntry).href)
);
```

## Windows CLI Path Resolution

The SDK spawns the CLI via `child_process.spawn()`. On Windows, npm installs `.cmd` shims which can't be spawned without `shell: true`. Instead, `getCopilotCliPath()` resolves the `.js` entry point directly (`npm-loader.js`), which the SDK spawns as `node <path>`.

The CLI may be nested under the SDK's own `node_modules` (npm's default for scoped packages):
```
{globalModules}/@github/copilot-sdk/node_modules/@github/copilot/npm-loader.js
```

## Singleton Client

`getSharedClient()` maintains a single `CopilotClient` instance shared between:
- **CopilotService** — chat orchestrator sessions
- **AgentSessionService** — per-agent coding sessions

Concurrent-start protection via a `startPromise` guard prevents multiple `client.start()` calls racing. On failure, state is reset so the next call retries cleanly.

## Key File

`src/main/services/SdkLoader.ts`

## Evolution

| Commit | Fix |
|--------|-----|
| `b021553` | Initial: load SDK from global npm install |
| `619c45d` | ESM dynamic import workaround for webpack |
| `f7cf550` | OS-agnostic npm prefix (Windows vs Unix paths) |
| `bdde14e` | Windows nested npm install CLI path |
| `ce347ac` | Packaged Electron prefix resolution (shell PATH + well-known probes) |
| `b1f3531` | Windows `.npmrc` prefix detection |
