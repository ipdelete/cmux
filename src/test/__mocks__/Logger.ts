// Mock Logger for tests — avoids importing electron-log which requires Electron runtime
const noopLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

export function createLogger() {
  return noopLogger;
}

export default noopLogger;
