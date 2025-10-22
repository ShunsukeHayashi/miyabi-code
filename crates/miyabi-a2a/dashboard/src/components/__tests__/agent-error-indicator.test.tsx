import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { AgentErrorIndicator, useErrorIndicator, type ErrorSeverity } from '../agent-error-indicator';

describe('AgentErrorIndicator', () => {
  describe('rendering', () => {
    it('should render when show is true', () => {
      render(<AgentErrorIndicator show={true} severity="error" />);
      const indicator = screen.getByRole('alert');
      expect(indicator).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(<AgentErrorIndicator show={false} severity="error" />);
      const indicator = screen.queryByRole('alert');
      expect(indicator).not.toBeInTheDocument();
    });

    it('should render with correct aria attributes', () => {
      render(<AgentErrorIndicator show={true} severity="warning" errorMessage="Test warning" />);
      const indicator = screen.getByRole('alert');

      expect(indicator).toHaveAttribute('aria-live', 'assertive');
      expect(indicator).toHaveAttribute('aria-label', 'Test warning');
    });

    it('should render with default aria-label when no message provided', () => {
      render(<AgentErrorIndicator show={true} severity="critical" />);
      const indicator = screen.getByRole('alert');

      expect(indicator).toHaveAttribute('aria-label', 'critical indicator');
    });
  });

  describe('severity levels', () => {
    const severities: ErrorSeverity[] = ['error', 'warning', 'critical'];

    severities.forEach((severity) => {
      it(`should render correctly with "${severity}" severity`, () => {
        render(<AgentErrorIndicator show={true} severity={severity} />);
        const indicator = screen.getByRole('alert');

        expect(indicator).toBeInTheDocument();
        expect(indicator).toHaveAttribute('aria-label', `${severity} indicator`);
      });
    });

    it('should use default "error" severity when not specified', () => {
      render(<AgentErrorIndicator show={true} />);
      const indicator = screen.getByRole('alert');

      expect(indicator).toHaveAttribute('aria-label', 'error indicator');
    });
  });

  describe('position variants', () => {
    it('should render at top-right position (default)', () => {
      const { container } = render(
        <AgentErrorIndicator show={true} position="top-right" />
      );
      const indicator = container.querySelector('.top-2.right-2');
      expect(indicator).toBeInTheDocument();
    });

    it('should render at top-left position', () => {
      const { container } = render(
        <AgentErrorIndicator show={true} position="top-left" />
      );
      const indicator = container.querySelector('.top-2.left-2');
      expect(indicator).toBeInTheDocument();
    });

    it('should render at bottom-right position', () => {
      const { container } = render(
        <AgentErrorIndicator show={true} position="bottom-right" />
      );
      const indicator = container.querySelector('.bottom-2.right-2');
      expect(indicator).toBeInTheDocument();
    });

    it('should render at bottom-left position', () => {
      const { container } = render(
        <AgentErrorIndicator show={true} position="bottom-left" />
      );
      const indicator = container.querySelector('.bottom-2.left-2');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('should render with small size', () => {
      render(<AgentErrorIndicator show={true} size="sm" />);
      const indicator = screen.getByRole('alert');
      expect(indicator).toBeInTheDocument();
      // Icon size classes are applied via @iconify/react, just verify component renders
    });

    it('should render with medium size (default)', () => {
      render(<AgentErrorIndicator show={true} size="md" />);
      const indicator = screen.getByRole('alert');
      expect(indicator).toBeInTheDocument();
      // Icon size classes are applied via @iconify/react, just verify component renders
    });

    it('should render with large size', () => {
      render(<AgentErrorIndicator show={true} size="lg" />);
      const indicator = screen.getByRole('alert');
      expect(indicator).toBeInTheDocument();
      // Icon size classes are applied via @iconify/react, just verify component renders
    });
  });

  describe('error message tooltip', () => {
    it('should wrap with tooltip when errorMessage is provided', () => {
      render(
        <AgentErrorIndicator
          show={true}
          severity="error"
          errorMessage="Something went wrong"
        />
      );

      // The component should render with tooltip
      const indicator = screen.getByRole('alert');
      expect(indicator).toBeInTheDocument();
    });

    it('should not wrap with tooltip when errorMessage is not provided', () => {
      const { container } = render(
        <AgentErrorIndicator show={true} severity="warning" />
      );

      const indicator = screen.getByRole('alert');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <AgentErrorIndicator show={true} className="custom-error-class" />
      );

      const indicator = container.querySelector('.custom-error-class');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('animation behavior', () => {
    it('should render animation elements for error severity', () => {
      const { container } = render(
        <AgentErrorIndicator show={true} severity="error" />
      );

      // Should have icon and ripple elements
      const indicator = screen.getByRole('alert');
      expect(indicator).toBeInTheDocument();

      // Check for relative container (contains icon + ripple)
      const relativeContainer = indicator.querySelector('.relative');
      expect(relativeContainer).toBeInTheDocument();
    });

    it('should render animation elements for critical severity', () => {
      const { container } = render(
        <AgentErrorIndicator show={true} severity="critical" />
      );

      const indicator = screen.getByRole('alert');
      expect(indicator).toBeInTheDocument();

      const relativeContainer = indicator.querySelector('.relative');
      expect(relativeContainer).toBeInTheDocument();
    });

    it('should render animation elements for warning severity', () => {
      const { container } = render(
        <AgentErrorIndicator show={true} severity="warning" />
      );

      const indicator = screen.getByRole('alert');
      expect(indicator).toBeInTheDocument();

      const relativeContainer = indicator.querySelector('.relative');
      expect(relativeContainer).toBeInTheDocument();
    });
  });
});

describe('useErrorIndicator', () => {
  describe('initialization', () => {
    it('should initialize with show:false', () => {
      const { result } = renderHook(() => useErrorIndicator());

      expect(result.current.showError).toBe(false);
      expect(result.current.errorSeverity).toBe('error');
      expect(result.current.errorMessage).toBeUndefined();
    });
  });

  describe('setError', () => {
    it('should set error with severity', () => {
      const { result } = renderHook(() => useErrorIndicator());

      act(() => {
        result.current.setError('critical');
      });

      expect(result.current.showError).toBe(true);
      expect(result.current.errorSeverity).toBe('critical');
      expect(result.current.errorMessage).toBeUndefined();
    });

    it('should set error with severity and message', () => {
      const { result } = renderHook(() => useErrorIndicator());

      act(() => {
        result.current.setError('warning', 'Test warning message');
      });

      expect(result.current.showError).toBe(true);
      expect(result.current.errorSeverity).toBe('warning');
      expect(result.current.errorMessage).toBe('Test warning message');
    });

    it('should update existing error', () => {
      const { result } = renderHook(() => useErrorIndicator());

      act(() => {
        result.current.setError('error', 'First error');
      });

      expect(result.current.errorMessage).toBe('First error');

      act(() => {
        result.current.setError('critical', 'Second error');
      });

      expect(result.current.errorSeverity).toBe('critical');
      expect(result.current.errorMessage).toBe('Second error');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useErrorIndicator());

      act(() => {
        result.current.setError('error', 'Test error');
      });

      expect(result.current.showError).toBe(true);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.showError).toBe(false);
      // Severity and message should remain for potential re-display
      expect(result.current.errorSeverity).toBe('error');
      expect(result.current.errorMessage).toBe('Test error');
    });

    it('should be idempotent', () => {
      const { result } = renderHook(() => useErrorIndicator());

      act(() => {
        result.current.clearError();
        result.current.clearError();
        result.current.clearError();
      });

      expect(result.current.showError).toBe(false);
    });
  });

  describe('workflow scenarios', () => {
    it('should handle error → clear → new error workflow', () => {
      const { result } = renderHook(() => useErrorIndicator());

      // Show first error
      act(() => {
        result.current.setError('error', 'First error');
      });
      expect(result.current.showError).toBe(true);
      expect(result.current.errorMessage).toBe('First error');

      // Clear error
      act(() => {
        result.current.clearError();
      });
      expect(result.current.showError).toBe(false);

      // Show second error
      act(() => {
        result.current.setError('critical', 'Second error');
      });
      expect(result.current.showError).toBe(true);
      expect(result.current.errorSeverity).toBe('critical');
      expect(result.current.errorMessage).toBe('Second error');
    });

    it('should handle rapid error updates', () => {
      const { result } = renderHook(() => useErrorIndicator());

      act(() => {
        result.current.setError('warning', 'Warning 1');
        result.current.setError('error', 'Error 1');
        result.current.setError('critical', 'Critical 1');
      });

      // Should show the last error
      expect(result.current.showError).toBe(true);
      expect(result.current.errorSeverity).toBe('critical');
      expect(result.current.errorMessage).toBe('Critical 1');
    });
  });
});
