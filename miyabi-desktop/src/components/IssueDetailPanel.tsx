import { useState, useEffect } from "react";
import { X, ExternalLink, CheckSquare, Square, GitBranch, Calendar, Clock } from "lucide-react";
import type { GitHubIssue } from "../lib/github-api";
import { fetchWorktreeGraph } from "../lib/worktree-api";
import type { WorktreeGraph, WorktreeGraphNode } from "../types/worktrees";

interface IssueDetailPanelProps {
  issue: GitHubIssue;
  onClose: () => void;
}

interface ChecklistItem {
  checked: boolean;
  text: string;
}

/**
 * Parse checklist items from markdown body
 */
function parseChecklist(body: string | undefined): ChecklistItem[] {
  if (!body) return [];

  const lines = body.split("\n");
  const checklistItems: ChecklistItem[] = [];

  for (const line of lines) {
    // Match markdown checklist syntax: - [ ] or - [x]
    const match = line.match(/^[\s-]*\[([x ])\]\s+(.+)/i);
    if (match) {
      checklistItems.push({
        checked: match[1].toLowerCase() === "x",
        text: match[2].trim(),
      });
    }
  }

  return checklistItems;
}

/**
 * Format body text by removing checklist items and trimming
 */
function formatBodyExcerpt(body: string | undefined, maxLength: number = 500): string {
  if (!body) return "No description provided.";

  // Remove checklist items
  const lines = body.split("\n").filter((line) => !line.match(/^[\s-]*\[[x ]\]/i));

  let text = lines.join("\n").trim();

  // Truncate if too long
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + "...";
  }

  return text || "No description provided.";
}

export function IssueDetailPanel({ issue, onClose }: IssueDetailPanelProps) {
  const [worktreeGraph, setWorktreeGraph] = useState<WorktreeGraph | null>(null);
  const [loadingWorktrees, setLoadingWorktrees] = useState(false);

  const checklistItems = parseChecklist(issue.body);
  const bodyExcerpt = formatBodyExcerpt(issue.body);

  useEffect(() => {
    loadWorktrees();
  }, [issue.number]);

  const loadWorktrees = async () => {
    setLoadingWorktrees(true);
    try {
      const graph = await fetchWorktreeGraph();
      setWorktreeGraph(graph);
    } catch (err) {
      console.error("Failed to load worktrees", err);
    } finally {
      setLoadingWorktrees(false);
    }
  };

  // Find related worktrees for this issue
  const relatedWorktrees = worktreeGraph?.nodes.filter((node): node is WorktreeGraphNode => {
    return node.kind === "worktree" && node.worktree.issue_number === issue.number;
  }) || [];

  const checkedCount = checklistItems.filter((item) => item.checked).length;
  const totalCount = checklistItems.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white border-l border-gray-200 shadow-2xl overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
        <div className="flex-1 pr-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-light text-gray-500">#{issue.number}</span>
            <span className={`px-2 py-0.5 text-xs font-light rounded ${
              issue.state === "open" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
            }`}>
              {issue.state}
            </span>
          </div>
          <h2 className="text-lg font-light text-gray-900 leading-tight">{issue.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Description */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <span>Description</span>
            <a
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg text-sm font-light text-gray-700 whitespace-pre-wrap">
            {bodyExcerpt}
          </div>
        </section>

        {/* Checklist */}
        {checklistItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Task Checklist
              </h3>
              <span className="text-xs font-light text-gray-500">
                {checkedCount} / {totalCount} ({progressPercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 transition-colors"
                >
                  {item.checked ? (
                    <CheckSquare size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square size={18} className="text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-sm font-light ${
                      item.checked ? "text-gray-400 line-through" : "text-gray-700"
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Labels */}
        {issue.labels.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Labels</h3>
            <div className="flex flex-wrap gap-2">
              {issue.labels.map((label) => (
                <span
                  key={label.name}
                  className="px-2 py-1 text-xs font-light rounded"
                  style={{
                    backgroundColor: `#${label.color}20`,
                    color: `#${label.color}`,
                    border: `1px solid #${label.color}40`,
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Related Worktrees */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <GitBranch size={16} className="mr-2" />
            Related Worktrees
          </h3>

          {loadingWorktrees ? (
            <p className="text-sm font-light text-gray-500">Loading worktrees...</p>
          ) : relatedWorktrees.length > 0 ? (
            <div className="space-y-2">
              {relatedWorktrees.map((node) => (
                <div
                  key={node.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {node.worktree.branch}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-light rounded ${
                        node.worktree.status === "active"
                          ? "bg-green-100 text-green-700"
                          : node.worktree.status === "locked"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {node.worktree.status}
                    </span>
                  </div>
                  <p className="text-xs font-light text-gray-500 mb-1">{node.worktree.path}</p>
                  {node.worktree.agent && (
                    <p className="text-xs font-light text-gray-600">
                      Agent: {node.worktree.agent.agent_name || node.worktree.agent.agent_type}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-light text-gray-500">No related worktrees found.</p>
          )}
        </section>

        {/* Metadata */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h3>
          <div className="space-y-2 text-sm font-light text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar size={14} />
              <span>Created: {new Date(issue.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={14} />
              <span>Updated: {new Date(issue.updated_at).toLocaleString()}</span>
            </div>
            {issue.assignees.length > 0 && (
              <div className="flex items-start space-x-2">
                <span>Assignees:</span>
                <span>{issue.assignees.join(", ")}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
