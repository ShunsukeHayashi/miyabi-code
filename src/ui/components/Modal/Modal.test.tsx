/**
 * Modal Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Modal } from './Modal.js';

describe('Modal', () => {
  it('renders when isOpen is true', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Modal content
      </Modal>
    );
    expect(container.textContent).toContain('Modal content');
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()}>
        Modal content
      </Modal>
    );
    expect(container.textContent).not.toContain('Modal content');
  });

  it('renders title', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Modal Title">
        Content
      </Modal>
    );
    expect(container.textContent).toContain('Modal Title');
  });

  it('shows close button by default', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Content
      </Modal>
    );
    expect(container.querySelector('button[aria-label="Close"]')).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} showCloseButton={false}>
        Content
      </Modal>
    );
    expect(container.querySelector('button[aria-label="Close"]')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={handleClose}>
        Content
      </Modal>
    );
    (container.querySelector('button[aria-label="Close"]') as HTMLElement)?.click();
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('applies size classes correctly', () => {
    const { container: sm } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="sm">
        Small
      </Modal>
    );
    const { container: lg } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="lg">
        Large
      </Modal>
    );

    expect(sm.querySelector('.max-w-md')).toBeInTheDocument();
    expect(lg.querySelector('.max-w-2xl')).toBeInTheDocument();
  });

  it('sets testId attribute', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} testId="test-modal">
        Content
      </Modal>
    );
    expect(container.querySelector('[data-testid="test-modal"]')).toBeInTheDocument();
  });
});
