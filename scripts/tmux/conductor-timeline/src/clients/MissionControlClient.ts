/**
 * Mission Control API client
 *
 * Handles delivery of timeline reports to the Mission Control web API with
 * retry and timeout support.
 */

import { setTimeout as delay } from 'node:timers/promises';
import type { TimelineReport, TimelineEvent, AgentPaneInfo, CompletedTask, ConductorStatus } from '../types/index.js';

/**
 * Configuration for the Mission Control client
 */
export interface MissionControlClientConfig {
  baseUrl: string;
  token?: string;
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface MissionControlClientOptions extends MissionControlClientConfig {
  persistedLocally: boolean;
}

export interface MissionControlIngestResponse {
  status: string;
  stored: boolean;
  path?: string;
}

interface MissionControlPayload {
  generated_at: string;
  session_name: string;
  agent_states: {
    total: number;
    run: number;
    idle: number;
    dead: number;
    agents: Array<AgentPaneInfoPayload>;
  };
  recent_events: Array<TimelineEventPayload>;
  recent_completions: Array<CompletedTaskPayload>;
  conductor_status?: ConductorStatusPayload;
  persisted_locally: boolean;
  version: string;
}

interface AgentPaneInfoPayload {
  pane_id: string;
  pane_title: string;
  agent_name: string | null;
  agent_type: string | null;
  state: string;
  current_command: string;
  pid: number;
  last_activity?: string;
}

interface TimelineEventPayload {
  timestamp: string;
  event_type: TimelineEvent['event_type'];
  agent_id: string;
  agent_name?: string;
  issue_number?: number;
  task_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

interface CompletedTaskPayload {
  issue: number;
  agent: string;
  title: string;
}

interface ConductorStatusPayload {
  conductor_name: string;
  last_cycle: number;
  last_activity: string;
  mode: string;
}

/**
 * Convert a timeline report into an API payload
 */
export function toMissionControlPayload(report: TimelineReport, persistedLocally: boolean): MissionControlPayload {
  return {
    generated_at: report.generated_at.toISOString(),
    session_name: report.session_name,
    agent_states: {
      total: report.agent_states.total,
      run: report.agent_states.run,
      idle: report.agent_states.idle,
      dead: report.agent_states.dead,
      agents: report.agent_states.agents.map((agent: AgentPaneInfo): AgentPaneInfoPayload => ({
        pane_id: agent.pane_id,
        pane_title: agent.pane_title,
        agent_name: agent.agent_name,
        agent_type: agent.agent_type,
        state: agent.state,
        current_command: agent.current_command,
        pid: agent.pid,
        last_activity: agent.last_activity ? agent.last_activity.toISOString() : undefined,
      })),
    },
    recent_events: report.recent_events.map((event: TimelineEvent): TimelineEventPayload => ({
      timestamp: event.timestamp.toISOString(),
      event_type: event.event_type,
      agent_id: event.agent_id,
      agent_name: event.agent_name,
      issue_number: event.issue_number,
      task_id: event.task_id,
      description: event.description,
      metadata: event.metadata,
    })),
    recent_completions: report.recent_completions.map(
      (task: CompletedTask): CompletedTaskPayload => ({
        issue: task.issue,
        agent: task.agent,
        title: task.title,
      }),
    ),
    conductor_status: report.conductor_status
      ? toConductorStatusPayload(report.conductor_status)
      : undefined,
    persisted_locally: persistedLocally,
    version: '2025-11-05',
  };
}

function toConductorStatusPayload(status: ConductorStatus): ConductorStatusPayload {
  return {
    conductor_name: status.conductor_name,
    last_cycle: status.last_cycle,
    last_activity: status.last_activity.toISOString(),
    mode: status.mode,
  };
}

/**
 * Mission Control API client with retry logic.
 */
export class MissionControlClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly retries: number;
  private readonly backoffMs: number;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: MissionControlClientConfig) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.token = options.token;
    this.retries = options.retries ?? 3;
    this.backoffMs = options.backoffMs ?? 2000;
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.fetchImpl = options.fetchImpl ?? fetch;

    if (!this.baseUrl) {
      throw new Error('MissionControlClient requires a baseUrl');
    }
  }

  /**
   * Send a timeline report to the Mission Control API.
   */
  async sendTimeline(report: TimelineReport, persistedLocally: boolean): Promise<MissionControlIngestResponse> {
    const payload = toMissionControlPayload(report, persistedLocally);
    const endpoint = `${this.baseUrl}/timeline/events`;

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await this.fetchImpl(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const body = await safeReadBody(response);
          throw new Error(
            `Mission Control API responded with status ${response.status}: ${body ?? 'no response body'}`,
          );
        }

        const json = (await response.json()) as MissionControlIngestResponse;
        return json;
      } catch (error) {
        lastError = error;

        if (attempt === this.retries) {
          throw error;
        }

        const backoff = this.backoffMs * Math.pow(2, attempt);
        await delay(backoff);
      }
    }

    throw lastError ?? new Error('Mission Control API request failed');
  }
}

async function safeReadBody(response: any): Promise<string | undefined> {
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}
