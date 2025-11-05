import { useEffect, useState } from 'react';
import {
  listSessionWindows,
  listWindowPanes,
  getPaneContent,
  sendToPane,
  focusWindow,
  focusPane,
  TmuxWindowInfo,
  TmuxPaneInfo,
} from '../lib/tauri-api';

/**
 * Simple, visual tmux monitor with intuitive UI
 *
 * Features:
 * - 🪟 See all windows at a glance
 * - 📺 Click on any window to see its panes
 * - 📋 Click on any pane to see what it's running
 * - ⚡ Send commands with one click
 * - 🎯 Auto-refreshes every 3 seconds
 */
export function TmuxMonitorPanel() {
  const [sessionName] = useState('miyabi-auto-dev');
  const [windows, setWindows] = useState<TmuxWindowInfo[]>([]);
  const [selectedWindowIndex, setSelectedWindowIndex] = useState<number | null>(null);
  const [panes, setPanes] = useState<TmuxPaneInfo[]>([]);
  const [selectedPane, setSelectedPane] = useState<{ windowIndex: number; paneIndex: number } | null>(null);
  const [paneContent, setPaneContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load windows every 3 seconds
  useEffect(() => {
    const loadWindows = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await listSessionWindows(sessionName);
        setWindows(result);

        // Auto-select first window if none selected
        if (selectedWindowIndex === null && result.length > 0) {
          setSelectedWindowIndex(result[0].index);
        }
      } catch (err) {
        setError('Session not running. Start Full Automation first!');
      } finally {
        setLoading(false);
      }
    };

    loadWindows();
    const interval = setInterval(loadWindows, 3000);
    return () => clearInterval(interval);
  }, [sessionName, selectedWindowIndex]);

  // Load panes when window selected
  useEffect(() => {
    if (selectedWindowIndex === null) return;

    const loadPanes = async () => {
      try {
        const result = await listWindowPanes(sessionName, selectedWindowIndex);
        setPanes(result);

        // Auto-select first pane
        if (selectedPane === null && result.length > 0) {
          setSelectedPane({ windowIndex: selectedWindowIndex, paneIndex: result[0].paneIndex });
        }
      } catch (err) {
        console.error('Failed to load panes:', err);
      }
    };

    loadPanes();
    const interval = setInterval(loadPanes, 3000);
    return () => clearInterval(interval);
  }, [sessionName, selectedWindowIndex, selectedPane]);

  // Load pane content when pane selected
  useEffect(() => {
    if (!selectedPane) return;

    const loadContent = async () => {
      try {
        const content = await getPaneContent(
          sessionName,
          selectedPane.windowIndex,
          selectedPane.paneIndex,
          undefined,
          30 // Last 30 lines
        );
        if (content) {
          setPaneContent(content);
        }
      } catch (err) {
        console.error('Failed to load pane content:', err);
      }
    };

    loadContent();
    const interval = setInterval(loadContent, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [sessionName, selectedPane]);

  const handleSendCommand = async (command: string) => {
    if (!selectedPane) return;

    try {
      await sendToPane(sessionName, selectedPane.windowIndex, selectedPane.paneIndex, undefined, command);
      alert(`✅ Sent: ${command}`);
    } catch (err) {
      alert(`❌ Failed to send command: ${err}`);
    }
  };

  if (loading && windows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading automation session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-800">Automation Not Running</h3>
            <p className="text-yellow-700 mt-1">{error}</p>
            <p className="text-sm text-yellow-600 mt-2">
              Go to the "Full Automation" panel and click "Start Full Automation" button.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>🎛️</span>
          <span>Tmux Monitor</span>
        </h2>
        <p className="text-blue-100 mt-1">
          Real-time view of all agents running in tmux
        </p>
      </div>

      {/* Windows List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>🪟</span>
          <span>Windows ({windows.length})</span>
        </h3>

        {windows.length === 0 ? (
          <p className="text-gray-500 text-sm">No windows found. Start automation first.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {windows.map((window) => (
              <button
                key={window.index}
                onClick={() => {
                  setSelectedWindowIndex(window.index);
                  setSelectedPane(null); // Reset pane selection
                  focusWindow(sessionName, window.index);
                }}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${
                    selectedWindowIndex === window.index
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
                  }
                `}
              >
                {/* Active indicator */}
                {window.active && (
                  <div className="absolute top-2 right-2">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  </div>
                )}

                <div className="font-semibold text-gray-800">{window.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {window.paneCount} pane{window.paneCount !== 1 ? 's' : ''}
                </div>
                {selectedWindowIndex === window.index && (
                  <div className="text-xs text-blue-600 mt-2 font-medium">
                    ✓ Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Panes View */}
      {selectedWindowIndex !== null && panes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📺</span>
            <span>
              Panes in "{windows.find((w) => w.index === selectedWindowIndex)?.name}" ({panes.length})
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {panes.map((pane) => (
              <button
                key={pane.paneIndex}
                onClick={() => {
                  setSelectedPane({ windowIndex: selectedWindowIndex, paneIndex: pane.paneIndex });
            focusPane(sessionName, selectedWindowIndex, pane.paneIndex, undefined);
                }}
                className={`
                  relative p-3 rounded-lg border-2 transition-all text-left
                  ${
                    selectedPane?.paneIndex === pane.paneIndex
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }
                `}
              >
                {pane.active && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></div>
                )}

                <div className="text-sm font-medium text-gray-800">
                  Pane {pane.paneIndex}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <div>▶ {pane.currentCommand}</div>
                  <div className="mt-1">📁 {pane.currentPath.split('/').pop()}</div>
                  <div className="mt-1">📐 {pane.width}x{pane.height}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pane Content Viewer */}
      {selectedPane && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-gray-800 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>💻</span>
              <span className="font-mono text-sm">
                Window {selectedPane.windowIndex} › Pane {selectedPane.paneIndex}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Auto-updates every 2s</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-b-lg overflow-auto max-h-96">
            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
              {paneContent || 'No output yet...'}
            </pre>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">⚡ Quick Actions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleSendCommand('clear')}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors"
              >
                🧹 Clear
              </button>
              <button
                onClick={() => handleSendCommand('ls -la')}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm transition-colors"
              >
                📂 List Files
              </button>
              <button
                onClick={() => handleSendCommand('git status')}
                className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm transition-colors"
              >
                🔧 Git Status
              </button>
              <button
                onClick={() => {
                  const cmd = prompt('Enter command to send:');
                  if (cmd) handleSendCommand(cmd);
                }}
                className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm transition-colors"
              >
                ⌨️ Custom...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 flex items-center gap-2">
          <span>💡</span>
          <span>How to Use</span>
        </h4>
        <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
          <li>Click on a <strong>window</strong> to see what's inside</li>
          <li>Click on a <strong>pane</strong> to see what it's running</li>
          <li>Use <strong>Quick Actions</strong> to send commands instantly</li>
          <li>Everything updates automatically - just watch!</li>
        </ol>
      </div>
    </div>
  );
}
