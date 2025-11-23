import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../contexts/theme-context';
import { ThemeToggle } from '../theme-toggle';

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders light icon by default and toggles to dark mode', async () => {
    renderToggle();

    const toggle = screen.getByLabelText('Toggle theme');
    await userEvent.click(toggle);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('miyabi-theme')).toBe('dark');
  });

  it('switches back to light mode', async () => {
    localStorage.setItem('miyabi-theme', 'dark');
    renderToggle();

    const toggle = screen.getByLabelText('Toggle theme');
    await userEvent.click(toggle);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('miyabi-theme')).toBe('light');
  });
});
