import './renderer/styles/global.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './renderer/App';
import { createLogger } from './renderer/logger';

const log = createLogger('Renderer');

// Suppress benign ResizeObserver error from Monaco Editor
const resizeObserverErr = window.onerror;
window.onerror = (message, ...args) => {
  if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
    return true; // Suppress
  }
  return resizeObserverErr ? resizeObserverErr(message, ...args) : false;
};

// Also suppress in error event handler
window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
  }
});

log.info('Renderer script loading...');

const container = document.getElementById('root');
if (container) {
  log.info('Root container found, mounting React app...');
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    log.info('React app mounted successfully');
  } catch (error) {
    log.error('Failed to mount React app:', error);
    container.innerHTML = `<pre style="color: red; padding: 20px;">Error: ${error}</pre>`;
  }
} else {
  log.error('Root container not found!');
  document.body.innerHTML = '<pre style="color: red; padding: 20px;">Root container not found!</pre>';
}
