/**
 * Type definitions for deployService
 * Separated to avoid importing Node.js modules in browser code
 */

export type LegacyDeploymentPhase =
  | "queued"
  | "deploying_staging"
  | "smoke_testing"
  | "promoting"
  | "rollback_initiated"
  | "rollback_succeeded"
  | "rollback_failed";

export type DeploymentPhase =
  | "staging"
  | "production"
  | "canary"
  | "rollback"
  | "health-check"
  | LegacyDeploymentPhase;

export type DeploymentStatusValue =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "completed"
  | LegacyDeploymentPhase;

export type DeploymentStatus = {
  id?: string;
  deploymentId?: string;
  prNumber?: number;
  phase?: DeploymentPhase | string;
  status: DeploymentStatusValue;
  message?: string;
  environment?: string;
  timestamp?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  error?: string;
};
