import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { safeInvoke, isTauriAvailable } from '../lib/tauri-utils';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  PlayCircle,
  StopCircle,
  RefreshCw,
  Zap,
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';

interface AutomationConfig {
  session_name: string;
  repo_root: string;
  task_file?: string;
  enable_claude_code: boolean;
  enable_codex: boolean;
  enable_monitoring: boolean;
  orchestrator_mode: boolean;
}

interface AutomationSession {
  session_name: string;
  claude_code_window?: number;
  codex_window?: number;
  monitoring_window?: number;
  orchestrator_window?: number;
  status: string;
}

interface AutomationReadiness {
  runtimeReady: boolean;
  configLoaded: boolean;
  repoRoot?: string | null;
  sessionName?: string | null;
  sessionExists: boolean;
  githubToken: boolean;
  githubRepository?: string | null;
  taskFile?: string | null;
  notes: string[];
  errors: string[];
}

type ReadinessStatus = 'ok' | 'warn' | 'error';

interface ReadinessItem {
  id: string;
  label: string;
  message: string;
  status: ReadinessStatus;
}

interface WindowOutput {
  name: string;
  output: string;
  icon: typeof TerminalIcon;
  color: string;
}

export function FullAutomationPanel() {
  const [session, setSession] = useState<AutomationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AutomationConfig>({
    session_name: 'miyabi-auto-dev',
    repo_root: '/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private',
    task_file: '',
    enable_claude_code: true,
    enable_codex: true,
    enable_monitoring: true,
    orchestrator_mode: true,
  });
  const [runtimeReady, setRuntimeReady] = useState(() => isTauriAvailable());
  const [windowOutputs, setWindowOutputs] = useState<WindowOutput[]>([]);
  const [showMonitor, setShowMonitor] = useState(false);
  const [readiness, setReadiness] = useState<AutomationReadiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const outputRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const refreshReadiness = useCallback(async () => {
    if (!runtimeReady) {
      setReadiness(null);
      return;
    }

    setReadinessLoading(true);
    try {
      const status = await safeInvoke<AutomationReadiness>('get_automation_readiness');
      setReadiness(status ?? null);
    } catch (err) {
      console.warn('Failed to fetch automation readiness:', err);
      setReadiness(null);
    } finally {
      setReadinessLoading(false);
    }
  }, [runtimeReady]);

  const friendlyError = useMemo(() => {
    if (!error) {
      return null;
    }

    if (error.includes('GITHUB_TOKEN')) {
      return 'Set `GITHUB_TOKEN` in your .env (or run `gh auth login`) so Miyabi Desktop can reach GitHub Issues.';
    }

    if (error.includes('does not exist')) {
      return 'The automation tmux session was terminated. Press “Start Full Automation” to spin up a fresh session.';
    }

    return null;
  }, [error]);

  const readinessItems = useMemo<ReadinessItem[]>(() => {
    if (!readiness) {
      return [];
    }

    const items: ReadinessItem[] = [
      {
        id: 'runtime',
        label: 'Desktop Runtime',
        message: readiness.runtimeReady
          ? 'Tauri backend is responding.'
          : 'Launch via `npm run tauri dev` to start the native runtime.',
        status: readiness.runtimeReady ? 'ok' : 'error',
      },
      {
        id: 'github-token',
        label: 'GitHub Token',
        message: readiness.githubToken
          ? 'Secure token detected.'
          : 'Set `GITHUB_TOKEN` in your .env or authenticate with `gh auth login`.',
        status: readiness.githubToken ? 'ok' : 'error',
      },
      {
        id: 'config',
        label: 'Automation Config',
        message: readiness.configLoaded
          ? 'Configuration loaded from .env.'
          : 'Could not load automation config from .env.',
        status: readiness.configLoaded ? 'ok' : 'error',
      },
      {
        id: 'session',
        label: 'Tmux Session',
        message: readiness.sessionExists
          ? `Existing session ${readiness.sessionName ?? ''} will be reused or cleaned up automatically.`
          : 'No conflicting tmux session detected.',
        status: readiness.sessionExists ? 'warn' : 'ok',
      },
    ];

    return items;
  }, [readiness]);

  const refreshIsBusy = readinessLoading || loading;

  const startDisabled =
    loading ||
    !runtimeReady ||
    (readiness ? !readiness.githubToken || !readiness.configLoaded : false);

  const startDisabledReason = useMemo(() => {
    if (loading) {
      return 'Automation is busy. Please wait.';
    }

    if (!runtimeReady) {
      return 'Desktop runtime not detected.';
    }

    if (readiness) {
      if (!readiness.githubToken) {
        return 'Set GITHUB_TOKEN in your .env (or run `gh auth login`).';
      }

      if (!readiness.configLoaded) {
        return 'Automation config missing. Check your .env values.';
      }
    }

    return undefined;
  }, [loading, runtimeReady, readiness]);

  const repoDisplay = readiness?.repoRoot ?? config.repo_root;
  const sessionDisplay = readiness?.sessionName ?? config.session_name;
  const taskFileDisplay = readiness?.taskFile ?? config.task_file;
  const githubRepoDisplay = readiness?.githubRepository ?? undefined;

  useEffect(() => {
    const available = isTauriAvailable();
    setRuntimeReady(available);

    if (!available) {
      setError('Full Automation requires the Tauri desktop runtime. Launch the app with `npm run tauri dev`.');
      setReadiness(null);
    }
  }, []);

  useEffect(() => {
    if (!runtimeReady) {
      return;
    }

    setError(null);
    void loadConfigFromEnv();
    void checkAutomationStatus();
    void refreshReadiness();
  }, [runtimeReady, refreshReadiness]);

  // Poll for status every 5 seconds
  useEffect(() => {
    if (!runtimeReady || !session) {
      return undefined;
    }

    const interval = setInterval(() => {
      void checkAutomationStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [session, runtimeReady]);

  useEffect(() => {
    if (!runtimeReady) {
      return;
    }

    void refreshReadiness();
  }, [runtimeReady, session?.session_name, refreshReadiness]);

  // Poll tmux window outputs every 2 seconds when session is active
  useEffect(() => {
    if (!runtimeReady || !session || !showMonitor) {
      return undefined;
    }

    const fetchWindowOutputs = async () => {
      try {
        const outputs: WindowOutput[] = [];

        // Fetch Claude Code output (window 0) with targeted pane
        if (session.claude_code_window !== undefined) {
          const output = await safeInvoke<string>('tmux_get_session_output', {
            sessionName: `${session.session_name}:${session.claude_code_window}`,
            lines: 100,
          });
          if (output) {
            outputs.push({
              name: 'Claude Code',
              output,
              icon: TerminalIcon,
              color: 'text-blue-400',
            });
          }
        }

        // Fetch Codex output (window 1) with targeted pane
        if (session.codex_window !== undefined) {
          const output = await safeInvoke<string>('tmux_get_session_output', {
            sessionName: `${session.session_name}:${session.codex_window}`,
            lines: 100,
          });
          if (output) {
            outputs.push({
              name: 'Codex',
              output,
              icon: TerminalIcon,
              color: 'text-purple-400',
            });
          }
        }

        // Fetch Orchestrator output (window 2)
        if (session.orchestrator_window !== undefined) {
          const output = await safeInvoke<string>('tmux_get_session_output', {
            sessionName: session.session_name,
            lines: 50,
          });
          if (output) {
            outputs.push({
              name: 'Orchestrator',
              output,
              icon: Zap,
              color: 'text-yellow-400',
            });
          }
        }

        // Fetch Monitor output (window 3)
        if (session.monitoring_window !== undefined) {
          const output = await safeInvoke<string>('tmux_get_session_output', {
            sessionName: session.session_name,
            lines: 50,
          });
          if (output) {
            outputs.push({
              name: 'Monitor',
              output,
              icon: RefreshCw,
              color: 'text-green-400',
            });
          }
        }

        setWindowOutputs(outputs);

        // Auto-scroll to bottom
        outputs.forEach((output) => {
          const ref = outputRefs.current[output.name];
          if (ref) {
            ref.scrollTop = ref.scrollHeight;
          }
        });
      } catch (err) {
        console.error('Failed to fetch tmux outputs:', err);

        // Critical error handling: Session doesn't exist
        if (String(err).includes('does not exist')) {
          console.warn('[Auto-Cleanup] Session no longer exists, clearing state and stopping polling');
          setSession(null);
          setError('Automation session ended or was killed externally. Click "Start Full Automation" to restart.');
          setShowMonitor(false);
          // Polling will stop automatically when session becomes null
        }
      }
    };

    void fetchWindowOutputs();
    const interval = setInterval(() => {
      void fetchWindowOutputs();
    }, 2000);

    return () => clearInterval(interval);
  }, [session, runtimeReady, showMonitor]);

  function ensureRuntime(message?: string): boolean {
    if (!runtimeReady) {
      setError(
        message ||
          'Full Automation is only available when the desktop runtime is running. Use `npm run tauri dev` to launch it.'
      );
      return false;
    }
    return true;
  }

  async function loadConfigFromEnv() {
    if (!ensureRuntime()) {
      return;
    }
    try {
      const loadedConfig = await safeInvoke<AutomationConfig>('load_automation_config_from_env');

      if (loadedConfig) {
        setConfig(loadedConfig);
        console.log('[Auto-Load] Loaded config from .env:', loadedConfig);
      }
    } catch (err) {
      console.warn('[Auto-Load] Could not load config from .env:', err);
      // Keep default config if loading fails
    }
  }

  async function checkAutomationStatus() {
    if (!ensureRuntime()) {
      return;
    }
    try {
      const status = await safeInvoke<AutomationSession>(
        'get_automation_status',
        { sessionName: config.session_name },
        { suppressErrors: true } // Suppress "session does not exist" errors
      );

      if (status) {
        setSession(status);
      } else {
        setSession(null);
      }
    } catch (err) {
      // Session doesn't exist - this is expected when no automation is running
      setSession(null);
    }
  }

  async function startAutomation() {
    if (!ensureRuntime()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if session already exists
      const exists = await safeInvoke<boolean>('tmux_check_session_exists', {
        sessionName: config.session_name,
      });

      // Auto-cleanup: kill existing session before starting
      if (exists) {
        console.log(`[Auto-Cleanup] Killing existing session: ${config.session_name}`);
        try {
          await safeInvoke('tmux_kill_session', {
            sessionName: config.session_name,
          });
          // Wait a bit for cleanup to complete
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (cleanupErr) {
          console.warn('[Auto-Cleanup] Failed to kill existing session:', cleanupErr);
        }
      }

      const result = await safeInvoke<AutomationSession>('start_full_automation', { config });

      if (result === null) {
        setError('Failed to start automation because the desktop backend is not available. Launch via `npm run tauri dev`.');
        return;
      }

      setSession(result);
      setShowMonitor(true); // Auto-show monitor when session starts
      void refreshReadiness();
    } catch (err) {
      setError(String(err));
      console.error('Failed to start automation:', err);
      void refreshReadiness();
    } finally {
      setLoading(false);
    }
  }

  async function stopAutomation() {
    if (!ensureRuntime()) {
      return;
    }

    if (!session) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await safeInvoke('stop_full_automation', {
        sessionName: session.session_name,
      });

      if (result === null) {
        setError('Unable to reach the desktop backend. Please relaunch the app with Tauri.');
        return;
      }

      setSession(null);
      setShowMonitor(false);
      void refreshReadiness();
    } catch (err) {
      setError(String(err));
      console.error('Failed to stop automation:', err);
      void refreshReadiness();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-500" />
            Full Automation Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Orchestrate Claude Code + Codex + Miyabi Agents for complete automation
          </p>
        </div>
        <Button
          onClick={() => {
            setError(null);
            if (!ensureRuntime()) {
              return;
            }
            void checkAutomationStatus();
            void loadConfigFromEnv();
            void refreshReadiness();
          }}
          variant="outline"
          size="sm"
          disabled={refreshIsBusy}
        >
          {refreshIsBusy ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Runtime availability notice */}
      {!runtimeReady && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-md">
          <p className="font-semibold">Desktop runtime not detected</p>
          <p className="text-sm mt-1">
            Launch Miyabi Desktop via <code className="bg-yellow-100 px-1 py-0.5 rounded">npm run tauri dev</code> to use full automation.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="error">
          <div>
            <AlertTitle>Automation Error</AlertTitle>
            <AlertDescription>
              <div className="text-sm leading-relaxed">{error}</div>
              {friendlyError && (
                <p className="mt-2 text-xs opacity-80">{friendlyError}</p>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {runtimeReady && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-blue-500" />
              Readiness Checklist
            </CardTitle>
            <CardDescription>
              Confirm everything is ready before launching the fully automated workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {readiness ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {readinessItems.map((item) => {
                    const Icon = item.status === 'ok' ? CheckCircle : AlertTriangle;
                    const iconClass =
                      item.status === 'ok'
                        ? 'text-green-600'
                        : item.status === 'warn'
                        ? 'text-amber-500'
                        : 'text-red-600';
                    const toneClasses =
                      item.status === 'ok'
                        ? 'border-green-200 bg-green-50'
                        : item.status === 'warn'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-red-200 bg-red-50';

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border px-4 py-3 shadow-sm transition-colors ${toneClasses}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-4 w-4 flex-shrink-0 ${iconClass}`} />
                          <div>
                            <p className="text-sm font-medium leading-snug">{item.label}</p>
                            <p className="mt-1 text-xs opacity-90 leading-relaxed">{item.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {readiness.errors.length > 0 && (
                  <Alert variant="error">
                    <AlertTitle>Needs attention</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {readiness.errors.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {readiness.notes.length > 0 && (
                  <Alert variant="default">
                    <AlertTitle>Heads-up</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {readiness.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking readiness...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      {session && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              Automation Active
            </CardTitle>
            <CardDescription>
              Session: <code className="bg-green-100 px-1 py-0.5 rounded">{session.session_name}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {session.claude_code_window !== undefined && (
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Claude Code: Window {session.claude_code_window}</span>
                </div>
              )}
              {session.codex_window !== undefined && (
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Codex: Window {session.codex_window}</span>
                </div>
              )}
              {session.orchestrator_window !== undefined && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">Orchestrator: Window {session.orchestrator_window}</span>
                </div>
              )}
              {session.monitoring_window !== undefined && (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Monitor: Window {session.monitoring_window}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Panel */}
      {!session && (
        <Card>
          <CardHeader>
            <CardTitle>Automation Configuration</CardTitle>
            <CardDescription>Configure the automation session before starting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Session Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Session Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="miyabi-auto-dev"
                value={config.session_name}
                onChange={(e) => setConfig({ ...config, session_name: e.target.value })}
              />
            </div>

            {/* Repository Root */}
            <div>
              <label className="block text-sm font-medium mb-2">Repository Root</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
                value={config.repo_root}
                onChange={(e) => setConfig({ ...config, repo_root: e.target.value })}
              />
            </div>

            {/* Task File (Optional) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Task File (Optional)
                <span className="text-xs text-muted-foreground ml-2">
                  Leave empty for default
                </span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="tasks/auto-dev-tasks.md"
                value={config.task_file || ''}
                onChange={(e) => setConfig({ ...config, task_file: e.target.value || undefined })}
              />
            </div>

            {/* Feature Toggles */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-3">Enable Features</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enable_claude_code}
                    onChange={(e) => setConfig({ ...config, enable_claude_code: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Claude Code (AI Coding Agent)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enable_codex}
                    onChange={(e) => setConfig({ ...config, enable_codex: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Codex Task Runner</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.orchestrator_mode}
                    onChange={(e) => setConfig({ ...config, orchestrator_mode: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Orchestrator Mode (Manage All Agents)</span>
                  <Badge variant="default" className="bg-yellow-500">Recommended</Badge>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enable_monitoring}
                    onChange={(e) => setConfig({ ...config, enable_monitoring: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Monitoring Dashboard (4-pane view)</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Buttons */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-3">
          {!session ? (
            <Button
              onClick={startAutomation}
              disabled={startDisabled}
              size="lg"
              className="flex-1"
              title={startDisabledReason}
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Full Automation
            </Button>
          ) : (
            <>
              <Button
                onClick={stopAutomation}
                disabled={loading}
                variant="destructive"
                size="lg"
                className="flex-1"
              >
                <StopCircle className="w-5 h-5 mr-2" />
                Stop Automation
              </Button>
              <Button
                onClick={() => setShowMonitor(!showMonitor)}
                variant="outline"
                size="lg"
              >
                {showMonitor ? (
                  <>
                    <Minimize2 className="w-5 h-5 mr-2" />
                    Hide Monitor
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-5 h-5 mr-2" />
                    Show Real-Time Monitor
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  const command = `tmux attach -t ${session.session_name}`;
                  navigator.clipboard.writeText(command);
                  alert(`Command copied to clipboard:\n${command}\n\nPaste this in your terminal to attach.`);
                }}
                variant="outline"
                size="lg"
              >
                <TerminalIcon className="w-5 h-5 mr-2" />
                Attach to Session
              </Button>
            </>
          )}
        </div>
        {!session && startDisabled && startDisabledReason && (
          <p className="text-xs text-muted-foreground">{startDisabledReason}</p>
        )}
      </div>

      {/* Real-Time Monitor - 4-Pane Grid */}
      {session && showMonitor && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              Real-Time Monitor - 4 Window View
            </CardTitle>
            <CardDescription>
              Live output from all tmux windows (updates every 2 seconds)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 h-[600px]">
              {windowOutputs.map((windowOutput) => {
                const Icon = windowOutput.icon;
                return (
                  <div
                    key={windowOutput.name}
                    className="flex flex-col border rounded-lg overflow-hidden bg-gray-900"
                  >
                    {/* Header */}
                    <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                      <Icon className={`w-4 h-4 ${windowOutput.color}`} />
                      <span className={`font-semibold ${windowOutput.color}`}>
                        {windowOutput.name}
                      </span>
                      <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>

                    {/* Terminal Output */}
                    <div
                      ref={(el) => {
                        outputRefs.current[windowOutput.name] = el;
                      }}
                      className="flex-1 overflow-y-auto p-3 font-mono text-xs text-green-400 bg-black"
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {windowOutput.output || (
                        <div className="text-gray-500 italic">
                          Waiting for output...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {windowOutputs.length === 0 && (
                <div className="col-span-2 flex items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900 text-sm text-gray-400">
                  Waiting for automation output…
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            ✅ Environment Snapshot
          </CardTitle>
          <CardDescription>
            Values detected from your .env and automation defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="font-semibold">Repository root</p>
              <p className="mt-1 text-xs text-muted-foreground break-all">{repoDisplay}</p>
            </div>
            <div>
              <p className="font-semibold">Session name</p>
              <p className="mt-1 text-xs text-muted-foreground break-all">{sessionDisplay}</p>
            </div>
            {githubRepoDisplay && (
              <div>
                <p className="font-semibold">GitHub repository</p>
                <p className="mt-1 text-xs text-muted-foreground break-all">{githubRepoDisplay}</p>
              </div>
            )}
            {taskFileDisplay && (
              <div className="sm:col-span-2">
                <p className="font-semibold">Task file</p>
                <p className="mt-1 text-xs text-muted-foreground break-all">{taskFileDisplay}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Update the values above from your `.env` file if you need to point automation at a different worktree or repository.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            Full Automation mode creates a tmux session with multiple windows:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Claude Code</strong>: AI-powered code implementation</li>
            <li><strong>Codex</strong>: GitHub Codex task runner for additional AI assistance</li>
            <li><strong>Orchestrator</strong>: Coordinates all Miyabi agents automatically</li>
            <li><strong>Monitoring</strong>: Real-time dashboard showing agent status, git changes, and logs</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            The orchestrator will manage all agents, automatically processing Issues (sorted by priority),
            creating PRs, and deploying changes with zero human intervention.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
