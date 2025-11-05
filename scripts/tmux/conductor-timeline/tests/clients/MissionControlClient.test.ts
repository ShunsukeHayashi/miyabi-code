import { MissionControlClient, toMissionControlPayload } from '../../src/clients/MissionControlClient.js';
import type { TimelineReport, AgentPaneInfo, TimelineEvent, CompletedTask, ConductorStatus } from '../../src/types/index.js';

function createReport(): TimelineReport {
  const now = new Date('2025-11-05T12:00:00Z');

  const agents: AgentPaneInfo[] = [
    {
      pane_id: '%1',
      pane_title: 'CoordinatorAgent',
      agent_name: 'CoordinatorAgent',
      agent_type: 'Coding',
      state: 'RUN',
      current_command: 'cargo run',
      pid: 1234,
      last_activity: new Date('2025-11-05T11:59:00Z'),
    },
  ];

  const events: TimelineEvent[] = [
    {
      timestamp: new Date('2025-11-05T11:58:00Z'),
      event_type: 'task_started',
      agent_id: 'coordinator',
      agent_name: 'CoordinatorAgent',
      issue_number: 757,
      task_id: 'task-757-impl',
      description: 'Started implementation',
      metadata: { priority: 'high' },
    },
  ];

  const completions: CompletedTask[] = [
    {
      issue: 754,
      agent: 'CodeGenAgent',
      title: 'Timeline CLI implementation',
    },
  ];

  const conductorStatus: ConductorStatus = {
    conductor_name: 'MissionControlConductor',
    last_cycle: 47,
    last_activity: new Date('2025-11-05T11:59:30Z'),
    mode: 'watch',
  };

  return {
    generated_at: now,
    session_name: 'miyabi-refactor',
    agent_states: {
      total: agents.length,
      run: 1,
      idle: 0,
      dead: 0,
      agents,
    },
    recent_events: events,
    recent_completions: completions,
    conductor_status: conductorStatus,
  };
}

describe('MissionControlClient', () => {
  test('toMissionControlPayload converts dates and preserves structure', () => {
    const report = createReport();
    const payload = toMissionControlPayload(report, true);

    expect(payload.generated_at).toBe('2025-11-05T12:00:00.000Z');
    expect(payload.agent_states.agents[0].last_activity).toBe('2025-11-05T11:59:00.000Z');
    expect(payload.recent_events[0].timestamp).toBe('2025-11-05T11:58:00.000Z');
    expect(payload.conductor_status?.last_activity).toBe('2025-11-05T11:59:30.000Z');
    expect(payload.persisted_locally).toBe(true);
    expect(payload.version).toBeDefined();
  });

  test('sendTimeline posts data with authentication and honors success response', async () => {
    const report = createReport();
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 202,
      async json() {
        return { status: 'accepted', stored: false, path: '/tmp/conductor.jsonl' };
      },
    }));

    const client = new MissionControlClient({
      baseUrl: 'https://mission-control.local/api',
      token: 'secret',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const response = await client.sendTimeline(report, true);

    expect(response).toEqual({ status: 'accepted', stored: false, path: '/tmp/conductor.jsonl' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    const [url, options] = (call as unknown as [
      string,
      { method: string; headers: Record<string, string> },
    ]);
    expect(url).toBe('https://mission-control.local/api/timeline/events');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer secret');
  });

  test('sendTimeline retries on failure and eventually succeeds', async () => {
    const report = createReport();
    const fetchMock = jest
      .fn()
      .mockImplementationOnce(async () => {
        throw new Error('network error');
      })
      .mockImplementationOnce(async () => ({
        ok: false,
        status: 500,
        async json() {
          return { status: 'error' };
        },
        async text() {
          return 'internal error';
        },
      }))
      .mockImplementationOnce(async () => ({
        ok: true,
        status: 202,
        async json() {
          return { status: 'accepted', stored: true, path: '/tmp/conductor.jsonl' };
        },
      }));

    const client = new MissionControlClient({
      baseUrl: 'http://localhost:8000/api',
      retries: 3,
      backoffMs: 1,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const result = await client.sendTimeline(report, false);
    expect(result).toEqual({ status: 'accepted', stored: true, path: '/tmp/conductor.jsonl' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test('sendTimeline throws after exhausting retries', async () => {
    const report = createReport();
    const fetchMock = jest.fn(async () => ({
      ok: false,
      status: 503,
      async json() {
        return { status: 'unavailable' };
      },
      async text() {
        return 'service unavailable';
      },
    }));

    const client = new MissionControlClient({
      baseUrl: 'http://localhost:8080/api',
      retries: 1,
      backoffMs: 1,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    await expect(client.sendTimeline(report, false)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
