import { useState, useEffect } from "react";
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
import { TerminalManager } from "./components/TerminalManager";
import { AgentExecutionPanel } from "./components/AgentExecutionPanel";
import { WorkflowDAGViewer } from "./components/WorkflowDAGViewer";
import { NarrationPlayer } from "./components/NarrationPlayer";
import { IssueDashboard } from "./components/IssueDashboard";
import { SettingsPanel } from "./components/SettingsPanel";
import { SetupWizard, isSetupComplete, markSetupComplete } from "./components/SetupWizard";
// Temporarily disabled due to firebase-admin incompatibility with browser
// import { DeploymentDashboard } from "./components/DeploymentDashboard";
// import { AutoMergeSettings } from "./components/AutoMergeSettings";
import { CommandPalette } from "./components/CommandPalette";
import "./App.css";
// import { Phase9Provider } from "./context/Phase9Context";

function App() {
  const [showWelcome, setShowWelcome] = useState(!isSetupComplete());
  const [activePanel, setActivePanel] = useState("dashboard");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Show setup wizard if not completed
  if (showWelcome) {
    return (
      <SetupWizard
        onComplete={() => {
          markSetupComplete();
          setShowWelcome(false);
        }}
      />
    );
  }

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
    //<Phase9Provider>
      <div className="flex h-screen bg-white text-gray-900">
      {/* Sidebar - Ultra Minimal */}
      <div className="w-20 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-8 space-y-8">
        <div className="text-3xl font-extralight text-gray-900">M</div>

        <nav className="flex-1 flex flex-col space-y-6">
          <button
            onClick={() => setActivePanel("dashboard")}
            className={`p-4 rounded-xl transition-all duration-200 ${
              activePanel === "dashboard"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title="エージェント実行 - AIエージェントを選択して実行"
          >
            <Bot size={24} strokeWidth={1.5} />
          </button>

          {/* Temporarily disabled due to firebase-admin incompatibility
          <button
            onClick={() => setActivePanel("deployment")}
            className={`p-4 rounded-xl transition-all duration-200 ${
              activePanel === "deployment"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title="Deployment Control"
          >
            <Rocket size={24} strokeWidth={1.5} />
          </button>
          */}

          <button
            onClick={() => setActivePanel("terminal")}
            className={`p-4 rounded-xl transition-all duration-200 ${
              activePanel === "terminal"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title="ターミナル - コマンド実行と詳細ログ確認"
          >
            <TerminalIcon size={24} strokeWidth={1.5} />
          </button>

          <button
            onClick={() => setActivePanel("workflow")}
            className={`p-4 rounded-xl transition-all duration-200 ${
              activePanel === "workflow"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title="ワークフローDAG - エージェントの実行フロー可視化"
          >
            <Network size={24} strokeWidth={1.5} />
          </button>

          <button
            onClick={() => setActivePanel("narration")}
            className={`p-4 rounded-xl transition-all duration-200 ${
              activePanel === "narration"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title="VOICEVOX音声 - Git履歴から音声ガイド生成"
          >
            <Volume2 size={24} strokeWidth={1.5} />
          </button>

          <button
            onClick={() => setActivePanel("issues")}
            className={`p-4 rounded-xl transition-all duration-200 ${
              activePanel === "issues"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title="GitHub Issues - Issue管理とカンバンボード"
          >
            <ListTodo size={24} strokeWidth={1.5} />
          </button>

          {/* Temporarily disabled due to firebase-admin incompatibility
          <button
            onClick={() => setActivePanel("auto-merge")}
            className={`p-4 rounded-xl transition-all duration-200 ${
              activePanel === "auto-merge"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title="Auto-Merge Settings"
          >
            <ShieldCheck size={24} strokeWidth={1.5} />
          </button>
          */}
        </nav>

        <button
          onClick={() => setActivePanel("settings")}
          className={`p-4 rounded-xl transition-all duration-200 ${
            activePanel === "settings"
              ? "bg-gray-900 text-white"
              : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          }`}
          title="Settings"
        >
          <Settings size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area - Breathable Space */}
        <div className="flex-1 overflow-auto">
          {activePanel === "dashboard" && <DashboardPanel />}
          {/* Temporarily disabled due to firebase-admin incompatibility */}
          {/* {activePanel === "deployment" && <DeploymentPanel />} */}
          {activePanel === "terminal" && <TerminalPanel />}
          {activePanel === "workflow" && <WorkflowPanel />}
          {activePanel === "narration" && <NarrationPanel />}
          {activePanel === "issues" && <IssuesPanel />}
          {/* {activePanel === "auto-merge" && <AutoMergePanel />} */}
          {activePanel === "settings" && <SettingsPanelWrapper />}
        </div>

        {/* Status Bar - Ultra Thin */}
        <div className="h-10 bg-gray-50 border-t border-gray-200 flex items-center px-6 text-xs font-light text-gray-500">
          <span>Agents: Idle</span>
          <span className="mx-3">·</span>
          <span>CPU: 12%</span>
          <span className="mx-3">·</span>
          <span>Memory: 2.3 GB</span>
          <span className="mx-3">·</span>
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="text-gray-400 hover:text-gray-900 transition-colors"
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
    //</Phase9Provider>
  );
}

function DashboardPanel() {
  return <AgentExecutionPanel />;
}

/* Temporarily disabled due to firebase-admin incompatibility
function DeploymentPanel() {
  return (
    <div className="h-full flex flex-col">
      <DeploymentDashboard />
    </div>
  );
}
*/

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

/* Temporarily disabled due to firebase-admin incompatibility
function AutoMergePanel() {
  return (
    <div className="h-full flex flex-col">
      <AutoMergeSettings />
    </div>
  );
}
*/

function SettingsPanelWrapper() {
  return (
    <div className="h-full flex flex-col">
      <SettingsPanel />
    </div>
  );
}

export default App;
