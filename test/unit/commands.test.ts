// Init Command Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { unlinkSync, existsSync, readFileSync } from 'fs';
import { init } from '@/commands/init.js';

const TEST_CONFIG_PATH = './test-miyabicode.json';

describe('init command', () => {
  afterEach(() => {
    // Clean up test file if it exists
    try { unlinkSync(TEST_CONFIG_PATH); } catch {}
  });

  it('should do nothing if config already exists', async () => {
    // Create the file first
    vi.mock('fs', async () => {
      const actual = await vi.importActual('fs');
      return {
        ...actual,
        existsSync: vi.fn(() => true),
        writeFileSync: vi.fn()
      };
    });

    await init(TEST_CONFIG_PATH);

    // File should not be modified/created by our init
    // (The mock prevents actual file operations)
  });

  it('should create default config file with correct structure', async () => {
    // Clean up before test
    try { unlinkSync(TEST_CONFIG_PATH); } catch {}

    await init(TEST_CONFIG_PATH);

    // Verify file was created
    const exists = existsSync(TEST_CONFIG_PATH);
    expect(exists).toBe(true);

    // Verify file content
    const content = readFileSync(TEST_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content);

    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('llm');
    expect(config).toHaveProperty('mcp');
    expect(config).toHaveProperty('tmux');
    expect(config).toHaveProperty('github');
    expect(config).toHaveProperty('workflow');
  });

  it('should include LLM config with Anthropic', async () => {
    try { unlinkSync(TEST_CONFIG_PATH); } catch {};

    await init(TEST_CONFIG_PATH);

    const content = readFileSync(TEST_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content);

    expect(config.llm.provider).toBe('anthropic');
    expect(config.llm.model).toBe('claude-sonnet-4-20250514');
  });

  it('should include MCP config with progressive disclosure', async () => {
    try { unlinkSync(TEST_CONFIG_PATH); } catch {};

    await init(TEST_CONFIG_PATH);

    const content = readFileSync(TEST_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content);

    expect(config.mcp.enabled).toContain('miyabi-mcp-bundle');
    expect(config.mcp.progressiveDisclosure).toBe(true);
  });

  it('should include tmux config', async () => {
    try { unlinkSync(TEST_CONFIG_PATH); } catch {};

    await init(TEST_CONFIG_PATH);

    const content = readFileSync(TEST_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content);

    expect(config.tmux.session).toBe('miyabi');
    expect(config.tmux.target).toBe('agents.0');
  });

  it('should include github config', async () => {
    try { unlinkSync(TEST_CONFIG_PATH); } catch {};

    await init(TEST_CONFIG_PATH);

    const content = readFileSync(TEST_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content);

    expect(config.github.owner).toBe('your-username');
    expect(config.github.repo).toBe('your-repo');
  });

  it('should include workflow config', async () => {
    try { unlinkSync(TEST_CONFIG_PATH); } catch {};

    await init(TEST_CONFIG_PATH);

    const content = readFileSync(TEST_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content);

    expect(config.workflow.branchNaming).toBe('conventional');
    expect(config.workflow.commitFormat).toBe('conventional');
  });

  it('should not overwrite existing config', async () => {
    // Create initial file
    await init(TEST_CONFIG_PATH);

    const originalContent = readFileSync(TEST_CONFIG_PATH, 'utf-8');

    // Call init again
    await init(TEST_CONFIG_PATH);

    // Content should be unchanged
    const newContent = readFileSync(TEST_CONFIG_PATH, 'utf-8');
    expect(newContent).toBe(originalContent);
  });
});
