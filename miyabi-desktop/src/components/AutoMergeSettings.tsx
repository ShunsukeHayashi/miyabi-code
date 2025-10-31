import { useEffect, useState } from "react";
import { ShieldCheck, Zap, GitMerge, Gauge, Timer, Layers, Info } from "lucide-react";
import { usePhase9Orchestrator } from "../context/Phase9Context";
import type { MergeResult } from "../services/autoMergeService";

interface AutoMergeConfig {
  enabled: boolean;
  minimumQualityScore: number;
  minimumReviewerScore: number;
  holdDurationMinutes: number;
  maxOpenMerges: number;
  riskTolerance: "low" | "medium" | "high";
  notifications: {
    slack: boolean;
    email: boolean;
    dashboard: boolean;
  };
}

const INITIAL_CONFIG: AutoMergeConfig = {
  enabled: true,
  minimumQualityScore: 85,
  minimumReviewerScore: 4.2,
  holdDurationMinutes: 15,
  maxOpenMerges: 3,
  riskTolerance: "medium",
  notifications: {
    slack: true,
    email: false,
    dashboard: true,
  },
};

const NOTIFICATION_OPTIONS: {
  key: keyof AutoMergeConfig["notifications"];
  label: string;
  description: string;
}[] = [
  {
    key: "slack",
    label: "Slack updates",
    description: "Send realtime alerts to #miyabi-deployments.",
  },
  {
    key: "email",
    label: "Email digests",
    description: "Daily summary when auto-merge is paused.",
  },
  {
    key: "dashboard",
    label: "Dashboard badges",
    description: "Highlight blocked workflows in UI.",
  },
];

const RISK_LEVEL_COPY: Record<
  AutoMergeConfig["riskTolerance"],
  { label: string; description: string }
> = {
  low: {
    label: "Low",
    description: "Strict gates. Ideal for production hotfixes and Phase 9.",
  },
  medium: {
    label: "Medium",
    description: "Balanced gates. Recommended for release branches.",
  },
  high: {
    label: "High",
    description: "Fast iteration. Only use for experimental environments.",
  },
};

type MergeStatusType = "idle" | "evaluating" | "blocked" | "completed" | "error";

interface MergeStatusState {
  prNumber?: number;
  status: MergeStatusType;
  strategy: MergeResult["strategy"];
  blockers: string[];
  message?: string;
  updatedAt?: string;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-gray-900" : "bg-gray-300"
      }`}
      type="button"
    >
      <span
        className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      >
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </span>
    </button>
  );
}

export function AutoMergeSettings() {
  const [config, setConfig] = useState<AutoMergeConfig>(INITIAL_CONFIG);
  const orchestrator = usePhase9Orchestrator();
  const [prNumberInput, setPrNumberInput] = useState<string>("");
  const [mergeStatus, setMergeStatus] = useState<MergeStatusState>({
    status: "idle",
    prNumber: undefined,
    strategy: null,
    blockers: [],
    updatedAt: undefined,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const bus = orchestrator.eventBus;
    const unsubscribeEvaluated = bus.on("merge:evaluated", ({ prNumber, result }) => {
      setMergeStatus({
        prNumber,
        status: "evaluating",
        strategy: result.strategy,
        blockers: [...result.blockers],
        updatedAt: new Date().toISOString(),
      });
      setErrorMessage(null);
    });

    const unsubscribeBlocked = bus.on("merge:blocked", ({ prNumber, result }) => {
      setMergeStatus({
        prNumber,
        status: "blocked",
        strategy: result.strategy,
        blockers: [...result.blockers],
        message: "Auto-merge requirements not yet satisfied.",
        updatedAt: new Date().toISOString(),
      });
    });

    const unsubscribeCompleted = bus.on("merge:completed", ({ prNumber, result }) => {
      setMergeStatus({
        prNumber,
        status: "completed",
        strategy: result.strategy,
        blockers: [],
        message: "Phase 9 auto-merge completed successfully.",
        updatedAt: new Date().toISOString(),
      });
    });

    const unsubscribeError = bus.on("error", ({ prNumber, error }) => {
      setMergeStatus({
        prNumber,
        status: "error",
        strategy: null,
        blockers: [],
        message: error.message,
        updatedAt: new Date().toISOString(),
      });
    });

    return () => {
      unsubscribeEvaluated();
      unsubscribeBlocked();
      unsubscribeCompleted();
      unsubscribeError();
    };
  }, [orchestrator]);

  const handleEvaluate = async () => {
    const prNumber = Number.parseInt(prNumberInput, 10);
    if (!Number.isInteger(prNumber) || prNumber <= 0) {
      setErrorMessage("Enter a valid positive PR number.");
      return;
    }

    try {
      setIsRunning(true);
      setErrorMessage(null);
      setMergeStatus((prev) => ({
        ...prev,
        prNumber,
        status: "evaluating",
        updatedAt: new Date().toISOString(),
      }));
      await orchestrator.orchestrate({ prNumber });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error during auto-merge.";
      setErrorMessage(message);
      setMergeStatus({
        prNumber,
        status: "error",
        strategy: null,
        blockers: [],
        message,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-start justify-between p-8 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Auto-Merge Configuration
          </h1>
          <p className="text-sm font-light text-gray-500">
            Tune Phase 9 merge gates, notification rules, and risk tolerances.
          </p>
        </div>
        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-light text-gray-500">
          <span className="inline-flex items-center space-x-2 text-gray-900">
            <ShieldCheck size={14} />
            <span>
              Status:{" "}
              {config.enabled ? "Phase 9 enforcement active" : "Paused"}
            </span>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        <section className="space-y-6">
          <div className="border border-gray-200 rounded-3xl p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-gray-900 mb-1">
                  Phase 9 Auto-Merge Orchestrator
                </h2>
                <p className="text-xs font-light text-gray-500">
                  Evaluate GitHub PRs against Phase 9 gates and trigger deployments.
                </p>
              </div>
              <Zap size={18} className="text-gray-400" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  data-testid="phase9-pr-input"
                  type="number"
                  min={1}
                  value={prNumberInput}
                  onChange={(event) => setPrNumberInput(event.target.value)}
                  placeholder="Enter PR number"
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
                <button
                  data-testid="phase9-merge-run"
                  onClick={handleEvaluate}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                    isRunning
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  }`}
                >
                  {isRunning ? "Evaluating…" : "Run Phase 9"}
                </button>
              </div>
              {errorMessage && (
                <p className="text-xs text-red-500" data-testid="phase9-merge-error">
                  {errorMessage}
                </p>
              )}

              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-light text-gray-500 uppercase tracking-wide">
                      Current Status
                    </p>
                    <p
                      className="text-sm font-medium text-gray-900"
                      data-testid="phase9-merge-status"
                    >
                      {mergeStatus.status === "idle"
                        ? "Awaiting evaluation"
                        : mergeStatus.status === "evaluating"
                          ? "Evaluating Phase 9 gates"
                          : mergeStatus.status === "blocked"
                            ? "Blocked"
                            : mergeStatus.status === "completed"
                              ? "Auto-merge completed"
                              : "Error"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-light text-gray-400 uppercase tracking-wide">
                      Strategy
                    </p>
                    <p
                      className="text-sm font-medium text-gray-900"
                      data-testid="phase9-merge-strategy"
                    >
                      {mergeStatus.strategy ?? "Pending"}
                    </p>
                  </div>
                </div>

                {mergeStatus.blockers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-light text-gray-500">
                      Blockers preventing Phase 9 completion:
                    </p>
                    <ul className="space-y-1 text-xs text-gray-600">
                      {mergeStatus.blockers.map((blocker) => (
                        <li key={blocker} className="flex items-start gap-2">
                          <Info size={12} className="mt-0.5 text-gray-400" />
                          <span>{blocker}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {mergeStatus.message && (
                  <p
                    className="text-xs text-gray-500"
                    data-testid="phase9-merge-message"
                  >
                    {mergeStatus.message}
                  </p>
                )}

                {mergeStatus.updatedAt && (
                  <p className="text-[11px] font-light text-gray-400">
                    Updated {new Date(mergeStatus.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-3xl p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-gray-900 mb-1">
                  Merge Gates
                </h2>
                <p className="text-xs font-light text-gray-500">
                  Minimum thresholds before the DeploymentAgent auto-merges a
                  PR.
                </p>
              </div>
              <GitMerge size={18} className="text-gray-400" />
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between border border-gray-200 rounded-2xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Auto-merge Phase 9 toggle
                  </p>
                  <p className="text-xs font-light text-gray-500">
                    When disabled, PRs remain in queued state after tests pass.
                  </p>
                </div>
                <Toggle
                  checked={config.enabled}
                  onChange={(value) =>
                    setConfig((prev) => ({ ...prev, enabled: value }))
                  }
                />
              </div>

              <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Minimum Quality Score
                    </p>
                    <p className="text-xs font-light text-gray-500">
                      Combined lint, test, audit, and deploy score.
                    </p>
                  </div>
                  <span className="text-2xl font-light text-gray-900">
                    {config.minimumQualityScore}%
                  </span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={100}
                  step={1}
                  value={config.minimumQualityScore}
                  onChange={(event) =>
                    setConfig((prev) => ({
                      ...prev,
                      minimumQualityScore: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-gray-900"
                />
                <div className="flex items-center justify-between text-[11px] font-light text-gray-400 mt-2">
                  <span>70%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Reviewer Confidence Score
                    </p>
                    <p className="text-xs font-light text-gray-500">
                      Weighted average across required reviewers (0-5 scale).
                    </p>
                  </div>
                  <span className="text-2xl font-light text-gray-900">
                    {config.minimumReviewerScore.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={5}
                  step={0.1}
                  value={config.minimumReviewerScore}
                  onChange={(event) =>
                    setConfig((prev) => ({
                      ...prev,
                      minimumReviewerScore: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-gray-900"
                />
                <div className="flex items-center justify-between text-[11px] font-light text-gray-400 mt-2">
                  <span>3.0</span>
                  <span>5.0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-3xl p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-gray-900 mb-1">
                  Deployment Guard Rails
                </h2>
                <p className="text-xs font-light text-gray-500">
                  Safety checks before and after promotion to production.
                </p>
              </div>
              <Gauge size={18} className="text-gray-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                <div className="flex items-center space-x-3 mb-3">
                  <Timer size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    Hold Duration
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min={0}
                    value={config.holdDurationMinutes}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        holdDurationMinutes: Number(event.target.value),
                      }))
                    }
                    className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm font-light text-gray-900 focus:outline-none focus:border-gray-500"
                  />
                  <span className="text-xs font-light text-gray-500">
                    Minutes after CI success before merge.
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                <div className="flex items-center space-x-3 mb-3">
                  <Layers size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    Max Concurrent Merges
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min={1}
                    value={config.maxOpenMerges}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        maxOpenMerges: Number(event.target.value),
                      }))
                    }
                    className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm font-light text-gray-900 focus:outline-none focus:border-gray-500"
                  />
                  <span className="text-xs font-light text-gray-500">
                    Prevent queue saturation during hotfix windows.
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl p-5 bg-white mt-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Risk Tolerance
              </p>
              <div className="flex items-center space-x-6">
                {(["low", "medium", "high"] as AutoMergeConfig["riskTolerance"][]).map(
                  (level) => (
                    <label
                      key={level}
                      className={`flex flex-col space-y-1 text-xs font-light cursor-pointer px-4 py-3 rounded-xl border ${
                        config.riskTolerance === level
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="risk-tolerance"
                        value={level}
                        checked={config.riskTolerance === level}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            riskTolerance: level,
                          }))
                        }
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">
                        {RISK_LEVEL_COPY[level].label}
                      </span>
                      <span>{RISK_LEVEL_COPY[level].description}</span>
                    </label>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="border border-gray-200 rounded-3xl p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-gray-900 mb-1">
                  Notification Rules
                </h2>
                <p className="text-xs font-light text-gray-500">
                  Keep stakeholders informed when Phase 9 gates trigger.
                </p>
              </div>
              <Zap size={18} className="text-gray-400" />
            </div>

            <div className="space-y-4">
              {NOTIFICATION_OPTIONS.map((item) => (
                <label
                  key={item.key}
                  className="flex items-start justify-between border border-gray-200 rounded-2xl px-4 py-3 bg-white"
                >
                  <div className="pr-4">
                    <p className="text-sm font-medium text-gray-900">
                      {item.label}
                    </p>
                    <p className="text-xs font-light text-gray-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                  <Toggle
                    checked={
                      config.notifications[item.key]
                    }
                    onChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          [item.key]: value,
                        },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 rounded-3xl p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-light text-gray-900 mb-1">
                  Summary
                </h2>
                <p className="text-xs font-light text-gray-500">
                  Snapshot of current thresholds powering DeploymentDashboard.
                </p>
              </div>
              <Info size={18} className="text-gray-400" />
            </div>

            <div className="space-y-3 text-xs font-light text-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                <span>
                  Auto-merge is{" "}
                  <span className="font-medium text-gray-900">
                    {config.enabled ? "enabled" : "disabled"}
                  </span>{" "}
                  with minimum quality score of{" "}
                  <span className="font-medium text-gray-900">
                    {config.minimumQualityScore}%
                  </span>
                  .
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                <span>
                  Reviewer confidence must be{" "}
                  <span className="font-medium text-gray-900">
                    {config.minimumReviewerScore.toFixed(1)}
                  </span>{" "}
                  or higher (Phase 9 guidance).
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                <span>
                  Holds deployments for{" "}
                  <span className="font-medium text-gray-900">
                    {config.holdDurationMinutes} minutes
                  </span>{" "}
                  before merge to allow final smoke tests.
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                <span>
                  Notifications:{" "}
                  {config.notifications.slack ? "Slack" : "Slack (off)"},{" "}
                  {config.notifications.email ? "Email" : "Email (off)"},{" "}
                  {config.notifications.dashboard
                    ? "Dashboard badges"
                    : "Dashboard badges (off)"}.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
