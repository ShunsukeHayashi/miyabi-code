import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  Phase9Orchestrator,
  type Phase9OrchestratorConfig,
} from "../orchestrator/phase9Orchestrator";
import { GitHubMergeClient } from "../services/githubMergeClient";
// Temporarily disabled to avoid Node.js module imports in browser
// import {
//   DeploymentEngine,
//   type DeploymentEngineConfig,
//   type DeploymentStatus,
// } from "../services/deployService";

import type { DeploymentStatus } from "../services/deployService.types";

type DeploymentEngineConfig = any; // Placeholder type

interface DeploymentServiceMinimal {
  triggerDeployment(prNumber: number): Promise<string>;
  onStatusUpdate(listener: (status: DeploymentStatus) => void): () => void;
  monitorDeployment?(deploymentId: string): Promise<void>;
}

class InMemoryDeploymentService implements DeploymentServiceMinimal {
  private listeners = new Set<(status: DeploymentStatus) => void>();

  async triggerDeployment(prNumber: number): Promise<string> {
    const deploymentId = `local-${prNumber}-${Date.now()}`;
    queueMicrotask(() => {
      const status: DeploymentStatus = {
        deploymentId,
        prNumber,
        status: "completed",
        environment: "staging",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      for (const listener of this.listeners) {
        listener(status);
      }
    });
    return deploymentId;
  }

  onStatusUpdate(listener: (status: DeploymentStatus) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

function createDeploymentService(
  _config?: DeploymentEngineConfig,
): DeploymentServiceMinimal {
  // Temporarily disabled: DeploymentEngine requires Node.js modules
  // Always use InMemoryDeploymentService for now
  return new InMemoryDeploymentService();

  // Original implementation (commented out):
  // if (!config) {
  //   return new InMemoryDeploymentService();
  // }
  //
  // try {
  //   return new DeploymentEngine(config);
  // } catch (error) {
  //   console.error(
  //     "[Phase9] Failed to initialise DeploymentEngine. Falling back to in-memory service.",
  //     error,
  //   );
  //   return new InMemoryDeploymentService();
  // }
}

interface Phase9ProviderProps {
  children: ReactNode;
  orchestrator?: Phase9Orchestrator;
  config?: Partial<Phase9OrchestratorConfig>;
  deploymentConfig?: DeploymentEngineConfig;
  repository?: string;
}

const Phase9Context = createContext<Phase9Orchestrator | null>(null);

export function Phase9Provider({
  children,
  orchestrator: providedOrchestrator,
  config,
  deploymentConfig,
  repository,
}: Phase9ProviderProps) {
  const value = useMemo(() => {
    if (providedOrchestrator) {
      return providedOrchestrator;
    }

    const mergeClient = new GitHubMergeClient(repository);
    const deploymentService = createDeploymentService(deploymentConfig);

    const orchestratorConfig: Phase9OrchestratorConfig = {
      qualityThreshold: config?.qualityThreshold ?? 85,
      triggerDeploymentOnMerge: config?.triggerDeploymentOnMerge ?? true,
      mergeOptions: config?.mergeOptions,
    };

    return new Phase9Orchestrator(orchestratorConfig, {
      mergeClient,
      deploymentService,
    });
  }, [providedOrchestrator, config, deploymentConfig, repository]);

  useEffect(() => {
    return () => {
      value.dispose();
    };
  }, [value]);

  return (
    <Phase9Context.Provider value={value}>{children}</Phase9Context.Provider>
  );
}

export function usePhase9Orchestrator(): Phase9Orchestrator {
  const orchestrator = useContext(Phase9Context);
  if (!orchestrator) {
    throw new Error(
      "usePhase9Orchestrator must be used within a Phase9Provider",
    );
  }
  return orchestrator;
}
