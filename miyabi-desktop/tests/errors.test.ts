import { describe, it, expect } from "vitest";
import {
  ERROR_MESSAGES,
  getErrorInfo,
  resolveError,
  isTransientError,
  toAgentExecutionError,
} from "../src/lib/errors";

describe("errors catalog", () => {
  it("returns defined error info for known code", () => {
    const info = getErrorInfo("github_token_invalid");
    expect(info.title).toContain("GitHub Token");
    expect(info.code).toBe("github_token_invalid");
    expect(info.actions.length).toBeGreaterThan(0);
  });

  it("falls back to unknown error for undefined code", () => {
    const info = getErrorInfo("nonexistent_code");
    expect(info.code).toBe("nonexistent_code");
    expect(info.title).toBe(ERROR_MESSAGES.unknown_error.title);
  });
});

describe("resolveError", () => {
  it("detects code from string message", () => {
    const resolution = resolveError("GitHub API rate limit exceeded");
    expect(resolution.code).toBe("github_api_rate_limit");
    expect(resolution.info.severity).toBe("warning");
  });

  it("detects code from error object with message", () => {
    const resolution = resolveError(new Error("Worktree creation failed due to permission denied"));
    expect(resolution.code).toBe("worktree_creation_failed");
  });

  it("uses fallback when message is not recognised", () => {
    const resolution = resolveError(new Error("Unexpected issue"), "agent_execution_failed");
    expect(resolution.code).toBe("agent_execution_failed");
  });
});

describe("transient error classification", () => {
  it("flags rate limit as transient", () => {
    expect(isTransientError("github_api_rate_limit")).toBe(true);
  });

  it("does not flag permission errors as transient", () => {
    expect(isTransientError("permission_denied")).toBe(false);
  });
});

describe("AgentExecutionError conversion", () => {
  it("preserves existing AgentExecutionError", () => {
    const existing = toAgentExecutionError("Network timeout occurred", "network_timeout");
    const rewrapped = toAgentExecutionError(existing);
    expect(rewrapped).toBe(existing);
  });

  it("wraps unknown errors with fallback code", () => {
    const wrapped = toAgentExecutionError({ message: "Something unexpected" }, "agent_execution_failed");
    expect(wrapped.code).toBe("agent_execution_failed");
    expect(wrapped.message.length).toBeGreaterThan(0);
  });
});
