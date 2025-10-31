import { useState, useEffect } from "react";
import { GitBranch, Loader2, Search, ExternalLink } from "lucide-react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  updated_at: string;
  html_url: string;
}

interface RepositorySelectScreenProps {
  token: string;
  onNext: (repository: string) => void;
  onBack: () => void;
}

export const RepositorySelectScreen = ({
  token,
  onNext,
  onBack,
}: RepositorySelectScreenProps) => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRepos(repos);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredRepos(
        repos.filter(
          (repo) =>
            repo.name.toLowerCase().includes(query) ||
            repo.full_name.toLowerCase().includes(query) ||
            (repo.description && repo.description.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, repos]);

  const fetchRepositories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator",
        {
          headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRepos(data);
        setFilteredRepos(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch repositories");
      }
    } catch (err) {
      setError("Network error. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selected) {
      onNext(selected);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="max-w-4xl w-full p-8 bg-white rounded-2xl shadow-2xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Select Repository</h2>
          <p className="text-gray-600">
            Miyabi Agentが作業するGitHubリポジトリを選択してください
          </p>
        </div>

        {/* Search Box */}
        {!loading && repos.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-gray-600">Loading repositories...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchRepositories}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Repository List */}
        {!loading && !error && filteredRepos.length > 0 && (
          <div className="max-h-96 overflow-y-auto space-y-2 mb-6 border border-gray-200 rounded-lg p-2">
            {filteredRepos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => setSelected(repo.full_name)}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${
                    selected === repo.full_name
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/30"
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {repo.name}
                      </span>
                      {repo.private && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Private
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 ml-6">
                      {repo.full_name}
                    </div>
                    {repo.description && (
                      <div className="text-xs text-gray-400 mt-1 ml-6">
                        {repo.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1 ml-6">
                      Updated: {new Date(repo.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-purple-600 hover:text-purple-800 ml-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredRepos.length === 0 && repos.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            No repositories match your search.
          </div>
        )}

        {/* No Repositories */}
        {!loading && !error && repos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No repositories found. Create a repository on GitHub first.
            </p>
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-purple-600 hover:text-purple-800 hover:underline"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Create new repository on GitHub
            </a>
          </div>
        )}

        {/* Selected Repository Info */}
        {selected && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-900">
              <span className="font-semibold">Selected:</span> {selected}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onBack}
            className="flex-1 py-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="flex-1 py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
          >
            Continue →
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          選択したリポジトリはいつでも設定画面から変更できます
        </p>
      </div>
    </div>
  );
};
