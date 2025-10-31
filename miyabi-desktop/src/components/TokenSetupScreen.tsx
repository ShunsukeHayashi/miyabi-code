import { useState } from "react";
import { Key, ExternalLink, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface TokenSetupScreenProps {
  onNext: (token: string) => void;
  onBack: () => void;
}

export const TokenSetupScreen = ({ onNext, onBack }: TokenSetupScreenProps) => {
  const [token, setToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const validateToken = async () => {
    if (!token.trim()) {
      setIsValid(null);
      setErrorMessage("");
      return;
    }

    // Basic format check
    if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
      setIsValid(false);
      setErrorMessage("Token must start with 'ghp_' or 'github_pat_'");
      return;
    }

    setIsValidating(true);
    setErrorMessage("");

    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setIsValid(true);
        setErrorMessage(`Authenticated as @${userData.login}`);
      } else if (response.status === 401) {
        setIsValid(false);
        setErrorMessage("Invalid token - authentication failed");
      } else {
        setIsValid(false);
        setErrorMessage(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setIsValid(false);
      setErrorMessage(
        error instanceof Error ? error.message : "Network error - please check your connection"
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = () => {
    if (isValid === true && token.trim()) {
      onNext(token.trim());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="max-w-2xl w-full p-8 bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <Key className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">GitHub Token Setup</h1>
            <p className="text-sm text-gray-500">Step 2 of 4</p>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Miyabi DesktopはGitHub APIを使用してIssueを管理します。
          Personal Access Tokenを作成して入力してください。
        </p>

        {/* Required Scopes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3 text-blue-900">必要な権限 (Scopes):</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>repo</strong> - Full control of private repositories
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>workflow</strong> - Update GitHub Action workflows
              </div>
            </li>
          </ul>
        </div>

        {/* Token Input */}
        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-700">
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setIsValid(null);
              setErrorMessage("");
            }}
            onBlur={validateToken}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoComplete="off"
          />

          {/* Validation Status */}
          {isValidating && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Loader2 className="animate-spin" size={16} />
              <span>Validating token...</span>
            </div>
          )}

          {isValid === true && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle2 size={16} />
              <span>{errorMessage || "Token is valid"}</span>
            </div>
          )}

          {isValid === false && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <XCircle size={16} />
              <span>{errorMessage || "Invalid token"}</span>
            </div>
          )}
        </div>

        {/* Create Token Link */}
        <a
          href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Miyabi%20Desktop"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 text-sm mb-8 hover:underline"
        >
          <ExternalLink size={16} />
          <span>Create new token on GitHub →</span>
        </a>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            disabled={isValid !== true || isValidating}
            className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Continue →
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-6 text-center">
          トークンはTauriのSecure Storageに安全に保存されます
        </p>
      </div>
    </div>
  );
};
