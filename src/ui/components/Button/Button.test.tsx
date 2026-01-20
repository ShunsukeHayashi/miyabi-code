/**
 * Button Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './Button.js';

describe('Button', () => {
  it('renders children correctly', () => {
    const { container } = render(<Button>Click me</Button>);
    expect(container.textContent).toBe('Click me');
  });

  it('applies variant classes correctly', () => {
    const { container: primary } = render(<Button variant="primary">Primary</Button>);
    const { container: secondary } = render(<Button variant="secondary">Secondary</Button>);
    const { container: danger } = render(<Button variant="danger">Danger</Button>);
    const { container: ghost } = render(<Button variant="ghost">Ghost</Button>);

    expect(primary.querySelector('button')).toHaveClass('bg-purple-600');
    expect(secondary.querySelector('button')).toHaveClass('bg-gray-600');
    expect(danger.querySelector('button')).toHaveClass('bg-red-600');
    expect(ghost.querySelector('button')).toHaveClass('bg-transparent');
  });

  it('applies size classes correctly', () => {
    const { container: sm } = render(<Button size="sm">Small</Button>);
    const { container: md } = render(<Button size="md">Medium</Button>);
    const { container: lg } = render(<Button size="lg">Large</Button>);

    expect(sm.querySelector('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');
    expect(md.querySelector('button')).toHaveClass('px-4', 'py-2', 'text-base');
    expect(lg.querySelector('button')).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(<Button onClick={handleClick}>Click</Button>);

    container.querySelector('button')?.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const button = container.querySelector('button');

    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    expect(container.querySelector('button')).toHaveClass('custom-class');
  });

  it('sets testId attribute', () => {
    const { container } = render(<Button testId="test-button">Test</Button>);
    expect(container.querySelector('button')).toHaveAttribute('data-testid', 'test-button');
  });
});
