import '@testing-library/jest-dom';

// Mock window.electronAPI for renderer tests
const mockElectronAPI = {
  openDirectory: jest.fn(),
  config: {
    autoCopilot: false,
  },
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});
