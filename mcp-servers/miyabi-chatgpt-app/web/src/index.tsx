/**
 * Miyabi ChatGPT App - Widget Component
 *
 * React-based UI widget for ChatGPT Apps SDK
 */

import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";

// ============================================
// Type Definitions
// ============================================

interface OpenAIGlobal {
  toolInput: Record<string, unknown>;
  toolOutput: Record<string, unknown>;
  toolResponseMetadata: Record<string, unknown>;
  widgetState: Record<string, unknown>;
  theme: "light" | "dark";
  displayMode: "inline" | "fullscreen" | "pip";
  locale: string;

  setWidgetState: (state: Record<string, unknown>) => Promise<void>;
  callTool: (name: string, args: Record<string, unknown>) => Promise<{ result: string }>;
  sendFollowUpMessage: (opts: { prompt: string }) => Promise<void>;
  openExternal: (opts: { href: string }) => Promise<void>;
  requestDisplayMode: (mode: string) => Promise<string>;
  notifyIntrinsicHeight: (height: number) => void;
}

declare global {
  interface Window {
    openai: OpenAIGlobal;
  }
}

interface Repo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string;
  updatedAt: string;
  language: string;
  stars: number;
}

interface Issue {
  number: number;
  title: string;
  state: string;
  labels: string[];
  createdAt: string;
}

interface PR {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  createdAt: string;
}

// ============================================
// Hooks
// ============================================

function useWidgetState<T>(initialState: T): [T, (updater: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const saved = window.openai?.widgetState as T | undefined;
    return saved ?? initialState;
  });

  const setAndPersist = useCallback((updater: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      window.openai?.setWidgetState(next as Record<string, unknown>);
      return next;
    });
  }, []);

  return [state, setAndPersist];
}

// ============================================
// Components
// ============================================

// Project Selector View
function ProjectSelector({ repos, currentProject, onSelect }: {
  repos: Repo[];
  currentProject: string | null;
  onSelect: (repo: Repo) => void;
}) {
  const [filter, setFilter] = useState("");
  const theme = window.openai?.theme || "light";

  const filtered = repos.filter(r =>
    r.fullName.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={`p-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Select Project</h2>
        {currentProject && (
          <p className="text-sm text-gray-500">
            Current: <span className="font-medium">{currentProject}</span>
          </p>
        )}
      </div>

      <input
        type="text"
        placeholder="Filter repositories..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className={`w-full p-2 mb-4 rounded border ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-gray-50 border-gray-200"
        }`}
      />

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.map((repo) => (
          <button
            key={repo.id}
            onClick={() => onSelect(repo)}
            className={`w-full p-3 rounded border text-left transition-colors ${
              currentProject === repo.fullName
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                : theme === "dark"
                  ? "border-gray-700 hover:border-gray-600 hover:bg-gray-800"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{repo.fullName}</div>
                {repo.description && (
                  <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {repo.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {repo.language && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    {repo.language}
                  </span>
                )}
                <span>{repo.stars}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Dashboard View
function Dashboard({ project, stats, issues, prs }: {
  project: string;
  stats: { openIssues: number; stars: number; forks: number; language: string };
  issues: Issue[];
  prs: PR[];
}) {
  const theme = window.openai?.theme || "light";

  const handleExecuteAgent = async (agent: string, issueNumber?: number) => {
    await window.openai.callTool("execute_agent", {
      agent,
      issueNumber
    });
  };

  const handleAskAbout = async (topic: string) => {
    await window.openai.sendFollowUpMessage({
      prompt: `Tell me more about ${topic} in this project`
    });
  };

  return (
    <div className={`p-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">{project}</h2>
          <div className="flex gap-4 text-sm text-gray-500 mt-1">
            <span>{stats.openIssues} issues</span>
            <span>{stats.stars} stars</span>
            <span>{stats.forks} forks</span>
            {stats.language && <span>{stats.language}</span>}
          </div>
        </div>
        <button
          onClick={() => window.openai.callTool("list_repos", {})}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50"
        >
          Switch
        </button>
      </div>

      {/* Agent Actions */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {["codegen", "review", "issue", "pr"].map((agent) => (
            <button
              key={agent}
              onClick={() => handleExecuteAgent(agent)}
              className={`px-3 py-1.5 text-sm rounded ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {agent.charAt(0).toUpperCase() + agent.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Issues */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Open Issues ({issues.length})</h3>
        <div className="space-y-2">
          {issues.slice(0, 5).map((issue) => (
            <div
              key={issue.number}
              className={`p-2 rounded border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-gray-500 mr-2">#{issue.number}</span>
                  <span className="font-medium">{issue.title}</span>
                </div>
                <button
                  onClick={() => handleExecuteAgent("codegen", issue.number)}
                  className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  CodeGen
                </button>
              </div>
              {issue.labels.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {issue.labels.map((label) => (
                    <span
                      key={label}
                      className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pull Requests */}
      <div>
        <h3 className="text-sm font-medium mb-2">Open PRs ({prs.length})</h3>
        <div className="space-y-2">
          {prs.slice(0, 5).map((pr) => (
            <div
              key={pr.number}
              className={`p-2 rounded border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-gray-500 mr-2">#{pr.number}</span>
                  <span className="font-medium">{pr.title}</span>
                  {pr.draft && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                      Draft
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleExecuteAgent("review", pr.number)}
                  className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main App
function App() {
  const output = window.openai?.toolOutput as Record<string, unknown> | undefined;
  const [view, setView] = useWidgetState<"selector" | "dashboard">("selector");

  // Determine view based on tool output
  useEffect(() => {
    if (output?.repos) {
      setView("selector");
    } else if (output?.project && output?.stats) {
      setView("dashboard");
    }
  }, [output, setView]);

  const handleSelectRepo = async (repo: Repo) => {
    await window.openai.callTool("switch_project", {
      owner: repo.owner,
      repo: repo.name
    });
    // Then load the dashboard
    await window.openai.callTool("get_project_status", {});
  };

  // Error state
  if (output?.error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded">
        <strong>Error:</strong> {String(output.error)}
      </div>
    );
  }

  // Project Selector
  if (output?.repos) {
    return (
      <ProjectSelector
        repos={output.repos as Repo[]}
        currentProject={output.currentProject as string | null}
        onSelect={handleSelectRepo}
      />
    );
  }

  // Dashboard
  if (output?.project && output?.stats) {
    return (
      <Dashboard
        project={output.project as string}
        stats={output.stats as any}
        issues={(output.issues as Issue[]) || []}
        prs={(output.pullRequests as PR[]) || []}
      />
    );
  }

  // Loading/Empty state
  return (
    <div className="p-4 text-center text-gray-500">
      <p>Loading Miyabi...</p>
      <button
        onClick={() => window.openai.callTool("list_repos", {})}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Load Repositories
      </button>
    </div>
  );
}

// ============================================
// Mount
// ============================================

const rootElement = document.getElementById("miyabi-root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
