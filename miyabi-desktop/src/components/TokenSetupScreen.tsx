import { useState } from "react";
import { ExternalLink, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface TokenSetupScreenProps {
  onNext: (token: string) => void;
  onBack: () => void;
}

export const TokenSetupScreen = ({ onNext, onBack }: TokenSetupScreenProps) => {
  const [token, setToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");

  const validateToken = async () => {
    if (!token.trim()) {
      setIsValid(null);
      setError("");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsValid(true);
        setError("");
      } else {
        setIsValid(false);
        const data = await response.json();
        setError(data.message || "Invalid token");
      }
    } catch (err) {
      setIsValid(false);
      setError("Failed to validate token. Check your internet connection.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = () => {
    if (isValid && token.trim()) {
      onNext(token);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl p-8 bg-white rounded-2xl shadow-2xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">GitHub Token Setup</h2>
          <p className="text-gray-600">
            Miyabi DesktopはGitHub APIを使用してIssueを管理します。
            <br />
            Personal Access Tokenを作成してください。
          </p>
        </div>

        {/* Required Scopes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3 text-gray-900">
            必要な権限 (Scopes):
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <div>
                <span className="font-medium">repo</span>
                <span className="text-sm text-gray-600 ml-2">
                  (Full control of private repositories)
                </span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <div>
                <span className="font-medium">workflow</span>
                <span className="text-sm text-gray-600 ml-2">
                  (Update GitHub Action workflows)
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* Token Input */}
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-gray-700">
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setIsValid(null);
              setError("");
            }}
            onBlur={validateToken}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Validation Status */}
          {isValidating && (
            <div className="flex items-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Validating token...</span>
            </div>
          )}

          {isValid === true && (
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              <span>Token is valid</span>
            </div>
          )}

          {isValid === false && (
            <div className="flex items-center text-sm text-red-600">
              <XCircle className="w-4 h-4 mr-2" />
              <span>{error || "Invalid token"}</span>
            </div>
          )}
        </div>

        {/* Create Token Link */}
        <a
          href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Miyabi Desktop"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline text-sm mb-6"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Create new token on GitHub
        </a>

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
            disabled={isValid !== true || isValidating}
            className="flex-1 py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
          >
            Continue →
          </button>
        </div>

        {/* Security Note */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          🔒 Your token is stored securely and never shared with external
          services.
        </p>
      </div>
    </div>
  );
};
