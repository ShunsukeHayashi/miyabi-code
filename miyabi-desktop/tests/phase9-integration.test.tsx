import { describe, expect, vi, it, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { Phase9Orchestrator, Phase9EventBus } from "../src/orchestrator/phase9Orchestrator";
import { MergeDecisionEngine } from "../src/services/autoMergeService";
import type {
  PullRequestMergeResult,
  PullRequestStatus,
} from "../src/services/githubMergeClient";
import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { Phase9Provider } from "../src/context/Phase9Context";
import { AutoMergeSettings } from "../src/components/AutoMergeSettings";
import { DeploymentDashboard } from "../src/components/DeploymentDashboard";

interface GitHubClientStub {
  getPullRequestStatus: Mock<(prNumber: number) => Promise<PullRequestStatus>>;
  mergePullRequest: Mock<
    (prNumber: number, options: { strategy: string }) => Promise<PullRequestMergeResult>
  >;
}

interface DeploymentServiceStub {
  triggerDeployment: Mock<(prNumber: number) => Promise<string>>;
  onStatusUpdate: (listener: (status: any) => void) => () => void;
  monitorDeployment?: Mock<(deploymentId: string) => Promise<void>>;
}

describe("Phase9 orchestrator integration", () => {
  let mergeClient: GitHubClientStub;
  let deploymentListeners: Array<(status: any) => void>;
  let deploymentService: DeploymentServiceStub;
  let orchestrator: Phase9Orchestrator;

  beforeEach(() => {
    mergeClient = {
      getPullRequestStatus: vi.fn() as GitHubClientStub["getPullRequestStatus"],
      mergePullRequest: vi.fn() as GitHubClientStub["mergePullRequest"],
    };

    deploymentListeners = [];
    deploymentService = {
      triggerDeployment: vi.fn() as DeploymentServiceStub["triggerDeployment"],
      onStatusUpdate: (listener) => {
        deploymentListeners.push(listener);
        return () => {
          const index = deploymentListeners.indexOf(listener);
          if (index >= 0) {
            deploymentListeners.splice(index, 1);
          }
        };
      },
      monitorDeployment: vi.fn() as DeploymentServiceStub["monitorDeployment"],
    };

    orchestrator = new Phase9Orchestrator(
      {
        qualityThreshold: 85,
        triggerDeploymentOnMerge: true,
      },
      {
        mergeClient: mergeClient as unknown as any,
        deploymentService: deploymentService as unknown as any,
        mergeEngine: new MergeDecisionEngine(),
        eventBus: new Phase9EventBus(),
      },
    );
  });

  const sampleStatus = (overrides: Partial<PullRequestStatus> = {}): PullRequestStatus => ({
    ciStatus: "success",
    requiredApprovals: 1,
    currentApprovals: 1,
    hasConflicts: false,
    qualityScore: 95,
    qualityThreshold: 85,
    commitCount: 2,
    preferredStrategy: undefined,
    requireLinearHistory: false,
    allowRebase: true,
    ...overrides,
  });

  const deploymentStatusPayload = (overrides: Partial<any> = {}) => ({
    deploymentId: "deploy-1",
    prNumber: 42,
    status: "completed",
    environment: "staging",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  it("merges eligible pull requests and triggers deployment", async () => {
    mergeClient.getPullRequestStatus.mockResolvedValue(sampleStatus());
    mergeClient.mergePullRequest.mockResolvedValue({
      merged: true,
      message: "merged",
      sha: "abc123",
    } satisfies PullRequestMergeResult);
    deploymentService.triggerDeployment.mockResolvedValue("deploy-1");

    const events: string[] = [];
    orchestrator.eventBus.on("merge:completed", ({ prNumber, result }) => {
      events.push(`complete:${prNumber}:${result.strategy}`);
    });
    orchestrator.eventBus.on("deployment:triggered", ({ deploymentId }) => {
      events.push(`deploy:${deploymentId}`);
    });

    await orchestrator.orchestrate({ prNumber: 42 });

    expect(mergeClient.getPullRequestStatus).toHaveBeenCalledWith(42);
    expect(mergeClient.mergePullRequest).toHaveBeenCalledWith(42, {
      strategy: "squash",
    });
    expect(deploymentService.triggerDeployment).toHaveBeenCalledWith(42);
    expect(events).toContain("complete:42:squash");
    expect(events).toContain("deploy:deploy-1");

    for (const listener of deploymentListeners) {
      listener(deploymentStatusPayload());
    }
  });

  it("blocks auto-merge when conditions fail", async () => {
    mergeClient.getPullRequestStatus.mockResolvedValue(
      sampleStatus({ qualityScore: 40 }),
    );

    const blockers: string[] = [];
    orchestrator.eventBus.on("merge:blocked", ({ result }) => {
      blockers.push(...result.blockers);
    });

    const result = await orchestrator.orchestrate({ prNumber: 17 });

    expect(result.canMerge).toBe(false);
    expect(mergeClient.mergePullRequest).not.toHaveBeenCalled();
    expect(deploymentService.triggerDeployment).not.toHaveBeenCalled();
    expect(blockers.length).toBeGreaterThan(0);
  });

  it("updates UI components through context and event bus", async () => {
    mergeClient.getPullRequestStatus.mockResolvedValue(sampleStatus());
    mergeClient.mergePullRequest.mockResolvedValue({
      merged: true,
      message: "merged",
      sha: "abc123",
    });
    deploymentService.triggerDeployment.mockResolvedValue("deploy-ui-1");

    const user = userEvent.setup();

    render(
      <Phase9Provider orchestrator={orchestrator}>
        <div className="grid gap-8">
          <AutoMergeSettings />
          <DeploymentDashboard />
        </div>
      </Phase9Provider>,
    );

    const mergeInput = screen.getByTestId("phase9-pr-input");
    await user.clear(mergeInput);
    await user.type(mergeInput, "42");
    await user.click(screen.getByTestId("phase9-merge-run"));

    await waitFor(() => {
      expect(screen.getByTestId("phase9-merge-status").textContent).toContain(
        "Auto-merge completed",
      );
    });

    expect(mergeClient.mergePullRequest).toHaveBeenCalled();

    // Simulate deployment status update
    for (const listener of deploymentListeners) {
      listener(
        deploymentStatusPayload({
          status: "completed",
          prNumber: 42,
          updatedAt: new Date(),
        }),
      );
    }

    await waitFor(() => {
      expect(
        screen.getByText(/Deployment completed for PR #42./i),
      ).toBeInTheDocument();
    });
  });
});
