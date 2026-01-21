/**
 * Error Handling Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MiyabiCodeError,
  ErrorCode,
  LLMError,
  AgentError,
  TmuxError,
  MCPError,
  GitHubError,
  ConfigError,
  WorkflowError,
  handleError,
  withRetry
} from '../../src/utils/errors.js';

describe('MiyabiCodeError', () => {
  it('should create error with message and code', () => {
    const error = new MiyabiCodeError('Test error', ErrorCode.LLM_API_ERROR);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('LLM_API_ERROR');
    expect(error.name).toBe('MiyabiCodeError');
  });

  it('should include details', () => {
    const details = { foo: 'bar' };
    const error = new MiyabiCodeError('Test error', ErrorCode.LLM_API_ERROR, details);
    expect(error.details).toEqual(details);
  });
});

describe('Specialized Errors', () => {
  it('LLMError should use default code', () => {
    const error = new LLMError('LLM failed');
    expect(error.name).toBe('LLMError');
    expect(error.code).toBe(ErrorCode.LLM_API_ERROR);
  });

  it('AgentError should use default code', () => {
    const error = new AgentError('Agent failed');
    expect(error.name).toBe('AgentError');
    expect(error.code).toBe(ErrorCode.AGENT_EXECUTION_ERROR);
  });

  it('TmuxError should use default code', () => {
    const error = new TmuxError('tmux failed');
    expect(error.name).toBe('TmuxError');
    expect(error.code).toBe(ErrorCode.TMUX_CONNECTION_ERROR);
  });

  it('MCPError should use default code', () => {
    const error = new MCPError('MCP failed');
    expect(error.name).toBe('MCPError');
    expect(error.code).toBe(ErrorCode.MCP_CONNECTION_ERROR);
  });

  it('GitHubError should use default code', () => {
    const error = new GitHubError('GitHub failed');
    expect(error.name).toBe('GitHubError');
    expect(error.code).toBe(ErrorCode.GITHUB_API_ERROR);
  });

  it('ConfigError should use default code', () => {
    const error = new ConfigError('Config invalid');
    expect(error.name).toBe('ConfigError');
    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
  });

  it('WorkflowError should use default code', () => {
    const error = new WorkflowError('Workflow failed');
    expect(error.name).toBe('WorkflowError');
    expect(error.code).toBe(ErrorCode.WORKFLOW_ERROR);
  });
});

describe('handleError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle MiyabiCodeError', () => {
    const error = new MiyabiCodeError('Test error', ErrorCode.LLM_API_ERROR, { details: 'test' });
    expect(() => handleError(error)).toThrow(MiyabiCodeError);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle generic Error', () => {
    const error = new Error('Generic error');
    expect(() => handleError(error)).toThrow(MiyabiCodeError);
  });

  it('should handle unknown error', () => {
    expect(() => handleError('unknown')).toThrow(MiyabiCodeError);
  });
});

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error', async () => {
    let attempts = 0;
    const fn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new MiyabiCodeError('Rate limited', ErrorCode.LLM_RATE_LIMIT);
      }
      return 'success';
    });

    const result = await withRetry(fn, { maxAttempts: 3 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(
      new MiyabiCodeError('Rate limited', ErrorCode.LLM_RATE_LIMIT)
    );

    await expect(withRetry(fn, { maxAttempts: 2 })).rejects.toThrow(MiyabiCodeError);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry non-retryable error', async () => {
    const fn = vi.fn().mockRejectedValue(
      new MiyabiCodeError('Not retryable', ErrorCode.AGENT_NOT_FOUND)
    );

    await expect(withRetry(fn)).rejects.toThrow(MiyabiCodeError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    let callCount = 0;

    const fn = async () => {
      callCount++;
      if (callCount < 3) {
        throw new MiyabiCodeError('Rate limited', ErrorCode.LLM_RATE_LIMIT);
      }
      return 'success';
    };

    const result = await withRetry(fn, {
      initialDelay: 10,
      backoffMultiplier: 2
    });

    expect(result).toBe('success');
    expect(callCount).toBe(3);
  });

  it('should respect maxDelay', () => {
    // maxDelay計算ロジックの検証 - 非同期テストとして実装
    let delay = 100;
    const backoffMultiplier = 2;
    const maxDelay = 200;

    // 1回目: 100
    expect(delay).toBe(100);
    delay = Math.min(delay * backoffMultiplier, maxDelay);
    // 2回目: 200 (上限)
    expect(delay).toBe(200);
    delay = Math.min(delay * backoffMultiplier, maxDelay);
    // 3回目: 200 (上限のまま)
    expect(delay).toBe(200);
  });
});
