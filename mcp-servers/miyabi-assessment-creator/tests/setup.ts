/**
 * Test setup configuration
 */

import { beforeAll, afterAll } from 'vitest';
import winston from 'winston';

// Configure logger for tests
winston.configure({
  level: 'error', // Only log errors during tests
  transports: [
    new winston.transports.Console({
      silent: process.env.NODE_ENV === 'test'
    })
  ]
});

// Mock environment variables
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-api-key';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Global test setup
});

afterAll(async () => {
  // Global test cleanup
});