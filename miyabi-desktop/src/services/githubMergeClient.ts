import { safeInvoke } from "../lib/tauri-utils";
import type { MergeStrategy } from "./autoMergeService";

export interface PullRequestMergePayload {
  strategy: MergeStrategy;
  commitTitle?: string;
  commitMessage?: string;
  sha?: string;
}

export interface PullRequestMergeResult {
  merged: boolean;
  message: string;
  sha?: string;
}

export interface PullRequestStatus {
  ciStatus: string;
  requiredApprovals: number;
  currentApprovals: number;
  hasConflicts: boolean;
  qualityScore?: number;
  qualityThreshold?: number;
  commitCount?: number;
  preferredStrategy?: MergeStrategy;
  requireLinearHistory?: boolean;
  allowRebase?: boolean;
}

export class GitHubMergeClient {
  constructor(private readonly repository?: string) {}

  async mergePullRequest(
    prNumber: number,
    payload: PullRequestMergePayload,
  ): Promise<PullRequestMergeResult> {
    const result = await safeInvoke<PullRequestMergeResult>(
      "merge_pull_request_command",
      {
        prNumber,
        payload: {
          ...payload,
          repository: this.repository,
        },
      },
    );
    return result || { merged: false, message: 'Tauri runtime not available' };
  }

  async getPullRequestStatus(prNumber: number): Promise<PullRequestStatus> {
    const result = await safeInvoke<PullRequestStatus>("get_pull_request_status_command", {
      prNumber,
      repository: this.repository,
    });
    return result || {
      ciStatus: 'unknown',
      requiredApprovals: 0,
      currentApprovals: 0,
      hasConflicts: false,
    };
  }
}
