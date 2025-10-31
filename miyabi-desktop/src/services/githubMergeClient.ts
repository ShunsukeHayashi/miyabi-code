import { invoke } from "@tauri-apps/api/core";
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
    const result = await invoke<PullRequestMergeResult>(
      "merge_pull_request_command",
      {
        prNumber,
        payload: {
          ...payload,
          repository: this.repository,
        },
      },
    );
    return result;
  }

  async getPullRequestStatus(prNumber: number): Promise<PullRequestStatus> {
    return await invoke<PullRequestStatus>("get_pull_request_status_command", {
      prNumber,
      repository: this.repository,
    });
  }
}
