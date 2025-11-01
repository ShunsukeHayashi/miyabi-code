import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, Filter, Search } from "lucide-react";
import {
  listIssues,
  groupIssuesByState,
  getLabelEmoji,
  MIYABI_STATE_LABELS,
  type GitHubIssue,
  type IssueLabel,
} from "../lib/github-api";

export function IssueDashboard() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listIssues("open", selectedLabels);
      setIssues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(query) ||
        issue.body?.toLowerCase().includes(query) ||
        issue.number.toString().includes(query)
      );
    }
    return true;
  });

  const groupedIssues = groupIssuesByState(filteredIssues);

  // Get all unique labels from issues
  const allLabels = Array.from(
    new Set(issues.flatMap((issue) => issue.labels.map((l) => l.name)))
  );

  const toggleLabelFilter = (labelName: string) => {
    if (selectedLabels.includes(labelName)) {
      setSelectedLabels(selectedLabels.filter((l) => l !== labelName));
    } else {
      setSelectedLabels([...selectedLabels, labelName]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-light text-gray-900 mb-1">
              GitHub Issues
            </h2>
            <p className="text-sm font-light text-gray-500 mb-2">
              {filteredIssues.length} issues
            </p>
            <p className="text-xs text-gray-400">
              💡 Issueカードをクリックして詳細をGitHubで確認できます
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                showFilters
                  ? "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              }`}
              title="Toggle filters"
            >
              <Filter size={18} />
            </button>
            <button
              onClick={loadIssues}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues by title, body, or number..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-sm font-light transition-all duration-200"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-light text-gray-700 mb-3">
              Filter by Labels
            </h3>
            <div className="flex flex-wrap gap-2">
              {allLabels.slice(0, 20).map((labelName) => (
                <button
                  key={labelName}
                  onClick={() => toggleLabelFilter(labelName)}
                  className={`px-3 py-1 text-xs font-light rounded-lg transition-all duration-200 ${
                    selectedLabels.includes(labelName)
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-900"
                  }`}
                >
                  {getLabelEmoji(labelName)} {labelName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Issue Columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex p-6 space-x-4 min-w-max">
          {MIYABI_STATE_LABELS.map((stateLabel) => {
            const stateName = stateLabel.name.split(":")[1];
            const stateIssues = groupedIssues.get(stateName) || [];

            return (
              <div key={stateLabel.name} className="w-80 flex-shrink-0">
                {/* Column Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-light text-gray-900 mb-1">
                    {stateLabel.displayName}
                  </h3>
                  <p className="text-xs font-light text-gray-500">
                    {stateIssues.length} issues
                  </p>
                </div>

                {/* Issue Cards */}
                <div className="space-y-3">
                  {stateIssues.map((issue) => (
                    <IssueCard key={issue.number} issue={issue} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Issue Card Component
 */
function IssueCard({ issue }: { issue: GitHubIssue }) {
  const openInBrowser = () => {
    window.open(issue.html_url, "_blank");
  };

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-900 transition-all duration-200 cursor-pointer group">
      {/* Issue Number & Link */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-light text-gray-500">#{issue.number}</span>
        <button
          onClick={openInBrowser}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-900"
        >
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Issue Title */}
      <h4 className="text-sm font-light text-gray-900 mb-3 line-clamp-2">
        {issue.title}
      </h4>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {issue.labels.slice(0, 3).map((label) => (
            <LabelChip key={label.name} label={label} />
          ))}
          {issue.labels.length > 3 && (
            <span className="text-xs text-gray-400">
              +{issue.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Assignees */}
      {issue.assignees.length > 0 && (
        <div className="flex items-center space-x-1">
          <span className="text-xs font-light text-gray-400">Assigned:</span>
          <span className="text-xs font-light text-gray-700">
            {issue.assignees.join(", ")}
          </span>
        </div>
      )}

      {/* Updated Time */}
      <div className="mt-2 text-xs font-light text-gray-400">
        Updated {formatRelativeTime(issue.updated_at)}
      </div>
    </div>
  );
}

/**
 * Label Chip Component
 */
function LabelChip({ label }: { label: IssueLabel }) {
  return (
    <span
      className="px-2 py-0.5 text-xs font-light rounded"
      style={{
        backgroundColor: `#${label.color}20`,
        color: `#${label.color}`,
        border: `1px solid #${label.color}40`,
      }}
    >
      {getLabelEmoji(label.name)} {label.name}
    </span>
  );
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
export default IssueDashboard;
