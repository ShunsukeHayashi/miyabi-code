import { useEffect, useState } from 'react';
import type { GitHubIssue, IssueFilter } from '../types/electron';

export default function IssuesView() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<IssueFilter>({ state: 'open' });
  const [searchQuery, setSearchQuery] = useState('');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [availableMilestones, setAvailableMilestones] = useState<string[]>([]);

  // Setup state
  const [token, setToken] = useState('');
  const [repository, setRepository] = useState('');

  useEffect(() => {
    loadIssues();
  }, [filter]);

  const loadIssues = async () => {
    try {
      const result = await window.electron.github.getIssues(filter);
      if (result.success && result.issues) {
        setIssues(result.issues);
        setError(null);
      } else {
        setError(result.error || 'Failed to load issues');
      }
    } catch (err) {
      setError('Failed to load issues: ' + (err as Error).message);
    }
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !repository) {
      setError('Token and repository are required');
      return;
    }

    try {
      const result = await window.electron.github.initialize(token, repository);
      if (result.success) {
        setIsInitialized(true);
        setError(null);

        // Load labels and milestones
        const labelsResult = await window.electron.github.getLabels();
        if (labelsResult.success && labelsResult.labels) {
          setAvailableLabels(labelsResult.labels);
        }

        const milestonesResult = await window.electron.github.getMilestones();
        if (milestonesResult.success && milestonesResult.milestones) {
          setAvailableMilestones(milestonesResult.milestones);
        }

        // Load initial issues
        await loadIssues();
      } else {
        setError(result.error || 'Failed to initialize GitHub service');
      }
    } catch (err) {
      setError('Failed to initialize: ' + (err as Error).message);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await window.electron.github.syncIssues();
      if (result.success) {
        setError(null);
        await loadIssues();
      } else {
        setError(result.error || 'Failed to sync issues');
      }
    } catch (err) {
      setError('Failed to sync: ' + (err as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilter((prev) => ({ ...prev, search: query || undefined }));
  };

  const handleStateFilter = (state: 'open' | 'closed' | 'all') => {
    setFilter((prev) => ({ ...prev, state }));
  };

  const handleLabelFilter = (label: string) => {
    setFilter((prev) => {
      const currentLabels = prev.labels || [];
      const hasLabel = currentLabels.includes(label);
      return {
        ...prev,
        labels: hasLabel
          ? currentLabels.filter((l) => l !== label)
          : [...currentLabels, label],
      };
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStateColor = (state: string) => {
    return state === 'open' ? 'text-green-500' : 'text-purple-500';
  };

  const getStateBg = (state: string) => {
    return state === 'open' ? 'bg-green-500/10' : 'bg-purple-500/10';
  };

  // Setup UI if not initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-full max-w-md p-6 bg-background-light rounded-lg border border-background-lighter">
          <h2 className="text-2xl font-extralight mb-4">Initialize GitHub Integration</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-sm text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleInitialize} className="space-y-4">
            <div>
              <label className="block text-sm text-foreground-muted mb-2">
                GitHub Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full px-3 py-2 bg-background border border-background-lighter rounded text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-foreground-muted">
                Personal access token with <code>repo</code> scope
              </p>
            </div>

            <div>
              <label className="block text-sm text-foreground-muted mb-2">
                Repository
              </label>
              <input
                type="text"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                placeholder="owner/repo"
                className="w-full px-3 py-2 bg-background border border-background-lighter rounded text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-foreground-muted">
                Format: <code>owner/repository</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Connect to GitHub
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="h-full flex flex-col">
      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search issues..."
          className="flex-1 px-3 py-2 bg-background-light border border-background-lighter rounded text-sm focus:outline-none focus:border-blue-500"
        />

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isSyncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          {(['all', 'open', 'closed'] as const).map((state) => (
            <button
              key={state}
              onClick={() => handleStateFilter(state)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filter.state === state
                  ? 'bg-blue-500 text-white'
                  : 'bg-background-light hover:bg-background-lighter'
              }`}
            >
              {state.charAt(0).toUpperCase() + state.slice(1)}
            </button>
          ))}
        </div>

        {availableLabels.length > 0 && (
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-foreground-muted">Labels:</span>
            {availableLabels.slice(0, 5).map((label) => {
              const isActive = filter.labels?.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => handleLabelFilter(label)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-background-light border border-background-lighter hover:bg-background-lighter'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div className="ml-auto text-xs text-foreground-muted">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 flex gap-4">
        {/* Sidebar - Issues List */}
        <div className="w-96 bg-background-light rounded-lg border border-background-lighter overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {issues.length === 0 ? (
              <div className="p-6 text-center text-foreground-muted">
                <p>No issues found</p>
                <p className="text-xs mt-2">Try adjusting your filters or sync from GitHub</p>
              </div>
            ) : (
              <div className="divide-y divide-background-lighter">
                {issues.map((issue) => (
                  <button
                    key={issue.number}
                    onClick={() => setSelectedIssue(issue)}
                    className={`w-full p-4 text-left hover:bg-background transition-colors ${
                      selectedIssue?.number === issue.number ? 'bg-background' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">#{issue.number}</span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${getStateBg(
                              issue.state
                            )} ${getStateColor(issue.state)}`}
                          >
                            {issue.state}
                          </span>
                          {issue.pull_request && (
                            <span className="text-xs text-purple-500">PR</span>
                          )}
                        </div>
                        <h3 className="text-sm mb-1 line-clamp-2">{issue.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                          <span>{formatDate(issue.updated_at)}</span>
                          {issue.comments > 0 && <span>💬 {issue.comments}</span>}
                        </div>
                      </div>
                    </div>

                    {issue.labels.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {issue.labels.slice(0, 3).map((label) => (
                          <span
                            key={label}
                            className="px-2 py-0.5 text-xs bg-background-lighter rounded"
                          >
                            {label}
                          </span>
                        ))}
                        {issue.labels.length > 3 && (
                          <span className="px-2 py-0.5 text-xs text-foreground-muted">
                            +{issue.labels.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Issue Details */}
        <div className="flex-1 bg-background-light rounded-lg border border-background-lighter overflow-hidden flex flex-col">
          {selectedIssue ? (
            <>
              {/* Issue Header */}
              <div className="p-6 border-b border-background-lighter">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-foreground-muted">#{selectedIssue.number}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded ${getStateBg(
                          selectedIssue.state
                        )} ${getStateColor(selectedIssue.state)}`}
                      >
                        {selectedIssue.state}
                      </span>
                      {selectedIssue.pull_request && (
                        <span className="px-2 py-1 text-xs bg-purple-500/10 text-purple-500 rounded">
                          Pull Request
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-extralight">{selectedIssue.title}</h1>
                  </div>
                  <a
                    href={selectedIssue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-background-lighter rounded hover:bg-background transition-colors"
                  >
                    View on GitHub ↗
                  </a>
                </div>

                <div className="flex items-center gap-4 text-sm text-foreground-muted">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedIssue.user.avatar_url}
                      alt={selectedIssue.user.login}
                      className="w-5 h-5 rounded-full"
                    />
                    <span>{selectedIssue.user.login}</span>
                  </div>
                  <span>opened {formatDate(selectedIssue.created_at)}</span>
                  {selectedIssue.closed_at && (
                    <span>closed {formatDate(selectedIssue.closed_at)}</span>
                  )}
                  {selectedIssue.comments > 0 && (
                    <span>💬 {selectedIssue.comments} comments</span>
                  )}
                </div>

                {(selectedIssue.labels.length > 0 ||
                  selectedIssue.assignees.length > 0 ||
                  selectedIssue.milestone) && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    {selectedIssue.labels.length > 0 && (
                      <div>
                        <div className="text-xs text-foreground-muted mb-1">Labels</div>
                        <div className="flex gap-1 flex-wrap">
                          {selectedIssue.labels.map((label) => (
                            <span
                              key={label}
                              className="px-2 py-1 text-xs bg-background-lighter rounded"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedIssue.assignees.length > 0 && (
                      <div>
                        <div className="text-xs text-foreground-muted mb-1">Assignees</div>
                        <div className="flex gap-1">
                          {selectedIssue.assignees.map((assignee) => (
                            <span
                              key={assignee}
                              className="px-2 py-1 text-xs bg-background-lighter rounded"
                            >
                              {assignee}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedIssue.milestone && (
                      <div>
                        <div className="text-xs text-foreground-muted mb-1">Milestone</div>
                        <span className="px-2 py-1 text-xs bg-background-lighter rounded">
                          {selectedIssue.milestone}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Issue Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedIssue.body ? (
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{selectedIssue.body}</pre>
                  </div>
                ) : (
                  <p className="text-foreground-muted italic">No description provided</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-foreground-muted">
              <div className="text-center">
                <p>Select an issue to view details</p>
                <p className="text-xs mt-2">Click on an issue in the sidebar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
