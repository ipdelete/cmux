# cmux

> *One window. Multiple repos. AI agents that do the work.*

[![CI](https://github.com/ipdelete/cmux/workflows/CI/badge.svg)](https://github.com/ipdelete/cmux/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/github/package-json/v/ipdelete/cmux)](https://github.com/ipdelete/cmux/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/ipdelete/cmux/releases)

A modern Electron-based workspace and agent manager for working across multiple repositories simultaneously. Features a three-pane layout with integrated file browsing, Copilot Chat, and AI-powered agents.

![cmux demo](img/hero-demo.gif)

## Features

🖥️ Multi-Workspace Management · 🤖 Chat-Driven Agents · 💬 Copilot Chat · 📁 File Browser · ✨ Monaco Editor · 🔀 Git Integration · 📝 Scratch Pad · 🎨 Three-Pane Layout · 🔄 Auto-Updates

See [Features](docs/features.md) for details.

## Installation

### Prerequisites
- Node.js 18+ (required for running from source)
- npm 9+ (required for running from source)

Packaged builds bundle Node plus the Copilot CLI/SDK and bootstrap them on first use. If you're running from
source, install the Copilot CLI/SDK using your preferred method so cmux can find them.

On first launch, use the `/login` command in the Copilot CLI to authenticate with your GitHub account.

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

See [Getting Started](docs/getting-started.md) for a walkthrough of creating your first workspace.

## Documentation

See the [docs/](docs/) folder for how-to guides, configuration, and glossary.

## Development

```bash
npm start          # Dev mode with hot reload
npm test           # Run tests
npm run package    # Package the application
npm run make       # Create distributable
```

## Known Limitations

- Workspace resize may have slight delay during rapid window resizing
- Some complex TUI applications may have minor rendering differences compared to native terminals
- Copilot Chat requires authentication — use `/login` in the Copilot CLI on first use
- Restored chat conversations display previous messages but the AI does not retain context from prior sessions

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute, run tests, and submit pull requests.

## License

MIT

## Support

- **Bug reports & feature requests**: [GitHub Issues](https://github.com/ipdelete/cmux/issues)
