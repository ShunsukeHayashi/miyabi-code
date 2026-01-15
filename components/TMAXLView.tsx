'use client';

import { useMemo, useState } from 'react';

import type { TmuxPane, TmuxSession, TmuxWindow } from '@/components/dashboardData';

interface TMAXLViewProps {
  session: TmuxSession
  selectedPaneId?: string
  onPaneSelect?: (pane: TmuxPane) => void
  onSendCommand?: (pane: TmuxPane, command: string) => void
  onRefresh?: () => void
}

type LayoutMode = 'grid' | 'stack'

const paneStateStyles: Record<TmuxPane['state'], string> = {
  focused: 'border-miyabi-purple text-miyabi-purple',
  active: 'border-miyabi-blue text-miyabi-blue',
  idle: 'border-gray-700 text-gray-400',
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function TMAXLView({
  session,
  selectedPaneId,
  onPaneSelect,
  onSendCommand,
  onRefresh,
}: TMAXLViewProps) {
  const [windowId, setWindowId] = useState<string>(session.windows[0]?.id ?? '');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [commandDraft, setCommandDraft] = useState('tmux capture-pane -p');

  const activeWindow = useMemo<TmuxWindow | undefined>(
    () => session.windows.find((window) => window.id === windowId) ?? session.windows[0],
    [session.windows, windowId],
  );

  const panes = activeWindow?.panes ?? [];

  const handlePaneSelect = (pane: TmuxPane) => {
    onPaneSelect?.(pane);
  };

  const handleCommandSend = (pane: TmuxPane) => {
    if (!commandDraft.trim()) {return;}

    onSendCommand?.(pane, commandDraft.trim());
    setCommandDraft('');
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">TMAXL Session View</h2>
          <p className="text-sm text-gray-400">
            Visualize tmux orchestration and interact with panes directly from Mission Control.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-500">Window</span>
            <select
              value={activeWindow?.id}
              onChange={(event) => setWindowId(event.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            >
              {session.windows.map((window) => (
                <option key={window.id} value={window.id} className="text-gray-900">
                  {window.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg flex">
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-2 text-xs font-semibold rounded-l-lg ${
                layoutMode === 'grid' ? 'bg-miyabi-blue text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('stack')}
              className={`px-3 py-2 text-xs font-semibold rounded-r-lg ${
                layoutMode === 'stack' ? 'bg-miyabi-blue text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Stack
            </button>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-2 text-xs font-semibold text-gray-200 bg-gray-800/80 hover:bg-gray-700 rounded-lg"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          {panes.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
              No panes detected in this window.
            </div>
          ) : layoutMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {panes.map((pane) => {
                const isSelected = pane.id === selectedPaneId;
                const style = paneStateStyles[pane.state];

                return (
                  <button
                    key={pane.id}
                    type="button"
                    onClick={() => handlePaneSelect(pane)}
                    className={`text-left bg-gray-900 border rounded-xl p-4 transition-all hover:border-miyabi-blue/60 hover:shadow-lg ${
                      style
                    } ${isSelected ? 'ring-2 ring-miyabi-blue' : ''}`}
                  >
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="font-mono">#{pane.index}</span>
                      <span>{pane.title}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{pane.agentId}</p>
                    <p className="text-xs text-gray-400 mb-4">
                      {pane.lastCommand ?? 'No command history recorded'}
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Recent logs</p>
                      <ul className="space-y-1">
                        {pane.recentLogs.slice(0, 3).map((log) => (
                          <li key={log.id} className="text-xs text-gray-400">
                            <span className="text-gray-500 mr-2">{formatTime(log.timestamp)}</span>
                            {log.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {panes.map((pane) => {
                const isSelected = pane.id === selectedPaneId;
                const style = paneStateStyles[pane.state];

                return (
                  <button
                    key={pane.id}
                    type="button"
                    onClick={() => handlePaneSelect(pane)}
                    className={`w-full text-left bg-gray-900 border rounded-xl p-4 transition-all hover:border-miyabi-blue/60 hover:shadow-lg ${
                      style
                    } ${isSelected ? 'ring-2 ring-miyabi-blue' : ''}`}
                  >
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="font-mono">#{pane.index}</span>
                      <span>{pane.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{pane.agentId}</p>
                      <span className="text-xs text-gray-400">
                        {pane.lastCommand ? `Last: ${pane.lastCommand}` : 'No command history'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {pane.recentLogs[0]?.message ?? 'ログはありません'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-full flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Session Details</h3>
            <p className="text-xs text-gray-400">{session.name}</p>
            <p className="mt-2 text-xs text-gray-500">Started at {formatTime(session.startedAt)}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-gray-400">Windows</p>
            <ul className="space-y-1 text-sm text-gray-300">
              {session.windows.map((window) => (
                <li key={window.id} className="flex items-center justify-between">
                  <span>{window.name}</span>
                  <span className="text-xs text-gray-500">{window.panes.length} panes</span>
                </li>
              ))}
            </ul>
          </div>

          {selectedPaneId ? (
            <PaneDetail
              pane={
                session.windows
                  .flatMap((window) => window.panes)
                  .find((pane) => pane.id === selectedPaneId) ?? panes[0]
              }
              commandDraft={commandDraft}
              onCommandDraftChange={setCommandDraft}
              onSendCommand={handleCommandSend}
            />
          ) : (
            <div className="text-sm text-gray-400">Select a pane to inspect logs and send commands.</div>
          )}
        </aside>
      </div>
    </section>
  );
}

interface PaneDetailProps {
  pane?: TmuxPane
  commandDraft: string
  onCommandDraftChange: (value: string) => void
  onSendCommand: (pane: TmuxPane) => void
}

function PaneDetail({ pane, commandDraft, onCommandDraftChange, onSendCommand }: PaneDetailProps) {
  if (!pane) {
    return <div className="text-sm text-gray-400">No pane selected.</div>;
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div>
        <h4 className="text-base font-semibold text-white flex items-center gap-2">
          Pane #{pane.index}
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${paneStateStyles[pane.state]}`}>
            {pane.state.toUpperCase()}
          </span>
        </h4>
        <p className="text-xs text-gray-400 mt-1">Agent {pane.agentId}</p>
        <p className="text-xs text-gray-500">
          {pane.lastCommand ? `Last command: ${pane.lastCommand}` : 'No command history recorded'}
        </p>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
        <p className="text-xs uppercase tracking-wide text-gray-400">Recent logs</p>
        {pane.recentLogs.slice(0, 6).map((log) => (
          <div key={log.id} className="text-xs text-gray-300">
            <span className="text-gray-500 mr-2">{formatTime(log.timestamp)}</span>
            {log.message}
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSendCommand(pane);
        }}
        className="space-y-3"
      >
        <label className="text-xs uppercase tracking-wide text-gray-400 block">Send command</label>
        <input
          value={commandDraft}
          onChange={(event) => onCommandDraftChange(event.target.value)}
          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-miyabi-blue"
          placeholder="tmux send-keys -t pane "
          type="text"
        />
        <button
          type="submit"
          className="w-full px-3 py-2 text-sm font-semibold text-white bg-miyabi-blue hover:bg-miyabi-purple rounded-lg"
        >
          Dispatch
        </button>
      </form>
    </div>
  );
}
