import log from 'electron-log/main';

// Configure log levels and output
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB rotation

// Scope-based logger factory
export function createLogger(scope: string) {
  return log.scope(scope);
}

export default log;
