import { useState, useEffect } from 'react';
import { createGeminiClient, UIGenerationRequest } from '../../lib/gemini/client';
import LoadingAnimation from './LoadingAnimation';
import DynamicRenderer from './DynamicRenderer';
import { apiClient } from '../../lib/api/client';

/**
 * Dynamic UI Orchestrator
 *
 * Coordinates the entire adaptive UI generation pipeline:
 * 1. Collect system data (agents, infrastructure, metrics)
 * 2. Send to Gemini 3 for UI generation
 * 3. Display loading animation
 * 4. Render generated UI
 *
 * This is the main entry point for The Adaptive Runtime system.
 */

type LoadingStage = 'collect' | 'analyze' | 'generate' | 'render';

interface DynamicUIOrchestratorProps {
  /** User prompt for UI generation */
  prompt?: string;
  /** Enable adaptive mode (regenerates UI based on data changes) */
  adaptive?: boolean;
  /** Callback when user triggers an action through generated UI */
  onAction?: (actionType: string, payload: any) => void;
}

export default function DynamicUIOrchestrator({
  prompt = 'Create an impactful, beautiful dashboard that visualizes the current system status',
  adaptive = false,
  onAction,
}: DynamicUIOrchestratorProps) {
  const [stage, setStage] = useState<LoadingStage>('collect');
  const [progress, setProgress] = useState(0);
  const [systemData, setSystemData] = useState<any>(null);
  const [generatedUI, setGeneratedUI] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Gemini client
  const geminiClient = createGeminiClient();

  /**
   * Stage 1: Collect System Data
   */
  const collectSystemData = async () => {
    setStage('collect');
    setProgress(10);

    try {
      // Fetch agents data
      const agents = await apiClient.getAgents();
      setProgress(30);

      // Fetch infrastructure status
      const infrastructure = await apiClient.getInfrastructureStatus();
      setProgress(50);

      // Fetch database status
      const database = await apiClient.getDatabaseStatus();
      setProgress(70);

      // Compile system data
      const data = {
        agents: agents.slice(0, 10), // Top 10 agents
        infrastructure,
        database,
        timestamp: new Date().toISOString(),
        userContext: {
          timeOfDay: new Date().getHours(),
          platform: navigator.platform,
        },
      };

      setSystemData(data);
      setProgress(100);

      return data;
    } catch (err) {
      console.error('[Orchestrator] Failed to collect data:', err);
      throw new Error('Data collection failed');
    }
  };

  /**
   * Stage 2-3: Analyze and Generate UI with Gemini 3
   */
  const generateAdaptiveUI = async (data: any) => {
    // Analysis stage
    setStage('analyze');
    setProgress(20);

    // Simulate analysis time (Gemini thinking)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setProgress(60);

    // Generation stage
    setStage('generate');
    setProgress(10);

    try {
      const request: UIGenerationRequest = {
        userPrompt: prompt,
        systemData: data,
        currentContext: {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      };

      const response = await geminiClient.generateUI(request);
      setProgress(100);

      console.log('[Orchestrator] UI Strategy:', response.ui_strategy);
      console.log('[Orchestrator] Suggested prompts:', response.suggested_next_prompts);

      return response.react_code;
    } catch (err) {
      console.error('[Orchestrator] UI generation failed:', err);
      throw new Error('UI generation failed');
    }
  };

  /**
   * Stage 4: Render UI
   */
  const renderUI = async (code: string) => {
    setStage('render');
    setProgress(50);

    // Simulate render preparation
    await new Promise((resolve) => setTimeout(resolve, 500));

    setGeneratedUI(code);
    setProgress(100);
  };

  /**
   * Main orchestration flow
   */
  useEffect(() => {
    const orchestrate = async () => {
      try {
        // Stage 1: Collect
        const data = await collectSystemData();

        // Wait for UI impact
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Stages 2-3: Analyze & Generate
        const code = await generateAdaptiveUI(data);

        // Wait for UI impact
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Stage 4: Render
        await renderUI(code);
      } catch (err: any) {
        setError(err.message);
        console.error('[Orchestrator] Pipeline failed:', err);
      }
    };

    orchestrate();

    // Adaptive mode: Re-orchestrate when data changes
    if (adaptive) {
      const interval = setInterval(orchestrate, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [prompt, adaptive]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="text-6xl">💔</div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Adaptive Runtime Error
          </h2>
          <p className="text-gray-600">{error}</p>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!generatedUI) {
    return <LoadingAnimation currentStage={stage} progress={progress} />;
  }

  // Render generated UI
  return (
    <DynamicRenderer
      code={generatedUI}
      data={systemData}
      onAction={(actionType, payload) => {
        console.log('[Orchestrator] Action received:', actionType, payload);
        onAction?.(actionType, payload);

        // Handle common actions
        if (actionType === 'refresh') {
          window.location.reload();
        }
      }}
    />
  );
}
