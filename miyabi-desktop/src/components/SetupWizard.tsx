import { useState } from "react";
import { WelcomeScreen } from "./WelcomeScreen";
import { TokenSetupScreen } from "./TokenSetupScreen";
import { SetupCompleteScreen } from "./SetupCompleteScreen";
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
      // For now, go directly to complete
      // Future step: repo will be implemented in #647
      setCurrentStep("complete");
    } catch (error) {
      console.error("Failed to save token:", error);
      // Still proceed for now, but log the error
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

  if (currentStep === "complete") {
    return (
      <SetupCompleteScreen
        githubToken={githubToken}
        repository={repository}
        onFinish={handleSetupComplete}
      />
    );
  }

  // Future steps will be implemented here
  return null;
};
