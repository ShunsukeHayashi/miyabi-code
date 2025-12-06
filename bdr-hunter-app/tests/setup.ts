import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll } from 'vitest';

// Create mock functions
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockCount = vi.fn();

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    analysis: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      update: mockUpdate,
      count: mockCount,
    },
  },
}));

// Export mock functions for tests
export const mockPrisma = {
  analysis: {
    create: mockCreate,
    findUnique: mockFindUnique,
    findMany: mockFindMany,
    update: mockUpdate,
    count: mockCount,
  },
};

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test';

beforeAll(() => {
  console.log('✅ Test setup completed');
});

afterAll(() => {
  console.log('🧹 Test environment cleanup completed');
});

// Log test environment info
console.log(`🧪 Test environment initialized
📁 Working directory: ${process.cwd()}
🔧 Node version: ${process.version}
🌍 Environment: ${process.env.NODE_ENV || 'test'}`);
