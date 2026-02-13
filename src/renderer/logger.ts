// Renderer-side logging utility
// In Electron renderer, we use console with structured prefixes
// electron-log's renderer transport can be configured if needed

export function createLogger(scope: string) {
  return {
    info: (...args: unknown[]) => console.log(`[${scope}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[${scope}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${scope}]`, ...args),
    debug: (...args: unknown[]) => console.debug(`[${scope}]`, ...args),
  };
}
