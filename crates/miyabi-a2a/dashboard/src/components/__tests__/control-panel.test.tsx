import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlPanel } from '../control-panel';

const renderPanel = (props: Partial<React.ComponentProps<typeof ControlPanel>> = {}) =>
  render(<ControlPanel isOpen onClose={vi.fn()} {...props} />);

describe('ControlPanel', () => {
  let anchorMock: { href: string; download: string; click: ReturnType<typeof vi.fn> };
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    anchorMock = { href: '', download: '', click: vi.fn() } as any;
    (global.URL as any).createObjectURL = vi.fn(() => 'blob:mock-url');
    (global.URL as any).revokeObjectURL = vi.fn();

    const realCreateElement = document.createElement.bind(document);
    createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return anchorMock as unknown as HTMLElement;
        }
        return realCreateElement(tagName);
      });
  });

  afterEach(() => {
    createElementSpy.mockRestore();
  });

  it('toggles auto-refresh visibility when switch is clicked', async () => {
    renderPanel();

    const switchToggle = screen.getByLabelText('Auto-refresh toggle');
    expect(screen.getByText('Refresh Interval')).toBeInTheDocument();

    await userEvent.click(switchToggle);
    expect(screen.queryByText('Refresh Interval')).not.toBeInTheDocument();
  });

  it('pauses and resumes agents through confirmation dialog', async () => {
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Pause All' }));
    expect(screen.getByText('Pause All Agents?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume All' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Resume All' }));
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('shows confirmation dialog for clearing the task queue', async () => {
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Clear Task Queue' }));
    expect(screen.getByText('Clear Task Queue?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(screen.queryByText('Clear Task Queue?')).not.toBeInTheDocument();
  });

  it('exports system state via download link', async () => {
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Export System State' }));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(anchorMock.click).toHaveBeenCalled();
    expect(anchorMock.download).toContain('miyabi-system-state');
  });
});
