# Code Review: Dead Code & Spaghetti Code

**Date:** 2026-02-08
**Scope:** Full codebase review of `src/`, config files, and `package.json`

---

## Executive Summary

The codebase is generally well-structured with clear separation between main process, renderer, and shared types. However, there are **duplicate type definitions across 3 layers**, a **248-line reducer function**, several **unused methods and imports**, and **god components** that mix too many responsibilities. The biggest wins come from consolidating types, breaking up large functions, and removing dead code.

| Severity | Count |
|----------|-------|
| High     | 7     |
| Medium   | 15    |
| Low      | 10    |

---

## High Severity

### H1. Duplicate Type Definitions Across 3 Layers

Types are defined independently in `src/shared/types.ts`, service files, and `src/preload.ts` instead of having a single source of truth.

**`FileWatchEvent`** defined identically in 3 places:
- `src/shared/types.ts:154`
- `src/main/services/FileWatcherService.ts:5`
- `src/preload.ts:10`

**`GitFileStatus` / `GitStatusMap`** defined identically in 3 places:
- `src/shared/types.ts:233-234`
- `src/main/services/GitService.ts:4-5`
- `src/preload.ts:17-18`

**`SessionData` / `SessionFile`** defined in 2 places:
- `src/shared/types.ts:176` (`SessionData`)
- `src/main/services/SessionService.ts:8-23` (`SessionAgent`, `SessionFile`, `SessionData`)

**Fix:** Delete duplicates. Import everything from `src/shared/types.ts`.

---

### H2. 248-Line Reducer in AppStateContext.tsx

`src/renderer/contexts/AppStateContext.tsx` — the `appReducer` function has 22 case branches in ~248 lines. Agent-filtering logic is duplicated between `REMOVE_AGENT` and `SET_ACTIVE_AGENT`. Several cases have 3-4 levels of nesting.

**Fix:** Split into focused sub-reducers (`agentReducer`, `conversationReducer`, `viewReducer`) composed together.

---

### H3. ChatView is a God Component

`src/renderer/components/CenterPane/ChatView.tsx` (260 lines) handles:
- Input state management
- Model selection with picker UI
- Chat message streaming via IPC
- Conversation CRUD
- localStorage persistence
- Auto-scroll behavior
- An `eslint-disable-line` suppressing a dependency array warning (line 53)

**Fix:** Extract custom hooks: `useChatInput`, `useModelPicker`, `useChatStreaming`, `useConversationManager`.

---

### H4. CopilotService.sendMessage() Does Too Many Things

`src/main/services/CopilotService.ts:90-149` — 60-line method that handles session management, abort controllers, event subscription/unsubscription, streaming response handling, error recovery, and 3 separate callbacks (`onChunk`, `onDone`, `onError`).

**Fix:** Break into `ensureSession()`, `subscribeToEvents()`, `handleResponse()`. Replace 3-callback pattern with an EventEmitter or async iterator.

---

### H5. SessionService.load() Has Deeply Nested Validation

`src/main/services/SessionService.ts:96-172` — multiple filtering passes over the same data: first agents, then openFiles within agents, then fixup of `activeAgentId`, then fixup of `activeItemId` with 5 levels of nesting.

**Fix:** Single-pass validation function that returns cleaned session data.

---

### H6. Unused Exports from types.ts

These types are exported but never imported anywhere:
- `AgentEventToolProgress` (line 33)
- `AgentEventToolPartialResult` (line 40)
- `AgentEventAssistantDelta` (line 54)
- `DownloadProgress` (line 218)
- `AgentEventPermissionRequest` (line 68)

**Fix:** Remove exports (or the types entirely if unused).

---

### H7. Unused `loadSdk` Import in CopilotService

`src/main/services/CopilotService.ts:5` — `loadSdk` is imported but never used. Only `getSharedClient` is called.

**Fix:** Remove the import.

---

## Medium Severity

### M1. Unused Methods in FileService

`src/main/services/FileService.ts` — three public methods are never called:
- `removeAllowedRoot()` (line 19)
- `clearAllowedRoots()` (line 24)
- `fileExists()` (line 82)

**Fix:** Delete them.

---

### M2. Unused `getGitStatusWithIgnored()` in GitService

`src/main/services/GitService.ts:166-184` — method defined but never called. Only `getGitStatus()` is used via IPC.

**Fix:** Delete it.

---

### M3. Repetitive IPC Listener Pattern in preload.ts

`src/preload.ts` — the same callback wrapper pattern (create handler, subscribe via `ipcRenderer.on`, return cleanup function) is copy-pasted 15+ times across `agent.onData`, `agent.onExit`, `fs.onDirectoryChanged`, `git.onStatusChanged`, and `updates.*`.

**Fix:** Extract a helper: `function createListener(channel, handler)`.

---

### M4. Global Mutable State in OrchestratorTools

`src/main/services/OrchestratorTools.ts:18-25` — module-level mutable variables (`onAgentCreated`, `managedAgents` Map) are mutated from tool handlers with no synchronization or cleanup.

**Fix:** Encapsulate in a class or pass via dependency injection.

---

### M5. Complex Event Merging in AgentActivityView

`src/renderer/components/CenterPane/AgentActivityView.tsx:35-117` — `buildDisplayEvents()` has nested switch statements, accumulates deltas via string concatenation, tracks tool calls in a Map, and merges start/complete events across iterations.

**Fix:** Break into helper functions (`mergeToolEvents`, `accumulateDeltas`, `flushPendingMessage`).

---

### M6. Prop Drilling in FileTreeNode (8 Props, Recursive)

`src/renderer/components/RightPane/FileTreeNode.tsx:36-44` — component takes 8 props and passes all 8 to recursive children (lines 125-135): `entry`, `level`, `onFileClick`, `onDirectoryToggle`, `expandedDirs`, `loadChildren`, `getChildren`, `gitStatusMap`.

**Fix:** Create a `FileTreeContext` to provide callbacks and state, reducing props to `entry` and `level`.

---

### M7. Mixed Concerns in FileTree Component

`src/renderer/components/RightPane/FileTree.tsx` — three separate `useEffect` hooks (lines 56-72, 112-135, 137-165) handle directory loading, file watching, and git status watching respectively.

**Fix:** Extract to `useDirectoryLoader`, `useFileWatcher`, `useGitStatusWatcher` hooks.

---

### M8. Conditional Rendering Overuse in RightPane

`src/renderer/components/RightPane/RightPane.tsx:125-225` — renders completely different JSX trees based on `state.viewMode`, with a third branch for "no active agent". This makes the component hard to follow.

**Fix:** Split into `RightPaneChatMode` and `RightPaneAgentMode` sub-components.

---

### M9. App.tsx Session Restoration is Monolithic

`src/renderer/App.tsx:103-189` — session restoration logic has 5 levels of nesting with multiple `useEffect` hooks registering IPC listeners interleaved with auto-update listeners (lines 22-48).

**Fix:** Extract `useSessionRestore()` and `useAutoUpdater()` custom hooks.

---

### M10. Context Menu Logic Duplicated

Context menu state and handlers are independently implemented in both:
- `src/renderer/components/LeftPane/LeftPane.tsx` (lines 13-88)
- `src/renderer/components/RightPane/RightPane.tsx` (lines 11-63)

**Fix:** Extract a `useContextMenu()` hook.

---

### M11. Blocking I/O in ConversationService.list()

`src/main/services/ConversationService.ts:18-48` — uses `fs.readdirSync` and `fs.readFileSync` in a loop, blocking the main Electron thread.

**Fix:** Convert to `fs.promises.readdir` / `fs.promises.readFile` with `Promise.all`.

---

### M12. SdkLoader Has an Implicit State Machine

`src/main/services/SdkLoader.ts:16-20` — four module-level variables (`sdkModule`, `clientInstance`, `startPromise`, `cachedPrefix`) form an undocumented state machine. Error handling resets `clientInstance` but the valid state transitions are unclear.

**Fix:** Document the state machine or encapsulate in a class with explicit states.

---

### M13. Duplicate ForkTsCheckerWebpackPlugin in webpack.plugins.ts

`webpack.plugins.ts:8-22` — `ForkTsCheckerWebpackPlugin` is instantiated twice with identical config (once for `plugins`, once for `rendererPlugins`).

**Fix:** Create one instance and reuse it.

---

### M14. Nested Ternary in forge.config.ts

`forge.config.ts:28-42` — macOS signing/notarization config uses nested ternary spread operators that are hard to parse.

**Fix:** Build the config object with `if` statements before the export.

---

### M15. Unused `MakerRpm` Import in forge.config.ts

`forge.config.ts:5` — imported but intentionally disabled (comment says ARM binary issue). The import is still dead code.

**Fix:** Remove the import; add a comment explaining RPM is not supported.

---

## Low Severity

### L1. Unused `_event` Parameter Across All IPC Handlers

`src/main/ipc/agent.ts:10,39,44,49` and other IPC files — underscore-prefixed event parameter passed to every handler but never used.

Not a functional issue but adds visual noise.

---

### L2. Silent Error Swallowing on App Quit

`src/index.ts:100-102`:
```typescript
getCopilotService().stop().catch(() => {});
agentSessionService.destroyAll().catch(() => {});
stopSharedClient().catch(() => {});
```

Errors during shutdown are silently discarded.

**Fix:** Log errors: `.catch(e => console.error('shutdown error:', e))`.

---

### L3. Unused `path` Import in UpdateService

`src/main/services/UpdateService.ts:3` — `path` is imported but never used.

---

### L4. Unused Type Imports in AgentActivityView

`src/renderer/components/CenterPane/AgentActivityView.tsx:7-8` — `AgentEventToolStart` and `AgentEventToolComplete` are imported but only used via `event.kind` string matching, not as type annotations.

---

### L5. Unused `getWatchedDirectories()` in FileWatcherService

`src/main/services/FileWatcherService.ts:120-122` — defined but never called.

---

### L6. `receivedChunks` Flag Logic in CopilotService

`src/main/services/CopilotService.ts:105` — boolean flag set to `true` on delta receipt (line 118) but the conditional that reads it (line 136) has confusing semantics. The intent (handle case where streaming produced no chunks) is unclear from the code.

---

### L7. `shell: true` in GitService.execGit()

`src/main/services/GitService.ts:11-42` — uses `spawn()` with `shell: true`. This is unnecessary for `git` commands and marginally less secure than spawning `git` directly.

---

### L8. Unused Default Exports in Several Components

These files export both named and default, but only the named export is used:
- `src/renderer/components/CenterPane/FileView.tsx`
- `src/renderer/components/RightPane/FileTree.tsx`
- `src/renderer/components/RightPane/FileTreeNode.tsx`
- `src/renderer/components/Icon.tsx`

---

### L9. Unused Test Imports

Several test files have unused imports:
- `AgentService.test.ts:1` — `os` module
- `FileService.test.ts:14` — `FileEntry` type
- `GitService.test.ts:9` — `GitStatusMap` type
- `SessionService.test.ts:3` — duplicate `SessionService` import

---

### L10. `allowJs: true` in tsconfig.json with No JS Files

`tsconfig.json` enables `allowJs` but the `src/` directory contains only `.ts` and `.tsx` files.

---

## Refactoring Priority

| Priority | Action | Impact |
|----------|--------|--------|
| 1 | Delete duplicate type definitions (H1) | Eliminates 3 maintenance hazards |
| 2 | Delete unused methods and imports (M1, M2, H6, H7, L3-L5) | ~80 lines of dead code removed |
| 3 | Break up AppStateContext reducer (H2) | Most-edited file becomes maintainable |
| 4 | Extract ChatView into hooks (H3) | Largest component becomes testable |
| 5 | Extract preload.ts listener helper (M3) | ~60 lines of repetition eliminated |
| 6 | Break up CopilotService.sendMessage (H4) | Core service becomes testable |
| 7 | Extract renderer custom hooks (M7, M9, M10) | Cleaner component boundaries |
| 8 | Convert ConversationService to async (M11) | Unblocks main thread |
