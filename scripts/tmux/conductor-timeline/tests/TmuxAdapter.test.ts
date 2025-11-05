/**
 * TmuxAdapter Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TmuxAdapter, MockShellExecutor } from '../src/adapters/TmuxAdapter.js';

describe('TmuxAdapter', () => {
  let mockExecutor: MockShellExecutor;
  let adapter: TmuxAdapter;

  beforeEach(() => {
    mockExecutor = new MockShellExecutor();
    adapter = new TmuxAdapter(mockExecutor);
  });

  describe('getPanes', () => {
    it('should parse pane information correctly', () => {
      const mockOutput = '%1|🎺 サクラ (Review)|node|12345\n%2|🌸 キキョウ (Issue)|bash|12346';
      mockExecutor.setResponse(
        'tmux list-panes -t test-session -F "#{pane_id}|#{pane_title}|#{pane_current_command}|#{pane_pid}"',
        mockOutput
      );

      const panes = adapter.getPanes('test-session');

      expect(panes).toHaveLength(2);
      expect(panes[0]).toMatchObject({
        pane_id: '%1',
        agent_name: 'サクラ',
        agent_type: 'Review',
        current_command: 'node',
        state: 'RUN',
      });
      expect(panes[1]).toMatchObject({
        pane_id: '%2',
        agent_name: 'キキョウ',
        agent_type: 'Issue',
        current_command: 'bash',
        state: 'DEAD',
      });
    });

    it('should handle empty output', () => {
      mockExecutor.setResponse(
        'tmux list-panes -t test-session -F "#{pane_id}|#{pane_title}|#{pane_current_command}|#{pane_pid}"',
        ''
      );

      const panes = adapter.getPanes('test-session');

      expect(panes).toHaveLength(0);
    });
  });

  describe('sessionExists', () => {
    it('should return true when session exists', () => {
      mockExecutor.setResponse('tmux has-session -t test-session 2>&1', '');

      const exists = adapter.sessionExists('test-session');

      expect(exists).toBe(true);
    });

    it('should return false when session does not exist', () => {
      mockExecutor.setResponse = () => {
        throw new Error('Session not found');
      };

      const exists = adapter.sessionExists('nonexistent');

      expect(exists).toBe(false);
    });
  });
});
