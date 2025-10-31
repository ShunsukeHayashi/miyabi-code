import { useState } from "react";
import { WelcomeScreen } from "./WelcomeScreen";
import { TokenSetupScreen } from "./TokenSetupScreen";
import { RepositorySelectScreen } from "./RepositorySelectScreen";
import { invoke } from "@tauri-apps/api/core";

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard = ({ onComplete }: SetupWizardProps) => {
  const [currentStep, setCurrentStep] = useState<"welcome" | "token" | "repo" | "complete">("welcome");
  const [githubToken, setGithubToken] = useState<string>("");
  const [repository, setRepository] = useState<string>("");

  const handleWelcomeComplete = () => {
    setCurrentStep("token");
  };

  const handleTokenComplete = async (token: string) => {
    setGithubToken(token);

    // Save token to Tauri secure storage
    try {
      await invoke("save_github_token", { token });
      // Go to repository selection
      setCurrentStep("repo");
    } catch (error) {
      console.error("Failed to save token:", error);
      // Still proceed to repo selection
      setCurrentStep("repo");
    }
  };

  const handleRepositoryComplete = async (repo: string) => {
    setRepository(repo);

    // Save repository to Tauri storage
    try {
      await invoke("save_repository", { repository: repo });
      setCurrentStep("complete");
    } catch (error) {
      console.error("Failed to save repository:", error);
      // Still proceed to complete
      setCurrentStep("complete");
    }
  };

  const handleSetupComplete = () => {
    onComplete();
  };

  if (currentStep === "welcome") {
    return <WelcomeScreen onStart={handleWelcomeComplete} />;
  }

  if (currentStep === "token") {
    return (
      <TokenSetupScreen
        onNext={handleTokenComplete}
        onBack={() => setCurrentStep("welcome")}
      />
    );
  }

  if (currentStep === "repo") {
    return (
      <RepositorySelectScreen
        token={githubToken}
        onNext={handleRepositoryComplete}
        onBack={() => setCurrentStep("token")}
      />
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="max-w-2xl p-8 bg-white rounded-2xl shadow-2xl text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-4">Setup Complete!</h1>
          <p className="text-gray-600 mb-8">
            Miyabi Desktopの初期設定が完了しました。
          </p>
          <button
            onClick={handleSetupComplete}
            className="px-8 py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Start Using Miyabi →
          </button>
        </div>
      </div>
    );
  }

  // Future steps will be implemented here
  return null;
};
