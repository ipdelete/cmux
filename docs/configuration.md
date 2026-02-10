# Configuration

cmux uses environment variables for feature flags and configuration.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VP_AUTO_COPILOT` | unset | When set (e.g. `1`), new workspaces auto-run the `copilot` command on creation. When unset, workspaces open as plain shells. |
| `VP_ALLOW_MULTI` | unset | When set, allows multiple cmux instances to run simultaneously. By default, only one instance is allowed. |

## Setting Environment Variables

### PowerShell (Windows)

```powershell
$env:VP_AUTO_COPILOT=1; npm start
```

### Bash / Zsh (macOS / Linux)

```bash
VP_AUTO_COPILOT=1 npm start
```

## Authentication & Global Dependencies

cmux requires the GitHub CLI and Copilot packages:

```bash
gh auth login
npm install -g @github/copilot @github/copilot-sdk
```

This is a one-time setup. The app uses your existing Copilot entitlement through the CLI.
