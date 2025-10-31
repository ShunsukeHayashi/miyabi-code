import { useState } from "react";
import { WelcomeScreen } from "./WelcomeScreen";

// LocalStorage key for setup completion state
const SETUP_COMPLETE_KEY = "miyabi_setup_complete";

// Helper functions for LocalStorage management
export const isSetupComplete = (): boolean => {
  return localStorage.getItem(SETUP_COMPLETE_KEY) === "true";
};

export const markSetupComplete = (): void => {
  localStorage.setItem(SETUP_COMPLETE_KEY, "true");
};

export const resetSetup = (): void => {
  localStorage.removeItem(SETUP_COMPLETE_KEY);
};

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard = ({ onComplete }: SetupWizardProps) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const handleStart = () => {
    // For Phase 3.1, we only have the welcome screen
    // Future phases will add more steps (GitHub token, repository selection, completion)
    // For now, just complete the setup
    setCurrentStep(2);
    onComplete();
  };

  // Render current step
  switch (currentStep) {
    case 1:
      return <WelcomeScreen onStart={handleStart} />;
    default:
      return <WelcomeScreen onStart={handleStart} />;
  }
};

export default SetupWizard;
