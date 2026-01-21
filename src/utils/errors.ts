/**
 * Error Definitions
 * Centralized error handling for MiyabiCode
 */

import { ErrorCode } from '../types.js';
import { MiyabiCodeError } from '../types.js';

// Re-export for convenience
export { MiyabiCodeError, ErrorCode };

// ============================================
// Specialized Errors
// ============================================

export class LLMError extends MiyabiCodeError {
  constructor(message: string, code: ErrorCode = ErrorCode.LLM_API_ERROR, details?: unknown) {
    super(message, code, details);
    this.name = 'LLMError';
  }
}

export class AgentError extends MiyabiCodeError {
  constructor(message: string, code: ErrorCode = ErrorCode.AGENT_EXECUTION_ERROR, details?: unknown) {
    super(message, code, details);
    this.name = 'AgentError';
  }
}

export class TmuxError extends MiyabiCodeError {
  constructor(message: string, code: ErrorCode = ErrorCode.TMUX_CONNECTION_ERROR, details?: unknown) {
    super(message, code, details);
    this.name = 'TmuxError';
  }
}

export class MCPError extends MiyabiCodeError {
  constructor(message: string, code: ErrorCode = ErrorCode.MCP_CONNECTION_ERROR, details?: unknown) {
    super(message, code, details);
    this.name = 'MCPError';
  }
}

export class GitHubError extends MiyabiCodeError {
  constructor(message: string, code: ErrorCode = ErrorCode.GITHUB_API_ERROR, details?: unknown) {
    super(message, code, details);
    this.name = 'GitHubError';
  }
}

export class ConfigError extends MiyabiCodeError {
  constructor(message: string, code: ErrorCode = ErrorCode.CONFIG_INVALID, details?: unknown) {
    super(message, code, details);
    this.name = 'ConfigError';
  }
}

export class WorkflowError extends MiyabiCodeError {
  constructor(message: string, code: ErrorCode = ErrorCode.WORKFLOW_ERROR, details?: unknown) {
    super(message, code, details);
    this.name = 'WorkflowError';
  }
}

// ============================================
// Error Handler Utility
// ============================================

export function handleError(error: unknown): never {
  if (error instanceof MiyabiCodeError) {
    console.error(`[${error.code}] ${error.message}`);
    if (error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
    throw error;
  }

  if (error instanceof Error) {
    throw new MiyabiCodeError(error.message, ErrorCode.WORKFLOW_ERROR, { originalError: error.name });
  }

  throw new MiyabiCodeError(
    'An unknown error occurred',
    ErrorCode.WORKFLOW_ERROR,
    { error }
  );
}

// ============================================
// Retry Wrapper
// ============================================

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = [
      ErrorCode.LLM_RATE_LIMIT,
      ErrorCode.TMUX_CONNECTION_ERROR,
      ErrorCode.MCP_CONNECTION_ERROR,
    ],
  } = options;

  let delay = initialDelay;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error instanceof MiyabiCodeError && retryableErrors.includes(error.code)) {
        if (attempt < maxAttempts) {
          console.warn(`Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * backoffMultiplier, maxDelay);
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}
