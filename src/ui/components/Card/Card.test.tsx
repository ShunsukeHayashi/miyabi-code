/**
 * Card Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './Card.js';

describe('Card', () => {
  it('renders children correctly', () => {
    const { container } = render(<Card>Card content</Card>);
    expect(container.textContent).toContain('Card content');
  });

  it('renders title and subtitle', () => {
    const { container } = render(
      <Card title="Card Title" subtitle="Card Subtitle">
        Content
      </Card>
    );
    expect(container.textContent).toContain('Card Title');
    expect(container.textContent).toContain('Card Subtitle');
  });

  it('renders footer', () => {
    const { container } = render(
      <Card footer={<button>Footer Action</button>}>
        Content
      </Card>
    );
    expect(container.querySelector('button')?.textContent).toBe('Footer Action');
  });

  it('applies shadow by default', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstElementChild;
    expect(card).toHaveClass('shadow-lg');
  });

  it('removes shadow when shadow is false', () => {
    const { container } = render(<Card shadow={false}>Content</Card>);
    const card = container.firstElementChild;
    expect(card).not.toHaveClass('shadow-lg');
  });

  it('adds clickable classes when clickable is true', () => {
    const { container } = render(<Card clickable>Content</Card>);
    const card = container.firstElementChild;
    expect(card).toHaveClass('cursor-pointer');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(<Card onClick={handleClick}>Content</Card>);
    (container.firstElementChild as HTMLElement)?.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstElementChild).toHaveClass('custom-class');
  });

  it('sets testId attribute', () => {
    const { container } = render(<Card testId="test-card">Content</Card>);
    expect(container.firstElementChild).toHaveAttribute('data-testid', 'test-card');
  });
});
