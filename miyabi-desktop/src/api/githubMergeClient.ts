import { Octokit } from "@octokit/rest";
import type { RequestError } from "@octokit/types";
import type {
  CIStatus,
  MergeStrategy,
} from "../services/autoMergeService";

type PullRequest = Awaited<
  ReturnType<Octokit["pulls"]["get"]>
>["data"];
type CheckRun = Awaited<
  ReturnType<Octokit["checks"]["listForRef"]>
>["data"]["check_runs"][number];
type CombinedCommitStatus = Awaited<
  ReturnType<Octokit["repos"]["getCombinedStatusForRef"]>
>["data"];
type PullRequestReview = Awaited<
  ReturnType<Octokit["pulls"]["listReviews"]>
>["data"][number];

export interface RetryOptions {
  attempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export interface GitHubMergeClientOptions {
  token: string;
  /**
   * Repository slug in the form `owner/repo`.
   */
  repository?: string;
  owner?: string;
  repo?: string;
  userAgent?: string;
  retry?: RetryOptions;
}

export interface MergePullRequestOptions {
  commitTitle?: string;
  commitMessage?: string;
  expectedHeadSha?: string;
}

export interface PullRequestStatusSummary {
  ciStatus: CIStatus;
  checkRuns: CheckRunSummary[];
  combinedStatus?: string | null;
  commitCount: number;
  draft: boolean;
  headSha: string;
  baseRef: string;
  updatedAt: string;
  mergeable: boolean | null;
  mergeableState: string | null;
}

export interface CheckRunSummary {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string | null;
  detailsUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ReviewApprovalsSummary {
  approvalCount: number;
  approvals: ReviewerApproval[];
  requiredApprovals?: number;
  reviewersEvaluated: string[];
}

export interface ReviewerApproval {
  reviewer: string;
  state: PullRequestReview["state"];
  submittedAt: string | null;
}

export interface ConflictCheckResult {
  mergeable: boolean | null;
  mergeableState: string | null;
  rebaseable: boolean | null;
  headSha: string;
}

export interface CloseIssueResult {
  number: number;
  state: "open" | "closed";
  closedAt: string | null;
  url: string;
}

type RequestErrorLike = Partial<RequestError> & {
  message?: unknown;
  response?: {
    headers?: Record<string, string>;
  };
};

export class GitHubApiError extends Error {
  readonly status?: number;
  readonly requestId?: string;
  readonly cause?: unknown;

  constructor(message: string, options: { status?: number; requestId?: string; cause?: unknown } = {}) {
    super(message);
    this.name = "GitHubApiError";
    this.status = options.status;
    this.requestId = options.requestId;
    this.cause = options.cause;
  }
}

const MERGE_METHOD_MAP: Record<MergeStrategy, "merge" | "squash" | "rebase"> = {
  merge: "merge",
  squash: "squash",
  rebase: "rebase",
};

const FAILED_CONCLUSIONS = new Set([
  "failure",
  "timed_out",
  "action_required",
  "cancelled",
  "stale",
]);

const SUCCESS_CONCLUSION = "success";
const SKIPPED_CONCLUSION = "skipped";

const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_INITIAL_DELAY = 500;
const DEFAULT_RETRY_MAX_DELAY = 2000;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export class GitHubMergeClient {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;
  private readonly retryAttempts: number;
  private readonly retryInitialDelay: number;
  private readonly retryMaxDelay: number;

  constructor(options: GitHubMergeClientOptions) {
    if (!options.token) {
      throw new Error("GitHubMergeClient requires a personal access token.");
    }

    const { owner, repo } = this.parseRepository(options);
    this.owner = owner;
    this.repo = repo;

    this.retryAttempts = Math.max(
      1,
      options.retry?.attempts ?? DEFAULT_RETRY_ATTEMPTS,
    );
    this.retryInitialDelay =
      options.retry?.initialDelayMs ?? DEFAULT_RETRY_INITIAL_DELAY;
    this.retryMaxDelay = options.retry?.maxDelayMs ?? DEFAULT_RETRY_MAX_DELAY;

    this.octokit = new Octokit({
      auth: options.token,
      userAgent: options.userAgent ?? "MiyabiDesktop/Phase9",
    });
  }

  async mergePullRequest(
    prNumber: number,
    strategy: MergeStrategy,
    options: MergePullRequestOptions = {},
  ): Promise<{ merged: boolean; message: string; sha?: string | null }> {
    const method = MERGE_METHOD_MAP[strategy];

    const response = await this.withRetry(
      () =>
        this.octokit.pulls.merge({
          owner: this.owner,
          repo: this.repo,
          pull_number: prNumber,
          merge_method: method,
          commit_title: options.commitTitle,
          commit_message: options.commitMessage,
          sha: options.expectedHeadSha,
        }),
      `merge pull request #${prNumber}`,
    );

    return {
      merged: response.data.merged,
      message: response.data.message,
      sha: response.data.sha ?? null,
    };
  }

  async closeIssue(issueNumber: number): Promise<CloseIssueResult> {
    const response = await this.withRetry(
      () =>
        this.octokit.issues.update({
          owner: this.owner,
          repo: this.repo,
          issue_number: issueNumber,
          state: "closed",
        }),
      `close issue #${issueNumber}`,
    );

    return {
      number: response.data.number,
      state: response.data.state as CloseIssueResult["state"],
      closedAt: response.data.closed_at ?? null,
      url: response.data.html_url,
    };
  }

  async getPRStatus(prNumber: number): Promise<PullRequestStatusSummary> {
    const pullRequest = await this.fetchPullRequest(prNumber);
    const headSha = pullRequest.head.sha;

    const [checkRuns, combinedStatus] = await Promise.all([
      this.listCheckRuns(headSha),
      this.getCombinedStatus(headSha),
    ]);

    const ciStatus = this.deriveCiStatus(checkRuns, combinedStatus?.state);

    return {
      ciStatus,
      checkRuns: checkRuns.map((run) => this.toCheckRunSummary(run)),
      combinedStatus: combinedStatus?.state ?? null,
      commitCount: pullRequest.commits ?? 0,
      draft: pullRequest.draft ?? false,
      headSha,
      baseRef: pullRequest.base.ref,
      updatedAt: pullRequest.updated_at,
      mergeable: pullRequest.mergeable ?? null,
      mergeableState: pullRequest.mergeable_state ?? null,
    };
  }

  async getReviewApprovals(prNumber: number): Promise<ReviewApprovalsSummary> {
    const pullRequest = await this.fetchPullRequest(prNumber);
    const reviews = await this.listReviews(prNumber);
    const latestReviewByUser = new Map<string, PullRequestReview>();

    for (const review of reviews) {
      const login = review.user?.login;
      if (!login) {
        continue;
      }

      const existing = latestReviewByUser.get(login);
      if (!existing) {
        latestReviewByUser.set(login, review);
        continue;
      }

      const existingTimestamp = this.getReviewTimestamp(existing);
      const candidateTimestamp = this.getReviewTimestamp(review);
      if (candidateTimestamp > existingTimestamp) {
        latestReviewByUser.set(login, review);
      }
    }

    const approvals: ReviewerApproval[] = [];
    for (const [reviewer, review] of latestReviewByUser.entries()) {
      approvals.push({
        reviewer,
        state: review.state,
        submittedAt: this.getReviewTimestamp(review).isoString,
      });
    }

    const approvalCount = approvals.filter(
      (approval) => approval.state === "APPROVED",
    ).length;

    let requiredApprovals: number | undefined;
    try {
      requiredApprovals = await this.getRequiredApprovals(pullRequest.base.ref);
    } catch (error) {
      if (!this.isAuthorizationError(error)) {
        throw this.toGitHubError(
          error,
          `retrieve branch protection for ${pullRequest.base.ref}`,
        );
      }
    }

    return {
      approvalCount,
      approvals,
      requiredApprovals,
      reviewersEvaluated: Array.from(latestReviewByUser.keys()),
    };
  }

  async checkConflicts(prNumber: number): Promise<ConflictCheckResult> {
    let pullRequest = await this.fetchPullRequest(prNumber);
    if (pullRequest.mergeable === null) {
      pullRequest = await this.awaitMergeableComputation(prNumber);
    }

    return {
      mergeable: pullRequest.mergeable ?? null,
      mergeableState: pullRequest.mergeable_state ?? null,
      rebaseable: pullRequest.rebaseable ?? null,
      headSha: pullRequest.head.sha,
    };
  }

  private parseRepository(options: GitHubMergeClientOptions): { owner: string; repo: string } {
    if (options.owner && options.repo) {
      return { owner: options.owner, repo: options.repo };
    }

    if (options.repository) {
      const parts = options.repository.split("/");
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error(
          `Invalid repository value "${options.repository}". Expected "owner/repo".`,
        );
      }
      return { owner: parts[0], repo: parts[1] };
    }

    throw new Error(
      "GitHubMergeClient requires either owner/repo or repository string.",
    );
  }

  private async fetchPullRequest(prNumber: number): Promise<PullRequest> {
    const response = await this.withRetry(
      () =>
        this.octokit.pulls.get({
          owner: this.owner,
          repo: this.repo,
          pull_number: prNumber,
        }),
      `fetch pull request #${prNumber}`,
    );
    return response.data;
  }

  private async listCheckRuns(ref: string): Promise<CheckRun[]> {
    try {
      const runs = await this.withRetry(
        () =>
          this.octokit.paginate(this.octokit.checks.listForRef, {
            owner: this.owner,
            repo: this.repo,
            ref,
            per_page: 100,
          }),
        `list check runs for ${ref}`,
      );
      return runs;
    } catch (error) {
      if (this.isAuthorizationError(error)) {
        return [];
      }
      throw this.toGitHubError(error, `list check runs for ${ref}`);
    }
  }

  private async getCombinedStatus(ref: string): Promise<CombinedCommitStatus | undefined> {
    try {
      const response = await this.withRetry(
        () =>
          this.octokit.repos.getCombinedStatusForRef({
            owner: this.owner,
            repo: this.repo,
            ref,
          }),
        `retrieve combined status for ${ref}`,
      );
      return response.data;
    } catch (error) {
      if (this.isAuthorizationError(error)) {
        return undefined;
      }
      throw this.toGitHubError(error, `retrieve combined status for ${ref}`);
    }
  }

  private async listReviews(prNumber: number): Promise<PullRequestReview[]> {
    return await this.withRetry(
      () =>
        this.octokit.paginate(this.octokit.pulls.listReviews, {
          owner: this.owner,
          repo: this.repo,
          pull_number: prNumber,
          per_page: 100,
        }),
      `list reviews for pull request #${prNumber}`,
    );
  }

  private async getRequiredApprovals(baseRef: string): Promise<number | undefined> {
    const response = await this.withRetry(
      () =>
        this.octokit.repos.getBranchProtection({
          owner: this.owner,
          repo: this.repo,
          branch: baseRef,
        }),
      `retrieve branch protection for ${baseRef}`,
    );

    return (
      response.data.required_pull_request_reviews?.required_approving_review_count ??
      undefined
    );
  }

  private async awaitMergeableComputation(prNumber: number): Promise<PullRequest> {
    let attempt = 0;
    let pullRequest = await this.fetchPullRequest(prNumber);

    while (pullRequest.mergeable === null && attempt < this.retryAttempts - 1) {
      const delay = Math.min(
        this.retryMaxDelay,
        this.retryInitialDelay * 2 ** attempt,
      );
      await wait(delay);
      pullRequest = await this.fetchPullRequest(prNumber);
      attempt += 1;
    }

    return pullRequest;
  }

  private deriveCiStatus(
    checkRuns: CheckRun[],
    combinedState?: string | null,
  ): CIStatus {
    if (checkRuns.length > 0) {
      const hasQueued = checkRuns.some((run) => run.status === "queued");
      if (hasQueued) {
        return "queued";
      }

      const hasInProgress = checkRuns.some((run) => run.status === "in_progress");
      if (hasInProgress) {
        return "running";
      }

      const conclusions = checkRuns
        .map((run) => run.conclusion)
        .filter((value): value is Exclude<typeof value, null> => value !== null);

      if (conclusions.length > 0) {
        if (conclusions.every((conclusion) => conclusion === SUCCESS_CONCLUSION)) {
          return "success";
        }

        if (conclusions.some((conclusion) => FAILED_CONCLUSIONS.has(conclusion))) {
          return "failed";
        }

        if (conclusions.every((conclusion) => conclusion === SKIPPED_CONCLUSION)) {
          return "skipped";
        }
      }

      return "pending";
    }

    if (combinedState) {
      switch (combinedState) {
        case "success":
          return "success";
        case "failure":
          return "failed";
        case "pending":
          return "pending";
        default:
          return combinedState as CIStatus;
      }
    }

    return "unknown";
  }

  private toCheckRunSummary(run: CheckRun): CheckRunSummary {
    return {
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      htmlUrl: run.html_url ?? null,
      detailsUrl: run.details_url ?? null,
      startedAt: run.started_at ?? null,
      completedAt: run.completed_at ?? null,
    };
  }

  private getReviewTimestamp(review: PullRequestReview): {
    isoString: string | null;
    epochMs: number;
  } {
    const timestamp =
      review.submitted_at ??
      review.commit_id /* fallback for pending reviews */ ??
      review.state === "PENDING"
        ? review.submitted_at
        : review.submitted_at;

    const isoString = timestamp ?? null;
    const epochMs = isoString ? Date.parse(isoString) : 0;

    return { isoString, epochMs };
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt < this.retryAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        attempt += 1;

        if (!this.isRetryable(error) || attempt >= this.retryAttempts) {
          throw this.toGitHubError(error, context);
        }

        const delay = Math.min(
          this.retryMaxDelay,
          this.retryInitialDelay * 2 ** (attempt - 1),
        );
        await wait(delay);
      }
    }

    throw this.toGitHubError(
      lastError,
      `${context} (retries exhausted after ${this.retryAttempts} attempts)`,
    );
  }

  private isRetryable(error: unknown): boolean {
    const requestError = error as RequestErrorLike | undefined;
    const status = requestError?.status;

    if (status !== undefined) {
      if (status >= 500 || status === 429) {
        return true;
      }
      if (status === 409) {
        // Merge conflict state recalculation - retry may resolve.
        return true;
      }
      return false;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("timeout") ||
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("socket")
      ) {
        return true;
      }
    }

    return false;
  }

  private isAuthorizationError(error: unknown): boolean {
    const requestError = error as Partial<RequestError> | undefined;
    const status = requestError?.status;
    return status === 403 || status === 404;
  }

  private toGitHubError(error: unknown, context: string): GitHubApiError {
    const requestError = error as RequestErrorLike | undefined;
    if (requestError && typeof requestError.message === "string") {
      const message = requestError.message;
      return new GitHubApiError(
        `GitHub API error while attempting to ${context}: ${message}`,
        {
          status: requestError.status,
          requestId: requestError.response?.headers?.["x-github-request-id"],
          cause: error,
        },
      );
    }

    if (error instanceof Error) {
      return new GitHubApiError(
        `Unexpected error while attempting to ${context}: ${error.message}`,
        {
          cause: error,
        },
      );
    }

    return new GitHubApiError(
      `Unknown error while attempting to ${context}: ${String(error)}`,
      { cause: error },
    );
  }
}
