import { EventEmitter } from "events";
import {
  MergeDecisionEngine,
  MergeDecisionOptions,
  MergeConditions,
  MergeResult,
  CIStatus,
} from "../services/autoMergeService";
import {
  GitHubMergeClient,
  PullRequestMergeResult,
  PullRequestStatus,
} from "../services/githubMergeClient";
import { DeploymentStatus } from "../services/deployService";

export type Phase9MergeEvaluation = {
  prNumber: number;
  conditions: MergeConditions;
  result: MergeResult;
  pullRequestStatus: PullRequestStatus;
};

export type Phase9MergeCompletion = Phase9MergeEvaluation & {
  mergeResponse: PullRequestMergeResult;
};

export type Phase9DeploymentTrigger = {
  prNumber: number;
  deploymentId: string;
};

export interface Phase9OrchestratorConfig {
  qualityThreshold: number;
  triggerDeploymentOnMerge?: boolean;
  mergeOptions?: MergeDecisionOptions;
}

export interface Phase9EventMap {
  "merge:evaluated": Phase9MergeEvaluation;
  "merge:blocked": Phase9MergeEvaluation;
  "merge:completed": Phase9MergeCompletion;
  "deployment:triggered": Phase9DeploymentTrigger;
  "deployment:status": DeploymentStatus & { prNumber: number };
  error: {
    prNumber?: number;
    error: Error;
  };
}

export class Phase9EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(20);
  }

  on<K extends keyof Phase9EventMap>(
    event: K,
    listener: (payload: Phase9EventMap[K]) => void,
  ): () => void {
    this.emitter.on(event as string, listener);
    return () => {
      this.emitter.off(event as string, listener);
    };
  }

  once<K extends keyof Phase9EventMap>(
    event: K,
    listener: (payload: Phase9EventMap[K]) => void,
  ): void {
    this.emitter.once(event as string, listener);
  }

  emit<K extends keyof Phase9EventMap>(event: K, payload: Phase9EventMap[K]): void {
    this.emitter.emit(event as string, payload);
  }

  removeAll(): void {
    this.emitter.removeAllListeners();
  }
}

interface DeploymentService {
  triggerDeployment(prNumber: number): Promise<string>;
  onStatusUpdate(listener: (status: DeploymentStatus) => void): () => void;
  monitorDeployment?(deploymentId: string): Promise<void>;
}

export interface Phase9OrchestratorDeps {
  mergeClient: GitHubMergeClient;
  deploymentService: DeploymentService;
  mergeEngine?: MergeDecisionEngine;
  eventBus?: Phase9EventBus;
}

export interface Phase9OrchestrateOptions {
  prNumber: number;
  triggerDeployment?: boolean;
  overrides?: Partial<MergeConditions>;
}

export class Phase9Orchestrator {
  private readonly bus: Phase9EventBus;
  private readonly mergeEngine: MergeDecisionEngine;
  private deploymentUnsubscribe?: () => void;

  constructor(
    private readonly config: Phase9OrchestratorConfig,
    private readonly deps: Phase9OrchestratorDeps,
  ) {
    this.bus = deps.eventBus ?? new Phase9EventBus();
    this.mergeEngine =
      deps.mergeEngine ?? new MergeDecisionEngine(config.mergeOptions);
    this.deploymentUnsubscribe = deps.deploymentService.onStatusUpdate(
      (status) => {
        this.bus.emit("deployment:status", {
          ...status,
          prNumber: status.prNumber,
        });
      },
    );
  }

  get eventBus(): Phase9EventBus {
    return this.bus;
  }

  async orchestrate(options: Phase9OrchestrateOptions): Promise<MergeResult> {
    const { prNumber } = options;
    try {
      const prStatus = await this.deps.mergeClient.getPullRequestStatus(prNumber);
      const conditions = this.buildConditions(prStatus, options);
      const result = this.mergeEngine.evaluate(conditions);
      const evaluation: Phase9MergeEvaluation = {
        prNumber,
        conditions,
        result,
        pullRequestStatus: prStatus,
      };

      this.bus.emit("merge:evaluated", evaluation);

      if (!result.canMerge) {
        this.bus.emit("merge:blocked", evaluation);
        return result;
      }

      const strategy = result.strategy ?? "squash";
      const mergeResponse = await this.deps.mergeClient.mergePullRequest(prNumber, {
        strategy,
      });

      const completion: Phase9MergeCompletion = {
        ...evaluation,
        mergeResponse,
        result: {
          ...result,
          strategy,
        },
      };

      this.bus.emit("merge:completed", completion);

      const shouldTriggerDeployment =
        options.triggerDeployment ?? this.config.triggerDeploymentOnMerge ?? true;

      if (shouldTriggerDeployment) {
        await this.startDeployment(prNumber);
      }

      return completion.result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.bus.emit("error", { prNumber: options.prNumber, error: err });
      throw err;
    }
  }

  dispose(): void {
    if (this.deploymentUnsubscribe) {
      this.deploymentUnsubscribe();
      this.deploymentUnsubscribe = undefined;
    }
    this.bus.removeAll();
  }

  private async startDeployment(prNumber: number): Promise<void> {
    const deploymentId = await this.deps.deploymentService.triggerDeployment(prNumber);
    this.bus.emit("deployment:triggered", { prNumber, deploymentId });

    if (this.deps.deploymentService.monitorDeployment) {
      await this.deps.deploymentService.monitorDeployment(deploymentId);
    }
  }

  private buildConditions(
    status: PullRequestStatus,
    options: Phase9OrchestrateOptions,
  ): MergeConditions {
    const qualityThreshold =
      options.overrides?.qualityThreshold ??
      status.qualityThreshold ??
      this.config.qualityThreshold;

    const ciStatus = (options.overrides?.ciStatus ?? status.ciStatus) as CIStatus;

    const requiresHumanReview =
      options.overrides?.requiresHumanReview ?? status.requiredApprovals > 0;

    const approvedReviews =
      options.overrides?.approvedReviews ?? status.currentApprovals;

    const qualityScore =
      options.overrides?.qualityScore ?? status.qualityScore ?? 0;

    const hasConflicts =
      options.overrides?.hasConflicts ?? status.hasConflicts ?? false;

    const conditions: MergeConditions = {
      ciStatus,
      qualityScore,
      qualityThreshold,
      requiresHumanReview,
      approvedReviews,
      hasConflicts,
      preferredStrategy: options.overrides?.preferredStrategy ?? status.preferredStrategy,
      commitCount: options.overrides?.commitCount ?? status.commitCount,
      requireLinearHistory:
        options.overrides?.requireLinearHistory ?? status.requireLinearHistory,
      allowRebase: options.overrides?.allowRebase ?? status.allowRebase,
    };

    return conditions;
  }
}
