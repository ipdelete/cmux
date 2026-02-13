import React from 'react';
import { FileTreeNode } from './FileTreeNode';
import { useDirectoryLoader } from '../../hooks/useDirectoryLoader';
import { useFileWatcher } from '../../hooks/useFileWatcher';
import { useGitStatusWatcher } from '../../hooks/useGitStatusWatcher';
import { useContextMenu } from '../../hooks/useContextMenu';
import { Icon } from '../Icon';

interface FileTreeProps {
  rootPath: string;
  onFileClick: (filePath: string) => void;
  refreshTrigger?: number;
  showHiddenFiles?: boolean;
}

interface FileTreeMenuTarget {
  path: string;
}

export const FileTree: React.FC<FileTreeProps> = ({ rootPath, onFileClick, refreshTrigger, showHiddenFiles }) => {
  const {
    rootEntries, loading, error, expandedDirs,
    watchedDirsRef, refreshDirectory,
    handleDirectoryToggle, loadChildren, getChildren,
  } = useDirectoryLoader(rootPath, refreshTrigger ?? 0, showHiddenFiles);

  const { gitStatusMap, refreshGitStatus } = useGitStatusWatcher(rootPath);
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu<FileTreeMenuTarget>();

  useFileWatcher(rootPath, watchedDirsRef, refreshDirectory, refreshGitStatus);

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    openContextMenu(e, { path });
  };

  const handleCopyPath = () => {
    if (contextMenu.target?.path) {
      navigator.clipboard.writeText(contextMenu.target.path);
    }
    closeContextMenu();
  };

  // Refresh git status on manual refresh
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refreshGitStatus();
    }
  }, [refreshTrigger, refreshGitStatus]);

  if (loading) {
    return <div className="file-tree-loading">Loading...</div>;
  }

  if (error) {
    return <div className="file-tree-error">{error}</div>;
  }

  if (rootEntries.length === 0) {
    return <div className="file-tree-empty">Empty directory</div>;
  }

  return (
    <div className="file-tree" role="tree" aria-label="File explorer">
      {rootEntries.map((entry) => (
        <FileTreeNode
          key={entry.path}
          entry={entry}
          level={0}
          onFileClick={onFileClick}
          onDirectoryToggle={handleDirectoryToggle}
          onContextMenu={handleContextMenu}
          expandedDirs={expandedDirs}
          loadChildren={loadChildren}
          getChildren={getChildren}
          gitStatusMap={gitStatusMap}
        />
      ))}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x, position: 'fixed' }}
        >
          <button onClick={handleCopyPath}>
            <Icon name="copy" size="sm" />
            Copy Path
          </button>
        </div>
      )}
    </div>
  );
};

