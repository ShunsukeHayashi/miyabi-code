import { beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// Test database path
const TEST_DB_PATH = path.join(__dirname, '../test.db');

beforeAll(async () => {
  // Clean up any existing test database
  try {
    await fs.unlink(TEST_DB_PATH);
  } catch (error) {
    // File doesn't exist, which is fine
  }
});

afterAll(async () => {
  // Clean up test database after tests
  try {
    await fs.unlink(TEST_DB_PATH);
  } catch (error) {
    // File doesn't exist, which is fine
  }
});