// tmux Client Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
  default: { execSync: vi.fn() }
}));

import { TmuxClient } from '@/tmux/client.js';

describe('TmuxClient', () => {
  let client: TmuxClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TmuxClient({
      session: 'test-session',
      target: '0.0'
    });
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(client).toBeDefined();
    });
  });

  describe('sendKeys', () => {
    it('should send keys to pane', async () => {
      vi.mocked(execSync).mockReturnValue('');

      await client.sendKeys('test-session:0.0', 'C-l');

      expect(execSync).toHaveBeenCalledWith(
        'tmux send-keys -t test-session:0.0 C-l',
        expect.objectContaining({
          encoding: 'utf-8'
        })
      );
    });

    it('should send Enter key', async () => {
      vi.mocked(execSync).mockReturnValue('');

      await client.sendKeys('test-session:0.0', 'Enter');

      expect(execSync).toHaveBeenCalledWith(
        'tmux send-keys -t test-session:0.0 Enter',
        expect.any(Object)
      );
    });
  });

  describe('sendCommand', () => {
    it('should send command to pane', async () => {
      vi.mocked(execSync)
        .mockReturnValueOnce('')
        .mockReturnValueOnce('');

      await client.sendCommand('test-session:0.0', 'test-command');

      expect(execSync).toHaveBeenCalledTimes(2);
      expect(execSync).toHaveBeenCalledWith(
        'tmux send-keys -t test-session:0.0 test-command',
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        'tmux send-keys -t test-session:0.0 Enter',
        expect.any(Object)
      );
    });

    it('should handle errors', async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('tmux not found');
      });

      await expect(client.sendCommand('test-target', 'cmd')).rejects.toThrow();
    });
  });

  describe('getPanes', () => {
    it('should get panes in session', async () => {
      // Format: #{session_id} #{window_id} #{pane_id} #{pane_pid} #{pane_current_command} #{pane_current_path}
      vi.mocked(execSync).mockReturnValue(
        '$0 @0 %0 12345 bash /path/to/dir\n$0 @1 %1 12346 zsh /path/to/dir2'
      );

      const panes = await client.getPanes('test-session');

      expect(panes).toHaveLength(2);
      expect(panes[0].sessionId).toBe(0);
      expect(panes[0].windowId).toBe(0);
      expect(panes[0].paneId).toBe(0);
      expect(panes[0].permanentId).toBe(0);
      expect(panes[0].pid).toBe(12345);
      expect(panes[0].currentPath).toBe('/path/to/dir');

      expect(panes[1].sessionId).toBe(0);
      expect(panes[1].windowId).toBe(1);
      expect(panes[1].paneId).toBe(1);
      expect(panes[1].permanentId).toBe(1);
      expect(panes[1].pid).toBe(12346);
      expect(panes[1].currentPath).toBe('/path/to/dir2');
    });

    it('should handle empty output', async () => {
      vi.mocked(execSync).mockReturnValue('');

      const panes = await client.getPanes('test-session');

      expect(panes).toHaveLength(0);
    });
  });

  describe('getAgentStatus', () => {
    it('should get status for existing agent', async () => {
      vi.mocked(execSync).mockReturnValue('some output');

      const status = await client.getAgentStatus('conductor');

      expect(status).toBeDefined();
      expect(status?.agentId).toBe('conductor');
      expect(status?.name).toBeDefined();
      expect(status?.emoji).toBeDefined();
    });

    it('should return null for unknown agent', async () => {
      const status = await client.getAgentStatus('unknown');

      expect(status).toBeNull();
    });
  });

  describe('getAllAgentStatus', () => {
    it('should get all agent statuses', async () => {
      vi.mocked(execSync).mockReturnValue('output');

      const statuses = await client.getAllAgentStatus();

      expect(statuses).toBeDefined();
      expect(statuses.length).toBeGreaterThan(0);
    });
  });

  describe('killSession', () => {
    it('should kill session', async () => {
      vi.mocked(execSync).mockReturnValue('');

      await client.killSession('test-session');

      expect(execSync).toHaveBeenCalledWith(
        'tmux kill-session -t test-session',
        expect.any(Object)
      );
    });
  });
});
