'use client';

import { type ReactElement } from 'react';
import TMAXLView from './TMAXLView';
import type { TmuxSession, TmuxPane } from './dashboardData';

interface TMAXLViewSectionProps {
  tmuxSession: TmuxSession;
  selectedPaneId: string | undefined;
  resolvePaneLabel: (pane: TmuxPane) => string;
  handlePaneSelect: (pane: TmuxPane) => void;
  handleRefresh: () => void;
  handleCommandSend: (pane: TmuxPane, command: string) => void;
}

export function TMAXLViewSection({
  tmuxSession,
  selectedPaneId,
  resolvePaneLabel,
  handlePaneSelect,
  handleRefresh,
  handleCommandSend,
}: TMAXLViewSectionProps): ReactElement {
  return (
    <TMAXLView
      onPaneSelect={handlePaneSelect}
      onRefresh={handleRefresh}
      onSendCommand={handleCommandSend}
      selectedPaneId={selectedPaneId}
      session={{
        ...tmuxSession,
        windows: tmuxSession.windows.map((window) => ({
          ...window,
          panes: window.panes.map((pane) => ({
            ...pane,
            title: resolvePaneLabel(pane),
          })),
        })),
      }}
    />
  );
}
