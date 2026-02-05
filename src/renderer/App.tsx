import * as React from 'react';
import { useEffect, useRef } from 'react';
import { ThreePaneLayout } from './components/Layout';
import { LeftPane } from './components/LeftPane';
import { CenterPane } from './components/CenterPane';
import { RightPane } from './components/RightPane';
import { AppStateProvider, useAppState } from './contexts/AppStateContext';

function AppContent() {
  const { state, dispatch } = useAppState();
  const hasRestoredRef = useRef(false);

  // Restore session on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restoreSession = async () => {
      try {
        const sessionData = await window.electronAPI.session.load();
        if (sessionData && sessionData.terminals.length > 0) {
          // Restore each terminal
          for (const terminal of sessionData.terminals) {
            // Create the PTY process
            await window.electronAPI.terminal.create(terminal.id, terminal.cwd);
            
            // Dispatch to add terminal to state
            dispatch({
              type: 'ADD_TERMINAL',
              payload: { id: terminal.id, label: terminal.label, cwd: terminal.cwd },
            });

            // Restore open files for this terminal
            for (const file of terminal.openFiles) {
              dispatch({
                type: 'ADD_FILE',
                payload: { terminalId: terminal.id, file },
              });
            }
          }

          // Restore active item selection
          if (sessionData.activeItemId) {
            dispatch({
              type: 'SET_ACTIVE_ITEM',
              payload: { 
                id: sessionData.activeItemId, 
                terminalId: sessionData.activeTerminalId ?? undefined 
              },
            });
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      }
    };

    restoreSession();
  }, [dispatch]);

  // Save session on close
  useEffect(() => {
    const handleBeforeUnload = () => {
      window.electronAPI.session.save({
        terminals: state.terminals,
        activeItemId: state.activeItemId,
        activeTerminalId: state.activeTerminalId,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

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
    window.electronAPI.terminal.kill(terminalId);
    dispatch({ type: 'REMOVE_TERMINAL', payload: { id: terminalId } });
  };

  const handleFileClick = (filePath: string, fileName: string) => {
    // Check if file is already open in the current terminal
    const activeTerminal = state.terminals.find(t => t.id === state.activeTerminalId);
    if (!activeTerminal) return;

    const existingFile = activeTerminal.openFiles.find(f => f.path === filePath);
    if (existingFile) {
      // File already open, just switch to it
      dispatch({ 
        type: 'SET_ACTIVE_ITEM', 
        payload: { id: existingFile.id, terminalId: activeTerminal.id } 
      });
    } else {
      // Open new file
      const fileId = `file-${Date.now()}`;
      dispatch({
        type: 'ADD_FILE',
        payload: {
          terminalId: activeTerminal.id,
          file: {
            id: fileId,
            path: filePath,
            name: fileName,
            parentTerminalId: activeTerminal.id,
          },
        },
      });
      dispatch({ 
        type: 'SET_ACTIVE_ITEM', 
        payload: { id: fileId, terminalId: activeTerminal.id } 
      });
    }
  };

  return (
    <div className="app-container">
      <div className="title-bar">
        <span className="title-bar-text">Multi-Repo Terminal</span>
      </div>
      <div className="app-content">
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
      </div>
    </div>
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
