import { useState, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import {
  Command as CommandIcon,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  MonitorSmartphone,
  Search,
  Settings,
} from "lucide-react";

interface Command {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  action: () => void;
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (panel: string) => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = useMemo(
    () => [
      {
        id: "dashboard",
        title: "ダッシュボード概要",
        description: "システム全体の状態を俯瞰",
        icon: <LayoutDashboard size={18} />,
        action: () => onNavigate("dashboard"),
        keywords: ["dashboard", "overview", "ダッシュボード", "概要"],
      },
      {
        id: "monitor",
        title: "tmuxモニタ",
        description: "tmuxセッションの監視と制御",
        icon: <MonitorSmartphone size={18} />,
        action: () => onNavigate("monitor"),
        keywords: ["tmux", "monitor", "session", "モニタ", "セッション"],
      },
      {
        id: "worktrees",
        title: "Worktrees",
        description: "ワークツリーの状態を確認",
        icon: <GitBranch size={18} />,
        action: () => onNavigate("worktrees"),
        keywords: ["worktree", "graph", "ワークツリー", "git"],
      },
      {
        id: "issues",
        title: "Issue ダッシュボード",
        description: "課題の優先度と進捗を追跡",
        icon: <ListTodo size={18} />,
        action: () => onNavigate("issues"),
        keywords: ["issue", "board", "課題", "タスク"],
      },
      {
        id: "settings",
        title: "アプリ設定",
        description: "通知やエージェント設定を変更",
        icon: <Settings size={18} />,
        action: () => onNavigate("settings"),
        keywords: ["settings", "config", "設定", "preferences"],
      },
    ],
    [onNavigate]
  );

  const filteredCommands = commands.filter((cmd) => {
    if (!query) return true;
    const searchTerm = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchTerm) ||
      cmd.description.toLowerCase().includes(searchTerm) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(searchTerm))
    );
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center border-b border-gray-200 px-6 py-4">
          <Search size={20} className="mr-3 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="コマンドを入力... (↑↓で選択、Enterで実行、Escで閉じる)"
            className="flex-1 text-lg font-light outline-none placeholder-gray-400"
          />
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className={`w-full flex items-center px-6 py-3 transition-colors ${
                    index === selectedIndex
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
                    {cmd.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {cmd.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {cmd.description}
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <div className="text-xs text-gray-400 ml-4">⏎</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm font-light">コマンドが見つかりません</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>コマンドパレット</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1"><CommandIcon size={14} /> ⌘K / Ctrl+K</span>
              <span>↑↓ 選択</span>
              <span>⏎ 実行</span>
              <span>Esc 閉じる</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
