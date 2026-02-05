import * as os from 'os';

// Mock node-pty
const mockPtyProcess = {
  write: jest.fn(),
  resize: jest.fn(),
  kill: jest.fn(),
  onData: jest.fn(),
  onExit: jest.fn(),
};

const mockSpawn = jest.fn(() => ({ ...mockPtyProcess }));

jest.mock('@homebridge/node-pty-prebuilt-multiarch', () => ({
  spawn: mockSpawn,
}));

// Import after mocking
import { terminalService } from './TerminalService';

describe('TerminalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset terminals map by killing all existing terminals
    for (const id of terminalService.getAllTerminals()) {
      terminalService.kill(id);
    }
  });

  describe('create', () => {
    it('should create a new terminal and return the ID', () => {
      const id = terminalService.create('test-1', '/home/user');

      expect(id).toBe('test-1');
      expect(mockSpawn).toHaveBeenCalledTimes(1);
      expect(terminalService.getTerminal('test-1')).toBeDefined();
    });

    it('should return existing terminal ID when creating duplicate', () => {
      // Create first terminal
      terminalService.create('test-dup', '/home/user');
      expect(mockSpawn).toHaveBeenCalledTimes(1);

      // Try to create duplicate
      const id = terminalService.create('test-dup', '/home/user');

      expect(id).toBe('test-dup');
      // Should NOT spawn a new PTY
      expect(mockSpawn).toHaveBeenCalledTimes(1);
    });

    it('should not spawn new PTY process for existing ID', () => {
      terminalService.create('test-no-dup', '/home/user');
      const firstCallCount = mockSpawn.mock.calls.length;

      // Create with same ID multiple times
      terminalService.create('test-no-dup', '/different/path');
      terminalService.create('test-no-dup', '/another/path');

      // spawn should not have been called again
      expect(mockSpawn).toHaveBeenCalledTimes(firstCallCount);
    });
  });

  describe('write', () => {
    it('should write data to terminal', () => {
      terminalService.create('test-write', '/home/user');
      const terminal = terminalService.getTerminal('test-write');

      terminalService.write('test-write', 'ls -la');

      expect(terminal?.pty.write).toHaveBeenCalledWith('ls -la');
    });

    it('should not throw for non-existent terminal', () => {
      expect(() => terminalService.write('non-existent', 'data')).not.toThrow();
    });
  });

  describe('resize', () => {
    it('should resize terminal', () => {
      terminalService.create('test-resize', '/home/user');
      const terminal = terminalService.getTerminal('test-resize');

      terminalService.resize('test-resize', 120, 40);

      expect(terminal?.pty.resize).toHaveBeenCalledWith(120, 40);
    });
  });

  describe('kill', () => {
    it('should kill terminal and remove from map', () => {
      terminalService.create('test-kill', '/home/user');
      const terminal = terminalService.getTerminal('test-kill');

      terminalService.kill('test-kill');

      expect(terminal?.pty.kill).toHaveBeenCalled();
      expect(terminalService.getTerminal('test-kill')).toBeUndefined();
    });
  });

  describe('getAllTerminals', () => {
    it('should return all terminal IDs', () => {
      terminalService.create('term-a', '/home/user');
      terminalService.create('term-b', '/home/user');

      const ids = terminalService.getAllTerminals();

      expect(ids).toContain('term-a');
      expect(ids).toContain('term-b');
    });
  });
});
