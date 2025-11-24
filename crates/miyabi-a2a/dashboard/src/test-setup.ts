import { expect, afterEach, vi } from 'vitest';
import React from 'react';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (required for HeroUI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Provide URL helpers for components that generate blobs/links
// Always override to ensure availability during tests
// @ts-ignore jsdom does not implement this API
global.URL.createObjectURL = vi.fn(() => 'mock-url');
// @ts-ignore jsdom does not implement this API
global.URL.revokeObjectURL = vi.fn();

// Mock Iconify to avoid timers and window access after teardown
vi.mock('@iconify/react', () => ({
  // simple span that carries icon data for assertions
  Icon: (props: { icon?: string; className?: string }) =>
    React.createElement('span', {
      'data-icon': props.icon,
      className: props.className,
    }),
}));

// Mock IntersectionObserver (required for framer-motion)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (required for framer-motion and AutoSizer)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock framer-motion to prevent animation warnings in tests
// This is intentionally left commented as it may cause issues with esbuild
// If you need to mock framer-motion, do it in individual test files
