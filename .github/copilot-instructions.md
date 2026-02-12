# Copilot Instructions for cmux

## Build, Test, and Lint

```bash
npm start                # Dev mode with hot reload (electron-forge)
npm test                 # Run all Jest tests
npm run lint             # ESLint (TypeScript)
npm run test:e2e         # Packages app then runs Playwright e2e tests

# Single test file
npx jest --testPathPattern="LeftPane" --no-coverage

# Watch mode
npx jest --watch
```

## Architecture

cmux is an Electron app (electron-forge + webpack) with a three-pane layout for managing multiple repository workspaces and AI agents.

### Process Boundary

- **Main process** (`src/main/`): Services and IPC handlers. Services are singleton classes (e.g., `AgentService`, `CopilotService`, `FileService`). IPC handlers in `src/main/ipc/` wire `ipcMain.handle()` to services and forward events to the renderer via `mainWindow.webContents.send()`.
- **Renderer** (`src/renderer/`): React app using `useReducer` for state (no Redux). State is split across two reducers (`agentReducer`, `conversationReducer`) composed in `AppStateContext`. Custom hooks in `src/renderer/hooks/` encapsulate side effects (streaming, file watching, session restore, etc.).
- **Preload** (`src/preload.ts`): Defines the full `ElectronAPI` interface exposed via `contextBridge`. This is the contract between main and renderer — all IPC goes through `window.electronAPI`.
- **Shared** (`src/shared/types.ts`): All types used across processes live here, including `AppState`, `AppAction` (discriminated union), and agent event types.

### IPC Pattern

IPC channels follow the `domain:action` convention (e.g., `agent:create`, `copilot:send`, `fs:readDirectory`). The `createIpcListener` helper wraps `ipcRenderer.on()` and returns an unsubscribe function for cleanup.

### Copilot SDK Integration

The `@github/copilot-sdk` is ESM-only and loaded at runtime from the global npm install (not bundled). `SdkLoader.ts` handles finding the SDK across different Node version managers (nvm, volta, fnm) and platforms. A shared `CopilotClient` singleton is used by both `CopilotService` (chat) and `AgentSessionService` (autonomous agents).

### Native Modules

`@homebridge/node-pty-prebuilt-multiarch` (terminal PTY) is excluded from webpack bundling via `externals` and handled by `ForgeExternalsPlugin` for packaging.

## Key Conventions

- **Domain glossary**: Use consistent terminology from `docs/glossary.md` — Workspace (PTY terminal), Agent (AI session), Navigator (left pane), Main View (center), Explorer (right pane).
- **React**: Functional components with hooks only. Extract complex logic into custom hooks in `src/renderer/hooks/`.
- **State management**: All state flows through `AppStateContext` via `dispatch(action)`. Actions are defined as a discriminated union (`AppAction`) in `src/shared/types.ts`.
- **Test AppState**: When constructing `AppState` in tests, include all required fields: `viewMode`, `chatMessages`, `chatLoading`, `conversations`, `activeConversationId`, `availableModels`, `selectedModel`, `agentEvents`, `agentNotes`.
- **Test setup**: `src/test/setupTests.ts` provides a minimal `window.electronAPI` mock. Tests that need specific API methods must extend this mock in their own setup.
- **CSS modules**: Stylesheets are mocked via `identity-obj-proxy` in tests.
