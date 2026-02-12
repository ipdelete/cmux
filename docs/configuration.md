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

## Authentication & Copilot Runtime

Packaged builds bundle Node plus the Copilot CLI/SDK and bootstrap them on first use. For development builds,
install the Copilot CLI/SDK using your preferred method so cmux can find them.

On first launch, use the `/login` command in the Copilot CLI to authenticate with your GitHub account. Alternatively, set `GH_TOKEN` or `GITHUB_TOKEN` environment variables with a personal access token.
