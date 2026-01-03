/**
 * Test setup configuration
 */

import { vi } from 'vitest';

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

// Mock winston logger to prevent log output during tests
vi.mock('winston', () => {
  const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };

  const mockWinston = {
    createLogger: vi.fn(() => mockLogger),
    format: {
      combine: vi.fn(() => vi.fn()),
      timestamp: vi.fn(() => vi.fn()),
      errors: vi.fn(() => vi.fn()),
      json: vi.fn(() => vi.fn())
    },
    transports: {
      Console: vi.fn(),
      File: vi.fn()
    }
  };

  return {
    default: mockWinston,
    ...mockWinston
  };
});

// Global test timeout
vi.setConfig({ testTimeout: 30000 });