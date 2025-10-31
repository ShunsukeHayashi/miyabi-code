/**
 * Auto-merge business logic for Miyabi Desktop (Phase 9).
 *
 * This module encapsulates the pure decision-making rules that determine whether
 * a pull request can be merged automatically and which merge strategy should be
 * used. GitHub/Tauri integration layers are expected to call this service and
 * act on the resulting decision.
 */

/**
 * Supported CI status values.
 */
export type CIStatus =
  | "success"
  | "passed"
  | "running"
  | "pending"
  | "queued"
  | "skipped"
  | "cancelled"
  | "failed"
  | "errored"
  | "unknown";

/**
 * Merge strategies supported by the desktop client.
 */
export type MergeStrategy = "squash" | "merge" | "rebase";

/**
 * Quality score expressed as a percentage (0 - 100).
 */
export type QualityScore = number;

/**
 * Conditions collected from ReviewAgent, CI pipelines, and PR metadata that
 * influence the auto-merge decision.
 */
export interface MergeConditions {
  ciStatus: CIStatus;
  qualityScore: QualityScore;
  qualityThreshold: QualityScore;
  requiresHumanReview: boolean;
  approvedReviews: number;
  hasConflicts: boolean;

  /**
   * Preferred merge strategy (e.g., defined in repo settings or PR metadata).
   * When undefined the decision engine derives a strategy automatically.
   */
  preferredStrategy?: MergeStrategy;

  /**
   * Number of commits included in the PR. Used to decide between squash vs merge.
   */
  commitCount?: number;

  /**
   * Signals that a linear history is required (e.g., repository setting or branch policy).
   */
  requireLinearHistory?: boolean;

  /**
   * Explicit opt-out for rebase strategy (e.g., repository disallows it).
   */
  allowRebase?: boolean;
}

/**
 * Result returned by the merge decision engine.
 */
export interface MergeResult {
  /**
   * True when all auto-merge conditions are satisfied.
   */
  canMerge: boolean;

  /**
   * Selected merge strategy. `null` when `canMerge` is false.
   */
  strategy: MergeStrategy | null;

  /**
   * Diagnostic blockers explaining why auto-merge is not yet possible.
   */
  blockers: string[];
}

/**
 * Options that customise how merge decisions are derived.
 */
export interface MergeDecisionOptions {
  /**
   * Default strategy when no preference is supplied. Defaults to "squash".
   */
  defaultStrategy?: MergeStrategy;

  /**
   * Automatically prefer squash merges when the PR contains more than one commit.
   * Defaults to true.
   */
  preferSquashForMultipleCommits?: boolean;

  /**
   * Prefer rebase when a linear history is requested. Defaults to true.
   */
  preferRebaseForLinearHistory?: boolean;
}

/**
 * True when the CI status represents a green build.
 */
function isPassingCI(status: CIStatus): boolean {
  const normalized = status.toLowerCase();
  return normalized === "success" || normalized === "passed";
}

/**
 * Evaluate whether a pull request satisfies the minimum requirements for auto-merge.
 */
export function canAutoMerge(conditions: MergeConditions): boolean {
  if (!isPassingCI(conditions.ciStatus)) {
    return false;
  }

  if (conditions.qualityScore < conditions.qualityThreshold) {
    return false;
  }

  if (conditions.requiresHumanReview && conditions.approvedReviews <= 0) {
    return false;
  }

  if (conditions.hasConflicts) {
    return false;
  }

  return true;
}

/**
 * Core decision engine responsible for combining merge readiness checks with
 * merge strategy selection.
 */
export class MergeDecisionEngine {
  private readonly options: Required<MergeDecisionOptions>;

  constructor(options: MergeDecisionOptions = {}) {
    this.options = {
      defaultStrategy: options.defaultStrategy ?? "squash",
      preferSquashForMultipleCommits:
        options.preferSquashForMultipleCommits ?? true,
      preferRebaseForLinearHistory:
        options.preferRebaseForLinearHistory ?? true,
    };
  }

  /**
   * Evaluate whether the PR can be auto-merged and return the recommended strategy.
   */
  evaluate(conditions: MergeConditions): MergeResult {
    const blockers = this.collectBlockers(conditions);
    const canMerge = blockers.length === 0;
    const strategy = canMerge
      ? this.determineStrategy(conditions)
      : null;

    return {
      canMerge,
      strategy,
      blockers,
    };
  }

  /**
   * Generate a merge strategy when auto-merge requirements are satisfied.
   */
  private determineStrategy(conditions: MergeConditions): MergeStrategy {
    if (conditions.preferredStrategy) {
      return conditions.preferredStrategy;
    }

    if (
      conditions.requireLinearHistory &&
      (conditions.allowRebase ?? true) &&
      this.options.preferRebaseForLinearHistory
    ) {
      return "rebase";
    }

    const commitCount = conditions.commitCount ?? 0;
    if (
      commitCount > 1 &&
      this.options.preferSquashForMultipleCommits
    ) {
      return "squash";
    }

    return this.options.defaultStrategy;
  }

  /**
   * Collect unmet conditions to aid in user-facing messaging.
   */
  private collectBlockers(conditions: MergeConditions): string[] {
    const blockers: string[] = [];

    if (!isPassingCI(conditions.ciStatus)) {
      blockers.push("CI checks must succeed before auto-merge.");
    }

    if (conditions.qualityScore < conditions.qualityThreshold) {
      blockers.push(
        `Quality score ${conditions.qualityScore}% is below the required threshold of ${conditions.qualityThreshold}%.`,
      );
    }

    if (conditions.requiresHumanReview && conditions.approvedReviews <= 0) {
      blockers.push(
        "At least one human approval is required before auto-merge.",
      );
    }

    if (conditions.hasConflicts) {
      blockers.push("Resolve merge conflicts before auto-merge can proceed.");
    }

    return blockers;
  }
}
