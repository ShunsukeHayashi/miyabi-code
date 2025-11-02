import { useEffect, useMemo, useState } from "react";
import {
  Rocket,
  AlertCircle,
  CheckCircle,
  Clock3,
  History,
  Activity,
  Play,
  TrendingUp,
} from "lucide-react";
import { usePhase9Orchestrator } from "../context/Phase9Context";
import type { DeploymentStatus as Phase9DeploymentStatus } from "../services/deployService.types";

type PipelineStatus = "healthy" | "deploying" | "queued" | "error";

interface Pipeline {
  id: string;
  name: string;
  branch: string;
  status: PipelineStatus;
  version: string;
  lastDeploymentAt: string;
  changeCount: number;
  reviewerCount: number;
  qualityScore: number;
}

interface DeploymentEvent {
  id: string;
  timestamp: string;
  environment: string;
  actor: string;
  result: "success" | "warning" | "failed" | "in-progress";
  summary: string;
}

interface QualityMetric {
  id: string;
  label: string;
  score: number;
  target: number;
  description: string;
}

const STATUS_STYLES: Record<
  PipelineStatus,
  { label: string; badge: string; icon: typeof CheckCircle }
> = {
  healthy: {
    label: "Healthy",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    icon: CheckCircle,
  },
  deploying: {
    label: "Deploying",
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    icon: Rocket,
  },
  queued: {
    label: "Queued",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    icon: Clock3,
  },
  error: {
    label: "Attention",
    badge: "bg-rose-100 text-rose-700 border border-rose-200",
    icon: AlertCircle,
  },
};

const INITIAL_PIPELINES: Pipeline[] = [
  {
    id: "prod",
    name: "Production",
    branch: "main",
    status: "healthy",
    version: "v9.3.1",
    lastDeploymentAt: "2025-10-30T21:10:00Z",
    changeCount: 12,
    reviewerCount: 3,
    qualityScore: 94,
  },
  {
    id: "staging",
    name: "Staging",
    branch: "release/phase-9",
    status: "deploying",
    version: "v9.4.0-rc2",
    lastDeploymentAt: "2025-10-31T00:20:00Z",
    changeCount: 5,
    reviewerCount: 2,
    qualityScore: 87,
  },
  {
    id: "sandbox",
    name: "Sandbox",
    branch: "feature/auto-merge-sim",
    status: "queued",
    version: "v9.4.0-beta",
    lastDeploymentAt: "2025-10-30T18:40:00Z",
    changeCount: 3,
    reviewerCount: 1,
    qualityScore: 81,
  },
];

const INITIAL_HISTORY: DeploymentEvent[] = [
  {
    id: "evt-001",
    timestamp: "2025-10-31T01:30:00Z",
    environment: "Staging",
    actor: "AutoMergeAgent",
    result: "in-progress",
    summary: "Queued deploy with quality gate validation (Phase 9 roll-out).",
  },
  {
    id: "evt-002",
    timestamp: "2025-10-30T21:12:00Z",
    environment: "Production",
    actor: "DeploymentAgent",
    result: "success",
    summary: "Deployment completed in 2m 14s with zero warnings.",
  },
  {
    id: "evt-003",
    timestamp: "2025-10-30T17:55:00Z",
    environment: "Production",
    actor: "DeploymentAgent",
    result: "warning",
    summary: "Drift detected against staging baseline. Manual review requested.",
  },
  {
    id: "evt-004",
    timestamp: "2025-10-30T10:05:00Z",
    environment: "Sandbox",
    actor: "CodexOperator",
    result: "failed",
    summary: "Auto-merge blocked by quality score < 80%.",
  },
];

const QUALITY_METRICS: QualityMetric[] = [
  {
    id: "pipeline-health",
    label: "Pipeline Health",
    score: 92,
    target: 88,
    description: "Passing checks across build, test, audit, and deploy.",
  },
  {
    id: "auto-merge-confidence",
    label: "Auto-Merge Confidence",
    score: 86,
    target: 85,
    description: "Aggregated reviewer score + risk assessment threshold.",
  },
  {
    id: "post-deploy",
    label: "Post-Deploy Stability",
    score: 94,
    target: 90,
    description: "Incidents within the first hour after deployment.",
  },
];

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function DeploymentDashboard() {
  const orchestrator = usePhase9Orchestrator();
  const [pipelines, setPipelines] = useState<Pipeline[]>(INITIAL_PIPELINES);
  const [deploymentHistory, setDeploymentHistory] =
    useState<DeploymentEvent[]>(INITIAL_HISTORY);
  const [isDeploying, setIsDeploying] = useState(false);
  const [heartbeat, setHeartbeat] = useState(() => new Date());

  // Simulate live status updates to convey active monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartbeat(new Date());
      setPipelines((prev) =>
        prev.map((pipeline) => {
          if (pipeline.status === "deploying") {
            return { ...pipeline, status: "healthy" };
          }

          if (pipeline.status === "queued") {
            return { ...pipeline, status: "deploying" };
          }

          return pipeline;
        })
      );
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const bus = orchestrator.eventBus;
    const unsubscribe = bus.on(
      "deployment:status",
      (payload: Phase9DeploymentStatus & { prNumber: number }) => {
        const environment = payload.environment ?? "staging";
        const status = payload.status;
        const rawTimestamp = (payload.updatedAt ??
          payload.createdAt ??
          new Date()) as unknown;
        let timestampSource: Date;
        if (rawTimestamp instanceof Date) {
          timestampSource = rawTimestamp;
        } else if (
          typeof rawTimestamp === "string" ||
          typeof rawTimestamp === "number"
        ) {
          timestampSource = new Date(rawTimestamp);
        } else {
          timestampSource = new Date();
        }
        const timestamp = timestampSource.toISOString();
        const pipelineId = normalizePipelineId(environment);

        setIsDeploying(status === "pending" || status === "running");

        setPipelines((prev) => {
          const pipelineStatus = mapStatusToPipelineStatus(payload);
          const existingIndex = prev.findIndex(
            (pipeline) => pipeline.id === pipelineId,
          );

          const updatedPipeline: Pipeline =
            existingIndex >= 0
              ? {
                  ...prev[existingIndex],
                  status: pipelineStatus,
                  lastDeploymentAt: timestamp,
                  version: resolvePipelineVersion(payload, prev[existingIndex].version),
                }
              : {
                  id: pipelineId,
                  name: formatEnvironment(environment),
                  branch: environment === "production" ? "main" : environment,
                  status: pipelineStatus,
                  version: resolvePipelineVersion(payload),
                  lastDeploymentAt: timestamp,
                  changeCount: 0,
                  reviewerCount: 0,
                  qualityScore: 0,
                };

          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = updatedPipeline;
            return next;
          }
          return [...prev, updatedPipeline];
        });

        setDeploymentHistory((prev) => {
          const actor = "Phase9 Orchestrator";
          const summary = buildDeploymentSummaryFromPayload(payload);
          const entry: DeploymentEvent = {
            id: payload.deploymentId ?? `deployment-${timestampSource.getTime()}`,
            timestamp,
            environment: formatEnvironment(environment),
            actor,
            result: mapStatusToHistoryResult(payload),
            summary,
          };
          const existingIndex = prev.findIndex(
            (item) => item.id === entry.id && item.timestamp === entry.timestamp,
          );
          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = entry;
            return next;
          }
          return [entry, ...prev].slice(0, 20);
        });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [orchestrator]);

  const latestSuccessfulDeployment = useMemo(
    () => deploymentHistory.find((event) => event.result === "success"),
    [deploymentHistory]
  );

  const handleManualDeploy = () => {
    if (isDeploying) return;

    setIsDeploying(true);
    const startedAt = new Date();

    setDeploymentHistory((prev) => [
      {
        id: `evt-${Date.now()}`,
        timestamp: startedAt.toISOString(),
        environment: "Production",
        actor: "Manual Trigger",
        result: "in-progress",
        summary: "Manual deployment pipeline triggered from dashboard UI.",
      },
      ...prev,
    ]);

    setTimeout(() => {
      setIsDeploying(false);
      setDeploymentHistory((prev) => [
        {
          id: `evt-${Date.now() + 1}`,
          timestamp: new Date().toISOString(),
          environment: "Production",
          actor: "DeploymentAgent",
          result: "success",
          summary: "Manual deployment finished with automated checks.",
        },
        ...prev.slice(1),
      ]);

      setPipelines((prev) =>
        prev.map((pipeline) =>
          pipeline.id === "prod"
            ? {
                ...pipeline,
                status: "healthy",
                version: `v9.3.${Math.floor(Math.random() * 9) + 1}`,
                lastDeploymentAt: new Date().toISOString(),
                changeCount: Math.floor(Math.random() * 6),
              }
            : pipeline
        )
      );
    }, 2800);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-start justify-between p-8 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Phase 9 Deployment Control
          </h1>
          <p className="text-sm font-light text-gray-500">
            Live visibility across auto-merge gates, manual triggers, and
            release quality.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-light text-gray-500">
            Last sync:{" "}
            <span className="text-gray-900">
              {heartbeat.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
          <button
            onClick={handleManualDeploy}
            disabled={isDeploying}
            className={`px-5 py-3 rounded-xl text-sm font-light flex items-center space-x-2 transition-all duration-200 ${
              isDeploying
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            <Play size={18} />
            <span>{isDeploying ? "Triggering..." : "Manual Deploy"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-8 p-8 overflow-y-auto">
        <section className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-gray-900 mb-1">
                  Deployment Status
                </h2>
                <p className="text-xs font-light text-gray-500">
                  Pipeline state across production surfaces.
                </p>
              </div>
              {latestSuccessfulDeployment && (
                <div className="text-xs font-light text-gray-500">
                  Latest success ·{" "}
                  <span className="text-gray-900">
                    {formatTimestamp(latestSuccessfulDeployment.timestamp)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {pipelines.map((pipeline) => {
                const status = STATUS_STYLES[pipeline.status];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={pipeline.id}
                    className="border border-gray-200 rounded-2xl p-5 bg-gray-50 hover:bg-white transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                          <h3 className="text-lg font-light text-gray-900">
                            {pipeline.name}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-3 text-xs font-light text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Rocket size={14} />
                            <span>{pipeline.branch}</span>
                          </span>
                          <span className="text-gray-400">·</span>
                          <span>Version {pipeline.version}</span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-medium ${status.badge}`}
                      >
                        <StatusIcon size={14} />
                        <span>{status.label}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-light text-gray-500">
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <span className="uppercase tracking-wide text-gray-400">
                          Recent Changes
                        </span>
                        <p className="text-2xl font-light text-gray-900 mt-2">
                          {pipeline.changeCount}
                        </p>
                        <p className="mt-1">pending auto-merge evaluation</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <span className="uppercase tracking-wide text-gray-400">
                          Reviewers
                        </span>
                        <p className="text-2xl font-light text-gray-900 mt-2">
                          {pipeline.reviewerCount}
                        </p>
                        <p className="mt-1">required approvals met</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <span className="uppercase tracking-wide text-gray-400">
                          Last Deploy
                        </span>
                        <p className="text-2xl font-light text-gray-900 mt-2">
                          {new Date(
                            pipeline.lastDeploymentAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="mt-1">local time on {pipeline.branch}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-light text-gray-900 mb-1">
                  Deployment History
                </h2>
                <p className="text-xs font-light text-gray-500">
                  Timeline of the most recent deployments across environments.
                </p>
              </div>
              <History size={18} className="text-gray-400" />
            </div>

            <div className="space-y-4">
              {deploymentHistory.map((event, index) => {
                const statusChip =
                  event.result === "success"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : event.result === "warning"
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : event.result === "failed"
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-blue-100 text-blue-700 border border-blue-200";

                return (
                  <div
                    key={event.id}
                    className="flex items-start space-x-4 bg-white border border-gray-200 rounded-2xl p-4"
                  >
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                      {index !== deploymentHistory.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900">
                            {event.environment}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-medium ${statusChip}`}
                          >
                            {event.result === "success"
                              ? "Success"
                              : event.result === "warning"
                              ? "Needs Review"
                              : event.result === "failed"
                              ? "Failed"
                              : "In Progress"}
                          </span>
                        </div>
                        <span className="text-xs font-light text-gray-400">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs font-light text-gray-500 mb-2">
                        {event.summary}
                      </p>
                      <span className="inline-flex items-center space-x-2 text-[11px] font-light text-gray-400">
                        <Activity size={14} />
                        <span>Actor: {event.actor}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="border border-gray-200 rounded-3xl p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-gray-900 mb-1">
                  Quality Score Overview
                </h2>
                <p className="text-xs font-light text-gray-500">
                  Aggregated quality gates powering auto-merge decisions.
                </p>
              </div>
              <TrendingUp size={18} className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {QUALITY_METRICS.map((metric) => (
                <div
                  key={metric.id}
                  className="border border-gray-200 rounded-2xl p-5 bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {metric.label}
                      </h3>
                      <p className="text-xs font-light text-gray-500 mt-1">
                        {metric.description}
                      </p>
                    </div>
                    <div className="relative w-20 h-20">
                      <div
                        className="w-20 h-20 rounded-full"
                        style={{
                          background: `conic-gradient(#111827 ${
                            metric.score * 3.6
                          }deg, #e5e7eb ${metric.score * 3.6}deg)`,
                        }}
                      ></div>
                      <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                        <span className="text-lg font-light text-gray-900">
                          {metric.score}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-light text-gray-500">
                    <div>
                      Current ·{" "}
                      <span className="text-gray-900">{metric.score}%</span>
                    </div>
                    <div>
                      Target ·{" "}
                      <span className="text-gray-900">{metric.target}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 rounded-3xl p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-light text-gray-900 mb-1">
                  Auto-Merge Snapshot
                </h2>
                <p className="text-xs font-light text-gray-500">
                  Summary of Phase 9 thresholds aligned with settings panel.
                </p>
              </div>
              <CheckCircle size={18} className="text-emerald-500" />
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <span className="uppercase text-[11px] tracking-wide text-gray-400">
                  Auto-Merge Status
                </span>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-gray-900">
                    Enabled · Phase 9 Thresholds
                  </span>
                </div>
                <p className="text-xs font-light text-gray-500 mt-2">
                  Raised reviewer confidence and quality gate to 85% for
                  production stability.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <span className="uppercase text-[11px] tracking-wide text-gray-400">
                  Current Gate
                </span>
                <ul className="mt-2 space-y-1 text-xs font-light text-gray-500">
                  <li>• Minimum quality score: 85%</li>
                  <li>• Reviewer approval threshold: 2 senior reviewers</li>
                  <li>• Drift tolerance: &lt; 1.5%</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <span className="uppercase text-[11px] tracking-wide text-gray-400">
                  Upcoming Changes
                </span>
                <p className="text-xs font-light text-gray-500 mt-2">
                  Phase 10 introduces canary verification. Monitor staging
                  signals before increasing release cadence.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function normalizePipelineId(environment: string): string {
  const value = environment.toLowerCase();
  if (value.startsWith("prod")) return "prod";
  if (value.startsWith("stag")) return "staging";
  if (value.startsWith("sand")) return "sandbox";
  return value;
}

function resolvePipelineVersion(
  payload: Phase9DeploymentStatus & { prNumber: number },
  previous?: string,
): string {
  const extended = payload as Phase9DeploymentStatus & {
    version?: string;
    releaseTag?: string;
    displayVersion?: string;
    metadata?: Record<string, unknown>;
  };

  const metadata =
    extended.metadata && typeof extended.metadata === "object"
      ? (extended.metadata as Record<string, unknown>)
      : {};

  const candidateKeys = [
    "version",
    "displayVersion",
    "releaseTag",
    "releaseVersion",
    "artifactVersion",
    "artifactTag",
    "gitTag",
    "gitSha",
    "semver",
  ] as const;

  for (const key of candidateKeys) {
    const fromPayload = (extended as Record<string, unknown>)[key];
    if (typeof fromPayload === "string" && fromPayload.trim().length > 0) {
      return fromPayload.trim();
    }

    const fromMetadata = metadata[key];
    if (typeof fromMetadata === "string" && fromMetadata.trim().length > 0) {
      return fromMetadata.trim();
    }
  }

  if (typeof previous === "string" && previous.trim().length > 0) {
    return previous.trim();
  }

  if (typeof payload.id === "string" && payload.id.trim().length > 0) {
    return payload.id.trim();
  }

  if (typeof payload.prNumber === "number" && Number.isFinite(payload.prNumber)) {
    return `PR #${payload.prNumber}`;
  }

  return payload.deploymentId ?? "unknown";
}

function buildDeploymentSummaryFromPayload(
  payload: Phase9DeploymentStatus & { prNumber: number },
): string {
  const prNumber =
    typeof payload.prNumber === "number" && Number.isFinite(payload.prNumber)
      ? payload.prNumber
      : undefined;

  if (payload.error) {
    if (prNumber !== undefined) {
      return `Deployment error for PR #${prNumber}: ${payload.error}`;
    }
    return `Deployment error: ${payload.error}`;
  }

  const rawMessage = typeof payload.message === "string" ? payload.message.trim() : "";
  if (rawMessage.length > 0) {
    const normalized = ensureTerminalPunctuation(rawMessage);
    if (prNumber !== undefined && !containsPrReference(normalized, prNumber)) {
      const withoutTerminal = normalized.replace(/([.!?])\s*$/, "");
      return `${withoutTerminal} for PR #${prNumber}.`;
    }
    return normalized;
  }

  return buildDeploymentSummary(payload.status, payload.phase, prNumber);
}

function mapStatusToPipelineStatus(
  status: Phase9DeploymentStatus,
): PipelineStatus {
  const statusValue =
    typeof status.status === "string" ? status.status.toLowerCase() : "";
  const phaseValue =
    typeof status.phase === "string" ? status.phase.toLowerCase() : "";

  switch (statusValue) {
    case "success":
    case "completed":
    case "rollback_succeeded":
      return "healthy";
    case "failed":
    case "rollback_failed":
      return "error";
    case "pending":
    case "queued":
      return "queued";
    case "running":
      return phaseValue === "rollback" ? "error" : "deploying";
    case "deploying_staging":
    case "smoke_testing":
    case "promoting":
    case "rollback_initiated":
      return "deploying";
    default:
      break;
  }

  switch (phaseValue) {
    case "rollback":
      return "error";
    case "rollback_failed":
      return "error";
    case "rollback_succeeded":
      return "healthy";
    case "queued":
      return "queued";
    case "deploying_staging":
    case "smoke_testing":
    case "promoting":
    case "rollback_initiated":
      return "deploying";
    default:
      return "deploying";
  }
}

function mapStatusToHistoryResult(
  status: Phase9DeploymentStatus,
): DeploymentEvent["result"] {
  const statusValue =
    typeof status.status === "string" ? status.status.toLowerCase() : "";
  const phaseValue =
    typeof status.phase === "string" ? status.phase.toLowerCase() : "";

  switch (statusValue) {
    case "success":
    case "completed":
      return phaseValue === "rollback" ? "warning" : "success";
    case "rollback_succeeded":
      return "warning";
    case "failed":
    case "rollback_failed":
      return "failed";
    case "pending":
    case "queued":
      return "in-progress";
    case "running":
      return phaseValue === "rollback" ? "warning" : "in-progress";
    case "deploying_staging":
    case "smoke_testing":
    case "promoting":
    case "rollback_initiated":
      return "in-progress";
    default:
      break;
  }

  switch (phaseValue) {
    case "rollback_failed":
      return "failed";
    case "rollback_succeeded":
      return "warning";
    case "rollback":
    case "deploying_staging":
    case "smoke_testing":
    case "promoting":
    case "rollback_initiated":
    case "queued":
      return "in-progress";
    default:
      return "in-progress";
  }
}

function buildDeploymentSummary(
  status: Phase9DeploymentStatus["status"],
  phase?: Phase9DeploymentStatus["phase"],
  prNumber?: number,
): string {
  const statusLabel = humanize(status);
  const phaseLabel = phase ? ` – ${humanize(phase)}` : "";
  const prLabel =
    typeof prNumber === "number" && Number.isFinite(prNumber)
      ? ` for PR #${prNumber}`
      : "";
  return `Deployment ${statusLabel}${phaseLabel}${prLabel}.`;
}

function ensureTerminalPunctuation(text: string): string {
  return /[.!?]\s*$/.test(text) ? text : `${text}.`;
}

function containsPrReference(text: string, prNumber: number): boolean {
  const regex = new RegExp(`PR\\s*#?${prNumber}\\b`, "i");
  return regex.test(text);
}

function humanize(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatEnvironment(environment: string): string {
  if (!environment) return "Unknown";
  return environment.charAt(0).toUpperCase() + environment.slice(1).toLowerCase();
}
export default DeploymentDashboard;
