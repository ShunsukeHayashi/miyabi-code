import { useState, useEffect } from "react";
import { GitPullRequest, CheckCircle, XCircle, Clock, AlertTriangle, GitMerge, ExternalLink } from "lucide-react";

interface PullRequest {
  number: number;
  title: string;
  state: "open" | "merged" | "closed";
  mergeable: string;
  labels: string[];
  assignedPane?: string;
  paneStatus?: "active" | "idle" | "completed";
  dependencies?: number[];
  blockedBy?: number[];
}

interface PaneInfo {
  id: string;
  index: number;
  assignment: string;
  currentTask: string;
  status: "active" | "idle" | "completed";
  contextRemaining: string;
}

export function PRReviewDashboard() {
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [panes, setPanes] = useState<PaneInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "blocked">("all");

  // Initialize with current PR data
  useEffect(() => {
    const initialPRs: PullRequest[] = [
      {
        number: 725,
        title: "WorkflowBuilder API",
        state: "open",
        mergeable: "CONFLICTING",
        labels: ["P1-High", "Type:Feature", "workflow"],
        assignedPane: "Pane 2",
        paneStatus: "active",
        blockedBy: [],
      },
      {
        number: 727,
        title: "Workflow State Persistence",
        state: "open",
        mergeable: "UNKNOWN",
        labels: ["P1-High", "Type:Feature", "workflow"],
        assignedPane: "Pane 2",
        paneStatus: "idle",
        dependencies: [725],
      },
      {
        number: 728,
        title: "Conditional Branching",
        state: "open",
        mergeable: "UNKNOWN",
        labels: ["P1-High", "Type:Feature", "workflow"],
        assignedPane: "Pane 2",
        paneStatus: "idle",
        dependencies: [727],
      },
      {
        number: 731,
        title: "Phase 1 Complete",
        state: "open",
        mergeable: "UNKNOWN",
        labels: ["P0-Critical", "Type:Feature", "workflow"],
        assignedPane: "Pane 3",
        paneStatus: "idle",
        dependencies: [725, 727, 728],
        blockedBy: [719],
      },
      {
        number: 730,
        title: "Error Handling Phase 2",
        state: "open",
        mergeable: "UNKNOWN",
        labels: ["P1-High", "Type:Refactor", "error-handling"],
        assignedPane: "Pane 4",
        paneStatus: "idle",
      },
      {
        number: 736,
        title: "Error Handling Phase 3.1",
        state: "open",
        mergeable: "UNKNOWN",
        labels: ["P1-High", "Type:Refactor", "error-handling"],
        assignedPane: "Pane 4",
        paneStatus: "idle",
        dependencies: [730],
      },
      {
        number: 739,
        title: "Error Handling Phase 3.2",
        state: "open",
        mergeable: "UNKNOWN",
        labels: ["P2-Medium", "Type:Refactor", "error-handling"],
        paneStatus: "idle",
        dependencies: [736],
      },
      {
        number: 713,
        title: "tree-sitter Migration",
        state: "open",
        mergeable: "CONFLICTING",
        labels: ["P2-Medium", "Type:Fix", "dependencies"],
      },
      {
        number: 720,
        title: "IssueDetailPanel",
        state: "open",
        mergeable: "UNKNOWN",
        labels: ["P2-Medium", "Type:Feature", "desktop"],
      },
      {
        number: 722,
        title: "Omega System Phase 1",
        state: "open",
        mergeable: "UNKNOWN",
        labels: ["P1-High", "Type:Feature", "omega-system"],
      },
      {
        number: 738,
        title: "Workflow Testing",
        state: "open",
        mergeable: "CONFLICTING",
        labels: ["P1-High", "Type:Test", "workflow"],
      },
    ];

    const initialPanes: PaneInfo[] = [
      {
        id: "%10",
        index: 2,
        assignment: "Workflow PRs",
        currentTask: "Reviewing PR #725 (found dependency bug)",
        status: "active",
        contextRemaining: "83%",
      },
      {
        id: "%7",
        index: 3,
        assignment: "Issue #719 Implementation",
        currentTask: "Implementing execute_workflow() - 9 todos remaining",
        status: "active",
        contextRemaining: "11%",
      },
      {
        id: "%11",
        index: 4,
        assignment: "Error Handling PRs",
        currentTask: "Checking PR #729, #730, #736",
        status: "active",
        contextRemaining: "N/A",
      },
      {
        id: "%63",
        index: 5,
        assignment: "PR Triage",
        currentTask: "Successfully merged #726, #729, #737",
        status: "completed",
        contextRemaining: "0%",
      },
    ];

    setPRs(initialPRs);
    setPanes(initialPanes);
    setLoading(false);
  }, []);

  const getStatusIcon = (pr: PullRequest) => {
    if (pr.state === "merged") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (pr.state === "closed") return <XCircle className="w-4 h-4 text-red-500" />;
    if (pr.mergeable === "CONFLICTING") return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (pr.blockedBy && pr.blockedBy.length > 0) return <Clock className="w-4 h-4 text-orange-500" />;
    return <GitPullRequest className="w-4 h-4 text-blue-500" />;
  };

  const getPaneStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredPRs = prs.filter((pr) => {
    if (filter === "active") return pr.paneStatus === "active";
    if (filter === "blocked") return pr.blockedBy && pr.blockedBy.length > 0;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading PR Review Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <GitMerge className="w-6 h-6 text-purple-400" />
          <h1 className="text-xl font-bold">PR Review Orchestra</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <span className="font-semibold text-white">{prs.filter((pr) => pr.state === "open").length}</span> open
            <span className="mx-2">·</span>
            <span className="font-semibold text-green-400">{prs.filter((pr) => pr.state === "merged").length}</span> merged
            <span className="mx-2">·</span>
            <span className="font-semibold text-yellow-400">{prs.filter((pr) => pr.mergeable === "CONFLICTING").length}</span> conflicts
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 p-4 border-b border-slate-700">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all" ? "bg-purple-600 text-white" : "bg-slate-800 text-gray-300 hover:bg-slate-700"
          }`}
        >
          All PRs ({prs.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "active" ? "bg-purple-600 text-white" : "bg-slate-800 text-gray-300 hover:bg-slate-700"
          }`}
        >
          Active ({prs.filter((pr) => pr.paneStatus === "active").length})
        </button>
        <button
          onClick={() => setFilter("blocked")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "blocked" ? "bg-purple-600 text-white" : "bg-slate-800 text-gray-300 hover:bg-slate-700"
          }`}
        >
          Blocked ({prs.filter((pr) => pr.blockedBy && pr.blockedBy.length > 0).length})
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PR List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredPRs.map((pr) => (
            <div
              key={pr.number}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-purple-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(pr)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-400">#{pr.number}</span>
                      <h3 className="font-semibold">{pr.title}</h3>
                      <a
                        href={`https://github.com/customer-cloud/miyabi-private/pull/${pr.number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {pr.labels.map((label) => (
                        <span
                          key={label}
                          className="px-2 py-1 text-xs font-medium bg-slate-700 text-gray-300 rounded"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    {pr.assignedPane && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${getPaneStatusColor(pr.paneStatus || "idle")}`} />
                        <span className="text-sm text-gray-400">{pr.assignedPane}</span>
                      </div>
                    )}
                    {pr.dependencies && pr.dependencies.length > 0 && (
                      <div className="text-sm text-gray-400 mt-2">
                        Depends on: {pr.dependencies.map((dep) => `#${dep}`).join(", ")}
                      </div>
                    )}
                    {pr.blockedBy && pr.blockedBy.length > 0 && (
                      <div className="text-sm text-orange-400 mt-2">
                        ⚠️ Blocked by: #{pr.blockedBy.join(", #")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {pr.mergeable === "CONFLICTING" ? (
                    <span className="px-3 py-1 text-xs font-medium bg-yellow-900 text-yellow-200 rounded">
                      Conflicts
                    </span>
                  ) : pr.state === "open" ? (
                    <span className="px-3 py-1 text-xs font-medium bg-green-900 text-green-200 rounded">
                      Ready
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pane Status Sidebar */}
        <div className="w-80 border-l border-slate-700 overflow-y-auto p-4 space-y-3">
          <h2 className="text-lg font-semibold mb-4">Tmux Pane Status</h2>
          {panes.map((pane) => (
            <div
              key={pane.id}
              className="bg-slate-800 rounded-lg p-3 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getPaneStatusColor(pane.status)}`} />
                  <span className="font-mono text-sm font-semibold">Pane {pane.index}</span>
                </div>
                <span className="text-xs text-gray-400">{pane.contextRemaining}</span>
              </div>
              <div className="text-sm text-gray-300 font-medium mb-1">{pane.assignment}</div>
              <div className="text-xs text-gray-400">{pane.currentTask}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
