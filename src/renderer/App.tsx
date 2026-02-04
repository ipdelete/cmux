import * as React from 'react';
import { useEffect } from 'react';
import { AppStateProvider } from './contexts/AppStateContext';
import { ThreePaneLayout } from './components/Layout';
import { LeftPane } from './components/LeftPane';
import { CenterPane } from './components/CenterPane';
import { RightPane } from './components/RightPane';
import { useAppState } from './contexts/AppStateContext';

function AppContent() {
  const { state, dispatch } = useAppState();

  // Auto-open a terminal on first launch
  useEffect(() => {
    if (state.terminals.length === 0) {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '/';
      const id = `term-${Date.now()}`;
      dispatch({
        type: 'ADD_TERMINAL',
        payload: { id, label: 'Terminal', cwd: homeDir },
      });
    }
  }, []);

  const handleAddTerminal = async () => {
    const directory = await window.electronAPI.openDirectory();
    if (directory) {
      const id = `term-${Date.now()}`;
      const label = directory.split(/[/\\]/).pop() || 'Terminal';
      dispatch({
        type: 'ADD_TERMINAL',
        payload: { id, label, cwd: directory },
      });
    }
  };

  const handleCloseTerminal = (terminalId: string) => {
    // Kill the terminal process
    window.electronAPI.terminal.kill(terminalId);
    // Remove from state
    dispatch({ type: 'REMOVE_TERMINAL', payload: { id: terminalId } });
  };

  const handleFileClick = (filePath: string, fileName: string) => {
    // Will be implemented in Phase 5
  };

  return (
    <ThreePaneLayout
      leftPane={
        <LeftPane
          onAddTerminal={handleAddTerminal}
          onCloseTerminal={handleCloseTerminal}
        />
      }
      centerPane={<CenterPane />}
      rightPane={<RightPane onFileClick={handleFileClick} />}
    />
  );
}

const App: React.FC = () => {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
};

export default App;
