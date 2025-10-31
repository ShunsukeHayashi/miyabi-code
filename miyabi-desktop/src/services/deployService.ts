import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { EventEmitter } from "events";
import type { ServiceAccount } from "firebase-admin";
import {
  App,
  AppOptions,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import {
  Firestore,
  Timestamp,
  getFirestore,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
} from "firebase-admin/firestore";
import {
  getFunctions,
  TaskQueue,
  TaskOptions,
} from "firebase-admin/functions";

/**
 * Supported deployment environments for Phase 9.
 */
export type DeploymentEnvironment = "staging" | "production";

/**
 * Deployment pipeline phases tracked in Firestore.
 */
export type DeploymentPhase =
  | "queued"
  | "deploying_staging"
  | "smoke_testing"
  | "promoting"
  | "completed"
  | "failed"
  | "rollback_initiated"
  | "rollback_succeeded"
  | "rollback_failed";

interface DeploymentStatusRecord {
  deploymentId: string;
  prNumber: number;
  status: DeploymentPhase;
  environment: DeploymentEnvironment;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
  error?: string;
  smokeTestResult?: SmokeTestRecord;
  metadata?: Record<string, unknown>;
}

interface SmokeTestRecord {
  passed: boolean;
  summary?: string;
  failures?: string[];
  startedAt?: Timestamp | Date | string;
  completedAt?: Timestamp | Date | string;
  metrics?: Record<string, unknown>;
}

export interface SmokeTestResult {
  passed: boolean;
  summary?: string;
  failures?: string[];
  startedAt?: Date;
  completedAt?: Date;
  metrics?: Record<string, unknown>;
}

export interface DeploymentStatus {
  deploymentId: string;
  prNumber: number;
  status: DeploymentPhase;
  environment: DeploymentEnvironment;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  smokeTestResult?: SmokeTestResult;
  metadata?: Record<string, unknown>;
}

export interface NotificationConfig {
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  /**
   * Optional whitelist of phases for which notifications should be sent.
   * Defaults to ["completed", "failed", "rollback_failed"].
   */
  notifyOn?: DeploymentPhase[];
  /**
   * Override display name for Slack or Discord webhook payloads.
   */
  username?: string;
  /**
   * Optional emoji/icon override for Slack notifications.
   */
  iconEmoji?: string;
}

export interface DeploymentEngineConfig {
  projectId: string;
  appName?: string;
  serviceAccount?: ServiceAccount;
  serviceAccountJsonPath?: string;
  region?: string;
  deployQueueName: string;
  statusCollectionPath: string;
  smokeTestQueueName?: string;
  rollbackQueueName?: string;
  notifications?: NotificationConfig;
  /**
   * Enable Firestore realtime monitoring. Defaults to true.
   */
  streamUpdates?: boolean;
  /**
   * Default environment recorded when triggering a deployment. Defaults to "staging".
   */
  defaultEnvironment?: DeploymentEnvironment;
  /**
   * Deadline (seconds) for deploy queue tasks before they time out.
   */
  deployDispatchDeadlineSeconds?: number;
  /**
   * Deadline (seconds) for smoke test queue tasks.
   */
  smokeTestDispatchDeadlineSeconds?: number;
  /**
   * Deadline (seconds) for rollback queue tasks.
   */
  rollbackDispatchDeadlineSeconds?: number;
}

interface DeploymentTriggerPayload {
  deploymentId: string;
  prNumber: number;
  targetEnvironment: DeploymentEnvironment;
  requestedAt: string;
  notifications?: {
    slackWebhookUrl?: string;
    discordWebhookUrl?: string;
  };
}

interface SmokeTestPayload {
  deploymentId: string;
  prNumber: number;
  requestedAt: string;
}

interface RollbackPayload {
  deploymentId: string;
  prNumber: number;
  reason?: string;
  requestedAt: string;
}

export type DeploymentStatusListener = (status: DeploymentStatus) => void;

/**
 * Phase 9 deployment orchestrator. Handles Firebase Functions task queues, status monitoring,
 * smoke tests, and notification fan-out without coupling to the desktop UI layer.
 */
export class DeploymentEngine {
  private readonly app: App;
  private readonly firestore: Firestore;
  private readonly deployQueue: TaskQueue<DeploymentTriggerPayload>;
  private readonly smokeTestQueue?: TaskQueue<SmokeTestPayload>;
  private readonly rollbackQueue?: TaskQueue<RollbackPayload>;
  private readonly emitter = new EventEmitter();
  private statusUnsubscribe?: () => void;
  private currentDeploymentId?: string;
  private currentPrNumber?: number;
  private lastNotifiedPhase?: DeploymentPhase;

  constructor(private readonly config: DeploymentEngineConfig) {
    this.app = this.initializeFirebaseApp();
    this.firestore = getFirestore(this.app);
    this.deployQueue = this.createTaskQueue<DeploymentTriggerPayload>(
      config.deployQueueName,
    );

    if (config.smokeTestQueueName) {
      this.smokeTestQueue = this.createTaskQueue<SmokeTestPayload>(
        config.smokeTestQueueName,
      );
    }

    if (config.rollbackQueueName) {
      this.rollbackQueue = this.createTaskQueue<RollbackPayload>(
        config.rollbackQueueName,
      );
    }
  }

  /**
   * Dispatches a deployment task to the Firebase Functions queue and seeds an initial status document.
   */
  async triggerDeployment(prNumber: number): Promise<string> {
    if (!Number.isInteger(prNumber) || prNumber <= 0) {
      throw new Error("PR number must be a positive integer");
    }

    const deploymentId = `${prNumber}-${randomUUID()}`;
    const now = new Date();
    const targetEnvironment = this.config.defaultEnvironment ?? "staging";

    const payload: DeploymentTriggerPayload = {
      deploymentId,
      prNumber,
      targetEnvironment,
      requestedAt: now.toISOString(),
      notifications: this.resolveNotificationChannels(),
    };

    await this.deployQueue.enqueue(
      payload,
      this.buildEnqueueOptions(this.config.deployDispatchDeadlineSeconds),
    );

    const statusDoc = this.getStatusDocument(deploymentId);

    await statusDoc.set(
      {
        deploymentId,
        prNumber,
        status: "queued",
        environment: targetEnvironment,
        createdAt: now,
        updatedAt: now,
        metadata: {
          requestedBy: "miyabi-desktop",
        },
      },
      { merge: true },
    );

    this.currentDeploymentId = deploymentId;
    this.currentPrNumber = prNumber;
    this.lastNotifiedPhase = undefined;

    if (this.config.streamUpdates !== false) {
      this.startStatusListener(deploymentId);
    }

    await this.sendNotifications(
      `🚀 Deployment requested for PR #${prNumber} (${deploymentId})`,
      {
        deploymentId,
        prNumber,
        status: "queued",
        environment: targetEnvironment,
        createdAt: now,
        updatedAt: now,
      },
    );

    return deploymentId;
  }

  /**
   * Fetches the latest deployment status snapshot from Firestore.
   */
  async checkDeployStatus(deploymentId?: string): Promise<DeploymentStatus | null> {
    const id = this.ensureDeploymentId(deploymentId);
    const snapshot = await this.getStatusDocument(id).get();

    if (!snapshot.exists) {
      return null;
    }

    const record = snapshot.data();
    if (!record) {
      return null;
    }
    const status = this.mapStatusRecord(record);
    this.emitter.emit("status", status);
    return status;
  }

  /**
   * Enqueues a rollback request for the active deployment when failures occur.
   */
  async rollbackOnFailure(
    deploymentId?: string,
    reason?: string,
  ): Promise<void> {
    const id = this.ensureDeploymentId(deploymentId);

    if (!this.rollbackQueue) {
      throw new Error("Rollback queue is not configured for this deployment engine");
    }

    const now = new Date();

    await this.rollbackQueue.enqueue(
      {
        deploymentId: id,
        prNumber: this.currentPrNumber ?? -1,
        reason,
        requestedAt: now.toISOString(),
      },
      this.buildEnqueueOptions(this.config.rollbackDispatchDeadlineSeconds),
    );

    await this.getStatusDocument(id).set(
      {
        status: "rollback_initiated",
        updatedAt: now,
        error: reason ?? "Rollback requested by DeploymentEngine",
      },
      { merge: true },
    );

    await this.sendNotifications(
      `⛔️ Rollback requested for deployment ${id}${
        reason ? `: ${reason}` : ""
      }`,
      {
        deploymentId: id,
        prNumber: this.currentPrNumber ?? -1,
        status: "rollback_initiated",
        environment: this.config.defaultEnvironment ?? "staging",
        createdAt: now,
        updatedAt: now,
        error: reason,
      },
    );
  }

  /**
   * Runs post-deploy smoke tests via a dedicated Firebase Functions queue.
   */
  async runSmokeTests(deploymentId?: string): Promise<void> {
    const id = this.ensureDeploymentId(deploymentId);

    if (!this.smokeTestQueue) {
      throw new Error("Smoke test queue is not configured for this deployment engine");
    }

    const now = new Date();

    await this.smokeTestQueue.enqueue(
      {
        deploymentId: id,
        prNumber: this.currentPrNumber ?? -1,
        requestedAt: now.toISOString(),
      },
      this.buildEnqueueOptions(this.config.smokeTestDispatchDeadlineSeconds),
    );

    await this.getStatusDocument(id).set(
      {
        status: "smoke_testing",
        updatedAt: now,
      },
      { merge: true },
    );

    await this.sendNotifications(
      `🧪 Smoke tests triggered for deployment ${id}`,
      {
        deploymentId: id,
        prNumber: this.currentPrNumber ?? -1,
        status: "smoke_testing",
        environment: this.config.defaultEnvironment ?? "staging",
        createdAt: now,
        updatedAt: now,
      },
    );
  }

  /**
   * Subscribe to deployment status updates.
   */
  onStatusUpdate(listener: DeploymentStatusListener): () => void {
    this.emitter.on("status", listener);
    return () => {
      this.emitter.off("status", listener);
    };
  }

  /**
   * Cleans up listeners and references for the current deployment.
   */
  dispose(): void {
    if (this.statusUnsubscribe) {
      this.statusUnsubscribe();
      this.statusUnsubscribe = undefined;
    }
    this.currentDeploymentId = undefined;
    this.currentPrNumber = undefined;
    this.lastNotifiedPhase = undefined;
    this.emitter.removeAllListeners();
  }

  private initializeFirebaseApp(): App {
    const name = this.config.appName ?? "[DEFAULT]";
    const existing = getApps().find((app) => app.name === name);

    if (existing) {
      return existing;
    }

    const options: AppOptions = {
      projectId: this.config.projectId,
    };

    if (this.config.serviceAccount) {
      options.credential = cert(this.config.serviceAccount);
    } else if (this.config.serviceAccountJsonPath) {
      const raw = readFileSync(this.config.serviceAccountJsonPath, "utf-8");
      const credentials = JSON.parse(raw) as ServiceAccount;
      options.credential = cert(credentials);
    } else {
      options.credential = applicationDefault();
    }

    return initializeApp(options, name);
  }

  private createTaskQueue<T>(queueName: string): TaskQueue<T> {
    if (this.config.region && !queueName.includes("/locations/")) {
      console.warn(
        `DeploymentEngine: region "${this.config.region}" provided but queue name "${queueName}" does not include a location segment.`,
      );
    }

    return getFunctions(this.app).taskQueue(queueName);
  }

  private buildEnqueueOptions(
    dispatchDeadlineSeconds?: number,
  ): TaskOptions | undefined {
    if (!dispatchDeadlineSeconds) {
      return undefined;
    }

    return {
      dispatchDeadlineSeconds,
    };
  }

  private ensureDeploymentId(deploymentId?: string): string {
    const id = deploymentId ?? this.currentDeploymentId;
    if (!id) {
      throw new Error(
        "Deployment ID is required. Call triggerDeployment first or provide an explicit identifier.",
      );
    }
    return id;
  }

  private startStatusListener(deploymentId: string): void {
    if (this.statusUnsubscribe) {
      this.statusUnsubscribe();
      this.statusUnsubscribe = undefined;
    }

    const docRef = this.getStatusDocument(deploymentId);

    this.statusUnsubscribe = docRef.onSnapshot(
      (snapshot: DocumentSnapshot<DeploymentStatusRecord>) => {
        if (!snapshot.exists) {
          return;
        }

        const record = snapshot.data();
        if (!record) {
          return;
        }
        const status = this.mapStatusRecord(record);
        this.emitter.emit("status", status);

        if (this.shouldNotify(status.status)) {
          this.lastNotifiedPhase = status.status;
          void this.sendNotifications(this.formatStatusMessage(status), status);
        }
      },
      (error: unknown) => {
        console.error("[DeploymentEngine] Failed to monitor deployment status", error);
      },
    );
  }

  private getStatusDocument(
    deploymentId: string,
  ): DocumentReference<DeploymentStatusRecord> {
    return this.getStatusCollection().doc(deploymentId);
  }

  private getStatusCollection(): CollectionReference<DeploymentStatusRecord> {
    return this.firestore.collection(
      this.config.statusCollectionPath,
    ) as CollectionReference<DeploymentStatusRecord>;
  }

  private mapStatusRecord(record: DeploymentStatusRecord): DeploymentStatus {
    const { createdAt, updatedAt, smokeTestResult, ...rest } = record;

    return {
      ...rest,
      createdAt: this.normalizeTimestamp(createdAt),
      updatedAt: this.normalizeTimestamp(updatedAt),
      smokeTestResult: smokeTestResult
        ? this.normalizeSmokeResult(smokeTestResult)
        : undefined,
    };
  }

  private normalizeTimestamp(
    value: Timestamp | Date | string,
  ): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }

    if (value instanceof Date) {
      return value;
    }

    return new Date(value);
  }

  private normalizeSmokeResult(record: SmokeTestRecord): SmokeTestResult {
    const { startedAt, completedAt, ...rest } = record;
    return {
      ...rest,
      startedAt: startedAt ? this.normalizeTimestamp(startedAt) : undefined,
      completedAt: completedAt ? this.normalizeTimestamp(completedAt) : undefined,
    };
  }

  private shouldNotify(phase: DeploymentPhase): boolean {
    if (!this.config.notifications) {
      return false;
    }

    if (this.lastNotifiedPhase === phase) {
      return false;
    }

    const notifyOn =
      this.config.notifications.notifyOn ?? [
        "completed",
        "failed",
        "rollback_failed",
      ];

    return notifyOn.includes(phase);
  }

  private formatStatusMessage(status: DeploymentStatus): string {
    const base = `Deployment ${status.deploymentId} (${status.environment}) → ${status.status}`;
    if (status.error) {
      return `${base}\nReason: ${status.error}`;
    }
    if (status.smokeTestResult) {
      const { passed, summary } = status.smokeTestResult;
      return `${base}\nSmoke tests: ${passed ? "passed" : "failed"}${
        summary ? ` — ${summary}` : ""
      }`;
    }
    return base;
  }

  private async sendNotifications(
    message: string,
    status: DeploymentStatus,
  ): Promise<void> {
    if (!this.config.notifications) {
      return;
    }

    const tasks: Promise<void>[] = [];

    if (this.config.notifications.slackWebhookUrl) {
      tasks.push(
        this.postJson(this.config.notifications.slackWebhookUrl, {
          text: message,
          username: this.config.notifications.username ?? "DeploymentEngine",
          icon_emoji: this.config.notifications.iconEmoji ?? ":rocket:",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${message}*\nEnvironment: ${status.environment}\nPR #${status.prNumber}`,
              },
            },
          ],
        }),
      );
    }

    if (this.config.notifications.discordWebhookUrl) {
      tasks.push(
        this.postJson(this.config.notifications.discordWebhookUrl, {
          username: this.config.notifications.username ?? "DeploymentEngine",
          content: message,
          embeds: [
            {
              title: `Deployment ${status.status}`,
              description: `PR #${status.prNumber} → ${status.environment}`,
              timestamp: status.updatedAt.toISOString(),
              color: this.mapDiscordColor(status.status),
              fields: status.error
                ? [
                    {
                      name: "Error",
                      value: status.error,
                    },
                  ]
                : undefined,
            },
          ],
        }),
      );
    }

    if (tasks.length === 0) {
      return;
    }

    const results = await Promise.allSettled(tasks);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[DeploymentEngine] Notification dispatch failed", result.reason);
      }
    }
  }

  private resolveNotificationChannels(): {
    slackWebhookUrl?: string;
    discordWebhookUrl?: string;
  } | undefined {
    if (!this.config.notifications) {
      return undefined;
    }

    const { slackWebhookUrl, discordWebhookUrl } = this.config.notifications;
    if (!slackWebhookUrl && !discordWebhookUrl) {
      return undefined;
    }

    return {
      slackWebhookUrl,
      discordWebhookUrl,
    };
  }

  private mapDiscordColor(phase: DeploymentPhase): number {
    switch (phase) {
      case "completed":
        return 0x2ecc71; // green
      case "failed":
      case "rollback_failed":
        return 0xe74c3c; // red
      case "rollback_initiated":
        return 0xf39c12; // orange
      default:
        return 0x3498db; // blue
    }
  }

  private async postJson(url: string, body: unknown): Promise<void> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Webhook request failed with status ${response.status}: ${text}`,
      );
    }
  }
}
