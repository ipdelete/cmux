import * as React from 'react';
import { render, cleanup } from '@testing-library/react';
import { act } from 'react';

// Mock xterm
jest.mock('@xterm/xterm', () => ({
  Terminal: jest.fn().mockImplementation(() => ({
    loadAddon: jest.fn(),
    open: jest.fn(),
    onData: jest.fn(),
    attachCustomKeyEventHandler: jest.fn(),
    write: jest.fn(),
    focus: jest.fn(),
    cols: 80,
    rows: 24,
    dispose: jest.fn(),
    getSelection: jest.fn(() => ''),
    clearSelection: jest.fn(),
  })),
}));

jest.mock('@xterm/addon-fit', () => ({
  FitAddon: jest.fn().mockImplementation(() => ({
    fit: jest.fn(),
  })),
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
(global as any).ResizeObserver = MockResizeObserver;

// Import after mocks
import { TerminalView } from './TerminalView';

describe('TerminalView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Extend the existing electronAPI mock with our test-specific functions
    (window.electronAPI as any).terminal = {
      create: jest.fn().mockResolvedValue('test-id'),
      write: jest.fn().mockResolvedValue(undefined),
      resize: jest.fn().mockResolvedValue(undefined),
      kill: jest.fn().mockResolvedValue(undefined),
      onData: jest.fn(),
      onExit: jest.fn(),
    };
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it('should render terminal container', () => {
    render(<TerminalView terminalId="test-1" cwd="/home/user" isActive={true} />);
    expect(document.querySelector('.terminal-container')).toBeTruthy();
  });

  it('should register IPC listeners on mount', async () => {
    render(<TerminalView terminalId="test-2" cwd="/home/user" isActive={true} />);

    // Advance timers to trigger the initial setup
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(window.electronAPI.terminal.onData).toHaveBeenCalled();
  });

  it('should create terminal in main process', async () => {
    render(<TerminalView terminalId="test-3" cwd="/home/user" isActive={true} />);

    // Advance timers to trigger terminal creation
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(window.electronAPI.terminal.create).toHaveBeenCalledWith('test-3', '/home/user');
  });
});
