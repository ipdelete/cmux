import * as React from 'react';
import { ReactNode } from 'react';

interface ThreePaneLayoutProps {
  leftPane: ReactNode;
  centerPane: ReactNode;
  rightPane: ReactNode;
}

export function ThreePaneLayout({ leftPane, centerPane, rightPane }: ThreePaneLayoutProps) {
  return (
    <div className="three-pane-layout">
      <nav className="left-pane" aria-label="Agent workspace">{leftPane}</nav>
      <main className="center-pane">{centerPane}</main>
      <aside className="right-pane" aria-label="File explorer">{rightPane}</aside>
    </div>
  );
}
