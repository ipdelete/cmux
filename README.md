# cmux

> *One window. Multiple repos. AI agents that do the work.*

[![CI](https://github.com/ipdelete/cmux/workflows/CI/badge.svg)](https://github.com/ipdelete/cmux/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/github/package-json/v/ipdelete/cmux)](https://github.com/ipdelete/cmux/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/ipdelete/cmux/releases)

A modern Electron-based workspace and agent manager for working across multiple repositories simultaneously. Features a three-pane layout with integrated file browsing, Copilot Chat, and AI-powered agents.

![Workspace Overview](img/agent-screenshot.png)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Development](#development)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Features

### 🖥️ Multi-Workspace Management
- Open multiple workspaces, each scoped to a different directory/repository
- Full PTY support via node-pty — TUI apps like `vim`, `htop`, and GitHub Copilot CLI work perfectly
- Workspace state preserved when switching between views
- Quick switching between workspaces via the Navigator
- Session restore — workspaces, open files, and notes persist across restarts

### 🤖 Chat-Driven Agents
- Create agents from Copilot Chat: "Create an agent for ~/src/my-project"
- Agents appear in the Navigator with a copilot icon and live status dot
- **Activity feed** — card-based UI showing tool calls, file reads, edits, and results
- Agent work is scoped to a local repo folder via `workingDirectory`
- Send follow-up tasks: "Now run the tests and fix anything that breaks"
- Manage multiple agents simultaneously across different repositories

### 💬 Copilot Chat
- Integrated GitHub Copilot chat powered by `@github/copilot-sdk`
- Multiple conversations with automatic naming from first message
- Streamed responses displayed in real-time
- Conversations persisted to disk and restored on restart
- Manage conversations in the right pane — create, switch, rename, and delete
- Each conversation gets its own isolated AI context

![Copilot Chat](img/agent-chat.png)

### 📁 Integrated File Browser
- File tree in the Explorer showing the current workspace's working directory
- Expandable folders with lazy loading
- Click files to view them with syntax highlighting

### ✨ Monaco Editor Integration
- View files with full syntax highlighting powered by Monaco Editor (VS Code's editor)
- Support for TypeScript, JavaScript, JSON, Markdown, CSS, HTML, Python, YAML, and more
- Line numbers and minimap navigation

![File View](img/agent-file-screenshot.png)

### 🔀 Git Integration
- Worktree detection — workspaces in git worktrees show a badge in the Navigator
- File-level git status (modified, staged, untracked) reflected in the Explorer
- Automatic status refresh when files change on disk

### 📝 Scratch Pad
- Per-workspace notepad for jotting down notes, commands, or context
- Toggle with `Ctrl+J`
- Notes persist across sessions

### 🎨 Three-Pane Layout
- **Navigator** (left): Workspaces, agents, and open files
- **Main View** (center): Active workspace terminal, agent activity feed, file viewer, or chat
- **Explorer / Conversations** (right): File tree or conversation list, depending on mode

### 🔄 Auto-Updates
- Automatic update checks on startup
- Background downloads with progress indicator
- Non-disruptive updates — install on next restart
- Toast notifications for update status

## Installation

### Prerequisites
- Node.js 18+
- npm 9+
- GitHub CLI (`gh`) authenticated via `gh auth login`
- Copilot CLI and SDK:

```bash
npm install -g @github/copilot @github/copilot-sdk
```

### Install from Releases

Download the latest release: https://github.com/ipdelete/cmux/releases

### Run from Source

```bash
git clone https://github.com/ipdelete/cmux.git
cd cmux
npm install
npm start
```

## Quick Start

```bash
# Install prerequisites
npm install -g @github/copilot @github/copilot-sdk
gh auth login

# Download from releases or run from source
npm start
```

1. Click **`+`** in the Navigator to create a workspace
2. Select a directory — a terminal opens scoped to that folder
3. Type `copilot` to start coding with AI, or use the terminal normally

## Usage

1. **Create a Workspace**: Click `+` in the Navigator and select a directory
2. **Run Commands**: Type in the terminal — we recommend `copilot`
3. **Browse Files**: Use the Explorer to navigate the file tree
4. **Open Files**: Click any file to view it with syntax highlighting in Main View
5. **Switch Views**: Click workspaces or files in the Navigator to switch between them
6. **Close Items**: Right-click on workspaces or files for context menu options
7. **Chat with Copilot**: Click "Copilot Chat" in the Navigator to start a conversation
8. **Manage Conversations**: Use the Conversations pane to create, switch, rename, or delete
9. **Create Agent from Chat**: Say "Create an agent for ~/src/my-project" — it creates an agent with a live activity feed
10. **Send Tasks to Agents**: Say "Review the code and summarize" — the agent works autonomously and reports back
11. **Take Notes**: Press `Ctrl+J` to open the Scratch Pad for the current workspace

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Next workspace | `Ctrl+Tab` |
| Previous workspace | `Ctrl+Shift+Tab` |
| New workspace | `Ctrl+Alt+\` |
| Close current workspace/file | `Ctrl+W` |
| Rename workspace | `F2` |
| Toggle Scratch Pad | `Ctrl+J` |
| Show keyboard shortcuts | `Ctrl+Shift+?` |

## Tech Stack

- **Electron** — Cross-platform desktop app framework
- **React 19** — UI framework
- **TypeScript** — Type-safe development
- **xterm.js** — Terminal emulator
- **node-pty** — Pseudo-terminal for full shell support
- **Monaco Editor** — Code editor with syntax highlighting
- **@github/copilot-sdk** — Copilot chat and agent integration
- **@vscode/codicons** — VS Code icon library
- **electron-updater** — Auto-update framework
- **Electron Forge** — Build and packaging toolchain

## Project Structure

```
src/
├── index.ts                    # Main process entry
├── preload.ts                  # Preload script (IPC bridge)
├── renderer.tsx                # Renderer entry
├── shared/
│   └── types.ts                # Shared TypeScript types
├── main/
│   ├── services/
│   │   ├── AgentService.ts         # PTY management (workspaces)
│   │   ├── AgentSessionService.ts  # SDK agent sessions & event mapping
│   │   ├── CopilotService.ts       # Copilot SDK chat integration
│   │   ├── ConversationService.ts  # Chat conversation persistence
│   │   ├── OrchestratorTools.ts    # Chat-to-agent tools
│   │   ├── SdkLoader.ts            # Shared CopilotClient singleton
│   │   ├── FileService.ts          # File system operations
│   │   ├── FileWatcherService.ts   # Directory change watching
│   │   ├── GitService.ts           # Git status & worktree detection
│   │   ├── SessionService.ts       # Session persist & restore
│   │   └── UpdateService.ts        # Auto-update management
│   └── ipc/
│       ├── agent.ts            # Workspace IPC handlers
│       ├── agent-session.ts    # SDK agent session IPC handlers
│       ├── copilot.ts          # Copilot chat IPC handlers
│       ├── conversation.ts     # Conversation CRUD IPC handlers
│       ├── files.ts            # File IPC handlers
│       ├── git.ts              # Git status IPC handlers
│       ├── session.ts          # Session save/restore IPC handlers
│       └── updates.ts          # Auto-update IPC handlers
└── renderer/
    ├── App.tsx                 # Main React component
    ├── contexts/               # State management & reducers
    ├── hooks/                  # Custom React hooks
    ├── components/
    │   ├── Layout/             # Three-pane layout
    │   ├── LeftPane/           # Navigator (workspaces, agents, files)
    │   ├── CenterPane/         # Main View (terminal, activity, chat, files)
    │   ├── RightPane/          # Explorer & Conversations
    │   ├── ScratchPad/         # Per-workspace notepad
    │   ├── HotkeyHelp/         # Keyboard shortcuts overlay
    │   └── UpdateToast/        # Auto-update notifications
    └── styles/
        └── global.css          # Application styles
```

## Documentation

See the [docs/](docs/) folder for how-to guides:
- [Getting Started](docs/getting-started.md)
- [Managing Workspaces](docs/managing-workspaces.md)
- [Working with Agents](docs/working-with-agents.md)
- [Using Copilot Chat](docs/using-copilot-chat.md)
- [Browsing Files](docs/browsing-files.md)
- [Configuration](docs/configuration.md)
- [Glossary](docs/glossary.md)

## Development

```bash
# Run in development mode with hot reload
npm start

# Run tests
npm test

# Package the application
npm run package

# Create distributable
npm run make
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VP_AUTO_COPILOT` | unset | When set (e.g. `1`), new workspaces auto-run the `copilot` command on creation |
| `VP_ALLOW_MULTI` | unset | When set, allows multiple app instances to run simultaneously |

## Known Limitations

- Workspace resize may have slight delay during rapid window resizing
- Some complex TUI applications may have minor rendering differences compared to native terminals
- Copilot Chat requires `gh` CLI authentication — run `gh auth login` before using
- Restored chat conversations display previous messages but the AI does not retain context from prior sessions

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute, run tests, and submit pull requests.

## License

MIT

## Support

- **Bug reports & feature requests**: [GitHub Issues](https://github.com/ipdelete/cmux/issues)
