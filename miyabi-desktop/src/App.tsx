import { useState, useEffect, lazy, Suspense } from "react";
import {
  Terminal as TerminalIcon,
  Bot,
  Settings,
  Network,
  Volume2,
  ListTodo,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { CommandPalette } from "./components/CommandPalette";
import { PanelSkeleton } from "./components/PanelSkeleton";
import "./App.css";
import { Phase9Provider } from "./context/Phase9Context";

// Lazy-loaded panel components for code splitting
const DashboardOverview = lazy(() => import("./components/DashboardOverview").then(m => ({ default: m.DashboardOverview })));
const TerminalManager = lazy(() => import("./components/TerminalManager"));
const AgentExecutionPanel = lazy(() => import("./components/AgentExecutionPanel"));
const WorkflowDAGViewer = lazy(() => import("./components/WorkflowDAGViewer"));
const NarrationPlayer = lazy(() => import("./components/NarrationPlayer"));
const IssueDashboard = lazy(() => import("./components/IssueDashboard"));
const SettingsPanel = lazy(() => import("./components/SettingsPanel"));
const DeploymentDashboard = lazy(() => import("./components/DeploymentDashboard"));
const AutoMergeSettings = lazy(() => import("./components/AutoMergeSettings"));

function App() {
  const [activePanel, setActivePanel] = useState("dashboard");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Cmd/Ctrl + Shift + P for command palette (VS Code style)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "p") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Cmd/Ctrl + 1-6 for quick panel switching
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const panels = ["dashboard", "terminal", "workflow", "narration", "issues", "settings"];
        const num = parseInt(e.key);
        if (num >= 1 && num <= panels.length) {
          e.preventDefault();
          setActivePanel(panels[num - 1]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Phase9Provider>
      <div className="flex h-screen bg-white text-gray-900">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                   focus:z-50 focus:px-4 focus:py-2 focus:bg-gray-900 focus:text-white
                   focus:rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
      >
        Skip to main content
      </a>

      {/* Sidebar - Ultra Minimal */}
      <div className="w-sidebar bg-gray-50 border-r border-gray-200 flex flex-col items-center py-8 space-y-8">
        <div className="text-3xl font-extralight text-gray-900">M</div>

        <nav className="flex-1 flex flex-col space-y-6" aria-label="Main navigation">
          <button
            onClick={() => setActivePanel("dashboard")}
            className={`p-4 rounded-xl transition-all duration-default
                        focus:outline-none focus-visible:ring-2
                        focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${
              activePanel === "dashboard"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="ダッシュボード - システム概要とステータス"
            aria-current={activePanel === "dashboard" ? "page" : undefined}
            title="ダッシュボード"
          >
            <Bot size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <button
            onClick={() => setActivePanel("deployment")}
            className={`p-4 rounded-xl transition-all duration-default
                        focus:outline-none focus-visible:ring-2
                        focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${
              activePanel === "deployment"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="Deployment Control - デプロイ管理"
            aria-current={activePanel === "deployment" ? "page" : undefined}
            title="Deployment Control"
          >
            <Rocket size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <button
            onClick={() => setActivePanel("terminal")}
            className={`p-4 rounded-xl transition-all duration-default
                        focus:outline-none focus-visible:ring-2
                        focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${
              activePanel === "terminal"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="ターミナル - コマンド実行と詳細ログ確認"
            aria-current={activePanel === "terminal" ? "page" : undefined}
            title="ターミナル"
          >
            <TerminalIcon size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <button
            onClick={() => setActivePanel("workflow")}
            className={`p-4 rounded-xl transition-all duration-default
                        focus:outline-none focus-visible:ring-2
                        focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${
              activePanel === "workflow"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="ワークフローDAG - エージェントの実行フロー可視化"
            aria-current={activePanel === "workflow" ? "page" : undefined}
            title="ワークフローDAG"
          >
            <Network size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <button
            onClick={() => setActivePanel("narration")}
            className={`p-4 rounded-xl transition-all duration-default
                        focus:outline-none focus-visible:ring-2
                        focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${
              activePanel === "narration"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="VOICEVOX音声 - Git履歴から音声ガイド生成"
            aria-current={activePanel === "narration" ? "page" : undefined}
            title="VOICEVOX音声"
          >
            <Volume2 size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <button
            onClick={() => setActivePanel("issues")}
            className={`p-4 rounded-xl transition-all duration-default
                        focus:outline-none focus-visible:ring-2
                        focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${
              activePanel === "issues"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="GitHub Issues - Issue管理とカンバンボード"
            aria-current={activePanel === "issues" ? "page" : undefined}
            title="GitHub Issues"
          >
            <ListTodo size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <button
            onClick={() => setActivePanel("auto-merge")}
            className={`p-4 rounded-xl transition-all duration-default
                        focus:outline-none focus-visible:ring-2
                        focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${
              activePanel === "auto-merge"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="Auto-Merge Settings - 自動マージ設定"
            aria-current={activePanel === "auto-merge" ? "page" : undefined}
            title="Auto-Merge Settings"
          >
            <ShieldCheck size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </nav>

        <button
          onClick={() => setActivePanel("settings")}
          className={`p-4 rounded-xl transition-all duration-default
                      focus:outline-none focus-visible:ring-2
                      focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${
            activePanel === "settings"
              ? "bg-gray-900 text-white"
              : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          }`}
          aria-label="Settings - 設定"
          aria-current={activePanel === "settings" ? "page" : undefined}
          title="Settings"
        >
          <Settings size={24} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area - Breathable Space */}
        <div id="main-content" className="flex-1 overflow-auto">
          <Suspense fallback={<PanelSkeleton />}>
            {activePanel === "dashboard" && <DashboardPanel />}
            {activePanel === "deployment" && <DeploymentPanel />}
            {activePanel === "terminal" && <TerminalPanel />}
            {activePanel === "workflow" && <WorkflowPanel />}
            {activePanel === "narration" && <NarrationPanel />}
            {activePanel === "issues" && <IssuesPanel />}
            {activePanel === "auto-merge" && <AutoMergePanel />}
            {activePanel === "settings" && <SettingsPanelWrapper />}
          </Suspense>
        </div>

        {/* Status Bar - Ultra Thin */}
        <div
          className="h-status-bar bg-gray-50 border-t border-gray-200 flex items-center px-6 text-xs font-light text-gray-500"
          role="status"
          aria-live="polite"
          aria-label="Application status bar"
        >
          <span aria-label="Agent status">Agents: Idle</span>
          <span className="mx-3" aria-hidden="true">·</span>
          <span aria-label="CPU usage">CPU: 12%</span>
          <span className="mx-3" aria-hidden="true">·</span>
          <span aria-label="Memory usage">Memory: 2.3 GB</span>
          <span className="mx-3" aria-hidden="true">·</span>
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="text-gray-400 hover:text-gray-900 transition-colors
                       focus:outline-none focus-visible:ring-2
                       focus-visible:ring-offset-2 focus-visible:ring-gray-900
                       focus-visible:rounded"
            aria-label="Open command palette"
          >
            ⌘K でコマンドパレット
          </button>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(panel) => {
          setActivePanel(panel);
          setCommandPaletteOpen(false);
        }}
      />
      </div>
    </Phase9Provider>
  );
}

function DashboardPanel() {
  return <DashboardOverview />;
}

function DeploymentPanel() {
  return (
    <div className="h-full flex flex-col">
      <DeploymentDashboard />
    </div>
  );
}

function TerminalPanel() {
  return (
    <div className="h-full flex flex-col">
      <TerminalManager />
    </div>
  );
}

function WorkflowPanel() {
  return (
    <div className="h-full flex flex-col">
      <WorkflowDAGViewer />
    </div>
  );
}

function NarrationPanel() {
  return (
    <div className="h-full flex flex-col">
      <NarrationPlayer />
    </div>
  );
}

function IssuesPanel() {
  return (
    <div className="h-full flex flex-col">
      <IssueDashboard />
    </div>
  );
}

function AutoMergePanel() {
  return (
    <div className="h-full flex flex-col">
      <AutoMergeSettings />
    </div>
  );
}

function SettingsPanelWrapper() {
  return (
    <div className="h-full flex flex-col">
      <SettingsPanel />
    </div>
  );
}

export default App;
