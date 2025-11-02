// GitHub API wrapper for Tauri

import { safeInvoke, safeListen } from "./tauri-utils";

/**
 * Issue state
 */
export type IssueState = "open" | "closed" | "all";

/**
 * Issue label
 */
export interface IssueLabel {
  name: string;
  color: string;
  description?: string;
}

/**
 * GitHub Issue
 */
export interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  state: string;
  labels: IssueLabel[];
  assignees: string[];
  created_at: string;
  updated_at: string;
  html_url: string;
}

/**
 * Update issue request
 */
export interface UpdateIssueRequest {
  number: number;
  title?: string;
  body?: string;
  state?: string;
  labels?: string[];
}

/**
 * List issues from GitHub
 */
export async function listIssues(
  state?: IssueState,
  labels: string[] = []
): Promise<GitHubIssue[]> {
  const result = await safeInvoke<GitHubIssue[]>("list_issues_command", {
    state: state || null,
    labels,
  });
  return result || [];
}

/**
 * Get a single issue
 */
export async function getIssue(number: number): Promise<GitHubIssue | null> {
  return await safeInvoke<GitHubIssue>("get_issue_command", { number });
}

/**
 * Update an issue
 */
export async function updateIssue(
  request: UpdateIssueRequest
): Promise<GitHubIssue | null> {
  return await safeInvoke<GitHubIssue>("update_issue_command", { request });
}

/**
 * Listen to issue update events
 */
export async function listenToIssueUpdates(
  callback: (issue: GitHubIssue) => void
): Promise<() => void> {
  return await safeListen<GitHubIssue>("issue-updated", callback);
}

/**
 * Parse label category from label name
 * Miyabi uses prefixed labels like "📥 state:pending"
 */
export function getLabelCategory(labelName: string): string {
  const match = labelName.match(/^(?:[\p{Emoji}\uFE0F]+\s)?([^:]+):/u);
  return match ? match[1] : "other";
}

/**
 * Get label emoji
 */
export function getLabelEmoji(labelName: string): string | null {
  const match = labelName.match(/^([\p{Emoji}\uFE0F]+)/u);
  return match ? match[1] : null;
}

/**
 * Parse label value (after colon)
 */
export function getLabelValue(labelName: string): string {
  const parts = labelName.split(":");
  return parts.length > 1 ? parts[1].trim() : labelName;
}

/**
 * Group issues by state label
 */
export function groupIssuesByState(
  issues: GitHubIssue[]
): Map<string, GitHubIssue[]> {
  const groups = new Map<string, GitHubIssue[]>();

  for (const issue of issues) {
    const stateLabel = issue.labels.find((l) =>
      l.name.startsWith("📥 state:")
    );
    const state = stateLabel ? getLabelValue(stateLabel.name) : "unknown";

    if (!groups.has(state)) {
      groups.set(state, []);
    }
    groups.get(state)!.push(issue);
  }

  return groups;
}

/**
 * Miyabi state labels (from 57-label system)
 */
export const MIYABI_STATE_LABELS = [
  { name: "📥 state:pending", displayName: "Pending" },
  { name: "🔄 state:in-progress", displayName: "In Progress" },
  { name: "👀 state:in-review", displayName: "In Review" },
  { name: "✅ state:done", displayName: "Done" },
  { name: "❌ state:blocked", displayName: "Blocked" },
  { name: "🚫 state:wont-fix", displayName: "Won't Fix" },
] as const;

/**
 * Get state display name
 */
export function getStateDisplayName(stateLabelName: string): string {
  const state = MIYABI_STATE_LABELS.find((s) => s.name === stateLabelName);
  return state ? state.displayName : getLabelValue(stateLabelName);
}
