/**
 * Tmux Adapter Tests
 */

import { TmuxAdapter, MockShellExecutor } from '../adapters/tmux-adapter';
import type { TmuxPane } from '../types';

describe('TmuxAdapter', () => {
  describe('listPanes', () => {
    it('should parse tmux panes output correctly', () => {
      const mockExecutor = new MockShellExecutor();
      mockExecutor.setResponse(
        'tmux list-panes -t Miyabi -F "#{pane_id}|#{window_name}|#{pane_title}|#{pane_pid}|#{pane_active}|#{pane_width}|#{pane_height}|#{pane_current_path}"',
        '%1|Miyabi|🌸 カエデ (Implementation)|12345|1|120|30|/Users/test\n%2|Miyabi|🎺 サクラ (Review)|12346|0|120|30|/Users/test'
      );

      const adapter = new TmuxAdapter(mockExecutor);
      const panes = adapter.listPanes('Miyabi');

      expect(panes).toHaveLength(2);
      expect(panes[0]).toEqual({
        id: '%1',
        window: 'Miyabi',
        title: '🌸 カエデ (Implementation)',
        pid: 12345,
        active: true,
        width: 120,
        height: 30,
        currentPath: '/Users/test',
      });
      expect(panes[1]).toEqual({
        id: '%2',
        window: 'Miyabi',
        title: '🎺 サクラ (Review)',
        pid: 12346,
        active: false,
        width: 120,
        height: 30,
        currentPath: '/Users/test',
      });
    });

    it('should return empty array when no panes found', () => {
      const mockExecutor = new MockShellExecutor();
      mockExecutor.setResponse(
        'tmux list-panes -t NonExistent -F "#{pane_id}|#{window_name}|#{pane_title}|#{pane_pid}|#{pane_active}|#{pane_width}|#{pane_height}|#{pane_current_path}"',
        ''
      );

      const adapter = new TmuxAdapter(mockExecutor);
      const panes = adapter.listPanes('NonExistent');

      expect(panes).toEqual([]);
    });
  });

  describe('extractAgentName', () => {
    it('should extract agent name from pane title with parentheses', () => {
      const adapter = new TmuxAdapter();

      expect(adapter.extractAgentName('🌸 カエデ (Implementation)')).toBe('カエデ');
      expect(adapter.extractAgentName('🎺 サクラ (Review)')).toBe('サクラ');
      expect(adapter.extractAgentName('🌼 ツバキ (Testing)')).toBe('ツバキ');
    });

    it('should extract agent name from pane title without parentheses', () => {
      const adapter = new TmuxAdapter();

      expect(adapter.extractAgentName('🌸 カエデ')).toBe('カエデ');
      expect(adapter.extractAgentName('🎺 サクラ')).toBe('サクラ');
    });

    it('should return undefined for invalid pane titles', () => {
      const adapter = new TmuxAdapter();

      expect(adapter.extractAgentName('Plain Title')).toBeUndefined();
      expect(adapter.extractAgentName('')).toBeUndefined();
    });
  });

  describe('determineAgentState', () => {
    let adapter: TmuxAdapter;
    let mockExecutor: MockShellExecutor;

    beforeEach(() => {
      mockExecutor = new MockShellExecutor();
      adapter = new TmuxAdapter(mockExecutor);
    });

    it('should return RUN for active pane with recent activity', () => {
      const pane: TmuxPane = {
        id: '%1',
        window: 'Miyabi',
        title: '🌸 カエデ (Implementation)',
        pid: 12345,
        active: true,
        width: 120,
        height: 30,
        currentPath: '/Users/test',
      };

      mockExecutor.setResponse('ps -p 12345', 'PID  TTY      TIME CMD\n12345 ??       0:01.23 node');

      const content = '[INFO] Processing task #123...\n2024-11-05 15:30:00';
      const state = adapter.determineAgentState(pane, content);

      expect(state).toBe('RUN');
    });

    it('should return IDLE for active pane without recent activity', () => {
      const pane: TmuxPane = {
        id: '%2',
        window: 'Miyabi',
        title: '🎺 サクラ (Review)',
        pid: 12346,
        active: false,
        width: 120,
        height: 30,
        currentPath: '/Users/test',
      };

      mockExecutor.setResponse('ps -p 12346', 'PID  TTY      TIME CMD\n12346 ??       0:00.50 node');

      const content = 'Waiting for tasks...';
      const state = adapter.determineAgentState(pane, content);

      expect(state).toBe('IDLE');
    });

    it('should return DEAD for terminated process', () => {
      const pane: TmuxPane = {
        id: '%3',
        window: 'Miyabi',
        title: '🌼 ツバキ (Testing)',
        pid: 99999,
        active: false,
        width: 120,
        height: 30,
        currentPath: '/Users/test',
      };

      mockExecutor.setResponse('ps -p 99999', '');

      const content = '';
      const state = adapter.determineAgentState(pane, content);

      expect(state).toBe('DEAD');
    });
  });
});
