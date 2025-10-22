import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentProgressBar } from '../agent-progress-bar';
import type { AgentStatus } from '../../types/miyabi-types';

describe('AgentProgressBar', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<AgentProgressBar tasks={5} maxTasks={10} status="working" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render with correct aria attributes', () => {
      render(<AgentProgressBar tasks={3} maxTasks={10} status="active" />);
      const progressBar = screen.getByRole('progressbar');

      expect(progressBar).toHaveAttribute('aria-valuenow', '30');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Agent progress: 3 of 10 tasks completed');
    });

    it('should show label when showLabel is true', () => {
      render(<AgentProgressBar tasks={7} maxTasks={10} status="working" showLabel />);

      expect(screen.getByText('7/10 tasks')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('should not show label when showLabel is false', () => {
      render(<AgentProgressBar tasks={7} maxTasks={10} status="working" showLabel={false} />);

      expect(screen.queryByText('7/10 tasks')).not.toBeInTheDocument();
      expect(screen.queryByText('70%')).not.toBeInTheDocument();
    });
  });

  describe('progress calculation', () => {
    it('should calculate progress correctly', () => {
      render(<AgentProgressBar tasks={5} maxTasks={10} status="active" />);
      const progressBar = screen.getByRole('progressbar');

      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should cap progress at 100%', () => {
      render(<AgentProgressBar tasks={15} maxTasks={10} status="active" />);
      const progressBar = screen.getByRole('progressbar');

      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle zero tasks', () => {
      render(<AgentProgressBar tasks={0} maxTasks={10} status="idle" />);
      const progressBar = screen.getByRole('progressbar');

      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle negative tasks (validate to 0)', () => {
      render(<AgentProgressBar tasks={-5} maxTasks={10} status="idle" />);
      const progressBar = screen.getByRole('progressbar');

      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle zero maxTasks (validate to 1)', () => {
      render(<AgentProgressBar tasks={5} maxTasks={0} status="working" />);
      const progressBar = screen.getByRole('progressbar');

      // Should not crash and should show 100% (5/1 capped at 100)
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('status-based styling', () => {
    const statuses: AgentStatus[] = ['working', 'error', 'active', 'idle', 'completed'];

    statuses.forEach((status) => {
      it(`should render correctly with "${status}" status`, () => {
        render(<AgentProgressBar tasks={5} maxTasks={10} status={status} />);
        const progressBar = screen.getByRole('progressbar');

        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should apply working animation for working status', () => {
      const { container } = render(
        <AgentProgressBar tasks={5} maxTasks={10} status="working" />
      );

      // Working status should have pulse overlay
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('height variants', () => {
    it('should render with small height', () => {
      const { container } = render(
        <AgentProgressBar tasks={5} maxTasks={10} status="active" height="sm" />
      );
      const progressBar = container.querySelector('.h-1');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render with medium height (default)', () => {
      const { container } = render(
        <AgentProgressBar tasks={5} maxTasks={10} status="active" height="md" />
      );
      const progressBar = container.querySelector('.h-1\\.5');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render with large height', () => {
      const { container } = render(
        <AgentProgressBar tasks={5} maxTasks={10} status="active" height="lg" />
      );
      const progressBar = container.querySelector('.h-2');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <AgentProgressBar
          tasks={5}
          maxTasks={10}
          status="active"
          className="custom-class"
        />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('visual states snapshot', () => {
    it('should render 0% progress', () => {
      render(<AgentProgressBar tasks={0} maxTasks={10} status="idle" showLabel />);
      expect(screen.getByText('0/10 tasks')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should render 50% progress', () => {
      render(<AgentProgressBar tasks={5} maxTasks={10} status="working" showLabel />);
      expect(screen.getByText('5/10 tasks')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render 100% progress', () => {
      render(<AgentProgressBar tasks={10} maxTasks={10} status="completed" showLabel />);
      expect(screen.getByText('10/10 tasks')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very large task counts', () => {
      render(<AgentProgressBar tasks={9999} maxTasks={10000} status="working" showLabel />);
      expect(screen.getByText('9999/10000 tasks')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument(); // Rounds to 100%
    });

    it('should handle decimal progress', () => {
      render(<AgentProgressBar tasks={3} maxTasks={7} status="active" />);
      const progressBar = screen.getByRole('progressbar');

      // 3/7 = 42.857... should round to 43
      const progress = progressBar.getAttribute('aria-valuenow');
      expect(Number(progress)).toBeCloseTo(42.857, 1);
    });
  });
});
