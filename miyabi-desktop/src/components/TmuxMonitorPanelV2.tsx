import type { FormEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import clsx from 'clsx';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  listSessionWindows,
  listWindowPanes,
  getPaneContent,
  sendToPane,
  focusWindow,
  focusPane,
  listTmuxSessions,
  TmuxWindowInfo,
  TmuxPaneInfo,
  checkTmuxSessionExists,
} from '../lib/tauri-api';

const SCENARIOS = [
  {
    id: 'coding',
    title: '開発フローを開始',
    subtitle: 'Coding Orchestra をフル起動',
    command: './scripts/miyabi-orchestra.sh coding-ensemble',
  },
  {
    id: 'hybrid',
    title: 'ハイブリッド編成',
    subtitle: 'Coding + Business Agents',
    command: './scripts/miyabi-orchestra.sh hybrid-ensemble',
  },
  {
    id: 'layout',
    title: 'レイアウト整列',
    subtitle: 'main-horizontal で整列',
    command: 'tmux select-layout -t miyabi-auto-dev:1 main-horizontal',
  },
] as const;

const AGENT_TARGETS = [
  { id: 'codegen', label: 'カエデ (CodeGen)', window: 'CodingOrchestra', pane: 1 },
  { id: 'review', label: 'サクラ (Review)', window: 'CodingOrchestra', pane: 2 },
  { id: 'deploy', label: 'ボタン (Deploy)', window: 'CodingOrchestra', pane: 3 },
  { id: 'status', label: 'ステータス監視', window: 'StatusBoard', pane: 1 },
] as const;

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600';

type TmuxMonitorPanelV2Props = {
  className?: string;
};

export function TmuxMonitorPanelV2({ className }: TmuxMonitorPanelV2Props) {
  const [sessionName, setSessionName] = useState('miyabi-auto-dev');
  const [windows, setWindows] = useState<TmuxWindowInfo[]>([]);
  const [sessions, setSessions] = useState<string[]>(['miyabi-auto-dev']);
  const [selectedWindowIndex, setSelectedWindowIndex] = useState<number | null>(null);
  const [panes, setPanes] = useState<TmuxPaneInfo[]>([]);
  const [selectedPane, setSelectedPane] = useState<{ windowIndex: number; paneIndex: number; paneId: string } | null>(null);
  const [paneContent, setPaneContent] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'info' | 'error' } | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const totalPaneCount = useMemo(
    () => windows.reduce((sum, windowInfo) => sum + windowInfo.paneCount, 0),
    [windows]
  );

  const findWindow = useCallback(
    (name: string) => windows.find((windowInfo) => windowInfo.name === name),
    [windows]
  );

  const handleSessionMissing = useCallback(
    (message?: string) => {
      setSessionReady(false);
      setSessionMessage(message ?? 'tmux セッションが起動していません。');
      setWindows([]);
      setPanes([]);
      setPaneContent('');
      setSelectedWindowIndex(null);
      setSelectedPane(null);
    },
    []
  );

  const refreshSessions = useCallback(async () => {
    try {
      const summaries = await listTmuxSessions();
      if (!summaries.length) {
        setSessions(['miyabi-auto-dev']);
        handleSessionMissing();
        return;
      }
      const names = summaries.map((item) => item.sessionName);
      const targetSession = names.includes(sessionName) ? sessionName : names[0];
      setSessions(names);
      setSessionName(targetSession);
      if (names.includes(sessionName)) {
        setSessionReady(true);
        setSessionMessage(null);
      } else {
        handleSessionMissing();
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessions(['miyabi-auto-dev']);
      handleSessionMissing();
    }
  }, [sessionName, handleSessionMissing]);

  const refreshWindows = useCallback(
    async (showLoader = false) => {
      try {
        const exists = await checkTmuxSessionExists(sessionName);
        if (!exists) {
          handleSessionMissing();
          return;
        }

        const result = await listSessionWindows(sessionName);
        setSessionReady(true);
        setSessionMessage(null);
        setWindows(result);

        setSelectedWindowIndex((current) => {
          if (!result.length) return null;
          if (current !== null && result.some((item) => item.index === current)) {
            return current;
          }
          return result[0]?.index ?? null;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("can't find session") || message.includes('not exist')) {
          handleSessionMissing();
        } else {
          console.error('Failed to load windows:', err);
        }
      } finally {
        if (showLoader) {
        }
      }
    },
    [sessionName, handleSessionMissing]
  );

  const refreshPanes = useCallback(
    async (windowIndex: number | null) => {
      if (!sessionReady || windowIndex === null) {
        setPanes([]);
        setSelectedPane(null);
        setPaneContent('');
        return;
      }
      try {
        const result = await listWindowPanes(sessionName, windowIndex);
        setPanes(result);
        setSelectedPane((current) => {
          if (!result.length) return null;
          if (
            current &&
            current.windowIndex === windowIndex &&
            result.some((pane) => pane.paneIndex === current.paneIndex && pane.paneId === current.paneId)
          ) {
            return current;
          }
          const firstPane = result[0];
          if (!firstPane) {
            return null;
          }
          return {
            windowIndex,
            paneIndex: firstPane.paneIndex,
            paneId: firstPane.paneId,
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("can't find session") || message.includes('not exist')) {
          handleSessionMissing();
        } else {
          console.error('Failed to load panes:', err);
        }
      }
    },
    [sessionName, sessionReady, handleSessionMissing]
  );

  const refreshContent = useCallback(
    async (target: { windowIndex: number; paneIndex: number; paneId: string } | null) => {
      if (!target) {
        setPaneContent('');
        return;
      }
      if (!sessionReady) {
        setPaneContent('');
        return;
      }
      try {
        const content = await getPaneContent(
          sessionName,
          target.windowIndex,
          target.paneIndex,
          target.paneId,
          40
        );
        setPaneContent(content ?? '');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("can't find session") || message.includes('not exist')) {
          handleSessionMissing();
        } else if (message.includes("can't find pane")) {
          setPaneContent('');
        } else {
          console.error('Failed to load pane content:', err);
        }
      }
    },
    [sessionName, sessionReady, handleSessionMissing]
  );

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    refreshWindows(true);
  }, [refreshWindows, sessionName, refreshSessions]);

  useEffect(() => {
    if (selectedWindowIndex === null) {
      setPanes([]);
      setSelectedPane(null);
      setPaneContent('');
      return;
    }
    refreshPanes(selectedWindowIndex);
  }, [refreshPanes, selectedWindowIndex]);

  useEffect(() => {
    refreshContent(selectedPane);
  }, [refreshContent, selectedPane]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshWindows();
      refreshPanes(selectedWindowIndex);
      refreshContent(selectedPane);
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshWindows, refreshPanes, refreshContent, selectedWindowIndex, selectedPane]);

  useEffect(() => {
    const container = logContainerRef.current;
    if (!container || !autoScroll) return;
    container.scrollTop = container.scrollHeight;
  }, [paneContent, autoScroll]);

  const handleSelectWindow = async (windowInfo: TmuxWindowInfo) => {
    setSelectedWindowIndex(windowInfo.index);
    setSelectedPane(null);
    await focusWindow(sessionName, windowInfo.index);
    refreshPanes(windowInfo.index);
  };

  const handleSelectPane = async (paneInfo: TmuxPaneInfo) => {
    if (selectedWindowIndex === null) return;
    const target = {
      windowIndex: selectedWindowIndex,
      paneIndex: paneInfo.paneIndex,
      paneId: paneInfo.paneId,
    };
    setSelectedPane(target);
    await focusPane(sessionName, target.windowIndex, target.paneIndex, target.paneId);
    refreshContent(target);
  };

  const handleSendInterrupt = async () => {
    if (!sessionReady) {
      setToast({ message: 'tmux セッションが起動していません。まずセッションを初期化してください。', tone: 'error' });
      return;
    }
    if (!selectedPane) {
      setToast({ message: '画面を選択してください。', tone: 'error' });
      return;
    }
    try {
      await sendToPane(
        sessionName,
        selectedPane.windowIndex,
        selectedPane.paneIndex,
        selectedPane.paneId,
        '\u0003'
      );
      setToast({ message: '現在のコマンドを停止しました (Ctrl+C)。', tone: 'info' });
    } catch (err) {
      console.error(err);
      setToast({ message: '停止コマンドの送信に失敗しました。', tone: 'error' });
    }
  };

  const handleSendCommand = async (command: string) => {
    if (!sessionReady) {
      setToast({ message: 'tmux セッションが起動していません。まずセッションを初期化してください。', tone: 'error' });
      return;
    }
    if (!selectedPane) {
      setToast({ message: '画面を選択してください。', tone: 'error' });
      return;
    }
    try {
      await sendToPane(
        sessionName,
        selectedPane.windowIndex,
        selectedPane.paneIndex,
        selectedPane.paneId,
        command
      );
      setToast({ message: `「${command.trim()}」を送信しました。`, tone: 'info' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'コマンド送信に失敗しました。', tone: 'error' });
    }
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = commandInput.trim();
    if (!trimmed) return;
    await handleSendCommand(trimmed);
    setCommandHistory((prev) => [trimmed, ...prev.filter((cmd) => cmd !== trimmed)].slice(0, 6));
    setCommandInput('');
  };

  const handleScenario = async (scenarioCommand: string) => {
    if (!sessionReady) {
      setToast({ message: 'tmux セッションが起動していません。まずセッションを初期化してください。', tone: 'error' });
      return;
    }
    try {
      const conductor = findWindow('CodingOrchestra') ?? windows[0];
      if (!conductor) throw new Error('対象ウィンドウが見つかりません');
      const conductorPane = panes.find(
        (pane) => pane.sessionName === sessionName && pane.windowIndex === conductor.index && pane.paneIndex === 0
      );
      await sendToPane(sessionName, conductor.index, 0, conductorPane?.paneId, scenarioCommand);
      setToast({ message: 'シナリオを実行しました。', tone: 'info' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'シナリオ実行に失敗しました。', tone: 'error' });
    }
  };

  const handleAgentFocus = async (windowName: string, paneIndex: number) => {
    if (!sessionReady) {
      setToast({ message: 'tmux セッションが起動していません。まずセッションを初期化してください。', tone: 'error' });
      return;
    }
    const targetWindow = findWindow(windowName);
    if (!targetWindow) {
      setToast({ message: `${windowName} が見つかりません。`, tone: 'error' });
      return;
    }
    const targetPane = panes.find(
      (pane) => pane.sessionName === sessionName && pane.windowIndex === targetWindow.index && pane.paneIndex === paneIndex
    );
    await focusPane(sessionName, targetWindow.index, paneIndex, targetPane?.paneId);
    await refreshWindows();
    await refreshPanes(targetWindow.index);
    setSelectedWindowIndex(targetWindow.index);
    if (targetPane) {
      setSelectedPane({ windowIndex: targetWindow.index, paneIndex, paneId: targetPane.paneId });
    } else {
      setSelectedPane(null);
    }
    setToast({ message: '対象エージェント画面へ移動しました。', tone: 'info' });
  };

  const handleResetSession = async () => {
    setToast({ message: 'セッションを初期化しています…', tone: 'info' });
    try {
      await invoke('tmux_kill_session', { sessionName: 'miyabi-auto-dev' });
    } catch (err) {
      console.warn('Failed to kill existing session:', err);
    }
    try {
      const config = {
        session_name: 'miyabi-auto-dev',
        repo_root: '/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private',
        task_file: '',
        enable_claude_code: true,
        enable_codex: true,
        enable_monitoring: true,
        orchestrator_mode: true,
      } as const;
      await invoke('start_full_automation', { config });
      setToast({ message: 'セッションを再構成しました。', tone: 'info' });
      await refreshWindows(true);
      if (selectedWindowIndex !== null) {
        await refreshPanes(selectedWindowIndex);
      }
      if (selectedPane) {
        await refreshContent(selectedPane);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'セッション初期化に失敗しました。', tone: 'error' });
    }
  };

  return (
    <div className={clsx('flex h-full min-h-0 flex-col bg-white', className)}>
      {toast && (
        <div className={`fixed top-5 right-5 z-20 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.tone === 'info' ? 'bg-gray-900 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white/90 px-6 py-3 text-sm text-gray-600 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>セッション</span>
            <select
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            >
              {sessions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select
>
          </div>
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {sessionReady && windows.length ? 'Active' : sessionReady ? 'Idle' : 'Inactive'}
          </span>
          <span className="flex items-center gap-1">
            <span className="font-semibold text-gray-900">{windows.length}</span>
            <span>ウィンドウ</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="font-semibold text-gray-900">{totalPaneCount}</span>
            <span>ペイン</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetSession}
            className={`${focusRing} inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900`}
          >
            セッション初期化
          </button>
          <button
            type="button"
            onClick={() => refreshWindows(true)}
            className={`${focusRing} inline-flex items-center gap-2 rounded-full border border-gray-900 bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800`}
          >
            更新
          </button>
          <button
            type="button"
            onClick={() => setShowControls((prev) => !prev)}
            className={`${focusRing} inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900`}
          >
            {showControls ? '操作パネルを閉じる' : '操作パネルを開く'}
          </button>
        </div>
      </header>

      {!sessionReady && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">tmux セッションが起動していません。</p>
              <p className="text-xs text-amber-700">{sessionMessage ?? '右上の「セッション初期化」を押すか、tmux 側でセッションを起動してください。'}</p>
            </div>
            <button
              type="button"
              onClick={handleResetSession}
              className={`${focusRing} inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-1.5 text-xs font-semibold text-amber-800 transition hover:border-amber-600 hover:text-amber-900`}
            >
              セッション初期化
            </button>
          </div>
        </div>
      )}

      {showControls && (
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-5 space-y-5">
          <section className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>Scenario Presets</span>
              <span>自動整備</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleScenario(scenario.command)}
                  className={`${focusRing} flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-900 hover:shadow-lg`}
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{scenario.subtitle}</p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">{scenario.title}</h3>
                  </div>
                  <span className="mt-4 text-xs font-semibold text-gray-500">実行する</span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>Agent Control</span>
              <span>すぐにジャンプ</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {AGENT_TARGETS.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => handleAgentFocus(agent.window, agent.pane)}
                  className={`${focusRing} flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-900 hover:shadow-lg`}
                >
                  <div className="text-sm font-semibold text-gray-900">{agent.label}</div>
                  <span className="mt-3 text-xs font-medium text-gray-500">画面を開く</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="border-b border-gray-100 px-6 py-5 space-y-5">
        <section>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {windows.map((windowInfo) => {
              const isActive = windowInfo.index === selectedWindowIndex;
              return (
                <button
                  key={windowInfo.index}
                  type="button"
                  onClick={() => handleSelectWindow(windowInfo)}
                  className={`${focusRing} inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
                    isActive
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900'
                  }`}
                >
                  <span>{windowInfo.name}</span>
                  <span className="text-xs text-gray-400">{windowInfo.paneCount} 個</span>
                </button>
              );
            })}
          </div>
        </section>

        {panes.length > 0 && selectedWindowIndex !== null && (
          <section className="flex flex-wrap gap-3 text-sm text-gray-600">
            {panes.map((paneInfo) => {
              const isActive = selectedPane?.paneIndex === paneInfo.paneIndex;
              return (
                <button
                  key={paneInfo.paneIndex}
                  type="button"
                  onClick={() => handleSelectPane(paneInfo)}
                  className={`${focusRing} inline-flex items-center gap-2 rounded-lg border px-4 py-2 transition ${
                    isActive
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900'
                  }`}
                >
                  <span>画面 {paneInfo.paneIndex + 1}</span>
                  <span className="text-xs uppercase text-gray-400">{paneInfo.currentCommand || 'idle'}</span>
                </button>
              );
            })}
          </section>
        )}
      </div>

      <main className="flex-1 overflow-hidden px-6 pb-8 pt-4">
        {selectedPane ? (
          <div className="flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 px-6 py-4">
              <div className="font-mono text-sm text-gray-400">
                {selectedPane.windowIndex} › {selectedPane.paneIndex}
              </div>
              <button
                type="button"
                onClick={() => setAutoScroll((prev) => !prev)}
                className={`${focusRing} inline-flex items-center gap-2 rounded-full border border-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-gray-500`}
              >
                オートスクロール {autoScroll ? 'ON' : 'OFF'}
              </button>
            </div>

            <div
              ref={logContainerRef}
              className="flex-1 overflow-auto rounded-xl border border-gray-800 bg-gray-950 px-6 py-6"
            >
              <pre className="whitespace-pre-wrap break-words font-mono text-sm text-emerald-400">
                {paneContent || ''}
              </pre>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>よく使う操作</span>
                <button
                  type="button"
                  onClick={handleSendInterrupt}
                  className={`${focusRing} rounded-full border border-gray-300 px-3 py-1 text-xs transition hover:border-gray-900`}
                >
                  停止 (Ctrl+C)
                </button>
                <button
                  type="button"
                  onClick={() => handleSendCommand('clear')}
                  className={`${focusRing} rounded-full border border-gray-300 px-3 py-1 text-xs transition hover:border-gray-900`}
                >
                  クリア
                </button>
                <button
                  type="button"
                  onClick={() => handleSendCommand('ls -la')}
                  className={`${focusRing} rounded-full border border-gray-300 px-3 py-1 text-xs transition hover:border-gray-900`}
                >
                  一覧表示
                </button>
                <button
                  type="button"
                  onClick={() => handleSendCommand('git status')}
                  className={`${focusRing} rounded-full border border-gray-300 px-3 py-1 text-xs transition hover:border-gray-900`}
                >
                  状態確認
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={commandInput}
                  onChange={(event) => setCommandInput(event.target.value)}
                  placeholder="コマンドを入力 (Enter で送信)"
                  className={`${focusRing} flex-1 rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm text-gray-900`}
                />
                <button
                  type="submit"
                  className={`${focusRing} inline-flex items-center justify-center rounded-lg border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800`}
                >
                  送信
                </button>
              </div>
              {commandHistory.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {commandHistory.map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => setCommandInput(cmd)}
                      className={`${focusRing} rounded-full border border-gray-200 px-3 py-1 transition hover:border-gray-900`}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            作業エリアと画面を選んでください。
          </div>
        )}
      </main>
    </div>
  );
}
