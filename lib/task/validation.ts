/**
 * Validation for Task API
 * Issue #1214: リクエストバリデーション
 */

import type { TaskRequest, ValidationResult, ValidationError } from './types';

/**
 * リポジトリ名の形式を検証
 */
function isValidRepository(repo: string): boolean {
  // owner/repo 形式をチェック
  const repoRegex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
  return repoRegex.test(repo);
}

/**
 * 指示文の長さを検証
 */
const MAX_INSTRUCTION_LENGTH = 10000;

function isValidInstruction(instruction: string): boolean {
  return instruction.length >= 1 && instruction.length <= MAX_INSTRUCTION_LENGTH;
}

/**
 * URLの形式を検証
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * TaskRequestを検証
 */
export function validateTaskRequest(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // 基本的な型チェック
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: [
        {
          field: 'body',
          message: 'Request body must be a JSON object',
          code: 'INVALID_BODY',
        },
      ],
    };
  }

  const request = data as Record<string, unknown>;

  // instruction の検証
  if (!request.instruction) {
    errors.push({
      field: 'instruction',
      message: 'instruction is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (typeof request.instruction !== 'string') {
    errors.push({
      field: 'instruction',
      message: 'instruction must be a string',
      code: 'INVALID_TYPE',
    });
  } else if (request.instruction.length === 0) {
    errors.push({
      field: 'instruction',
      message: 'instruction cannot be empty',
      code: 'REQUIRED_FIELD',
    });
  } else if (request.instruction.length > MAX_INSTRUCTION_LENGTH) {
    errors.push({
      field: 'instruction',
      message: `instruction exceeds maximum length of ${MAX_INSTRUCTION_LENGTH} characters`,
      code: 'MAX_LENGTH_EXCEEDED',
    });
  }

  // repository の検証
  if (!request.repository) {
    errors.push({
      field: 'repository',
      message: 'repository is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (typeof request.repository !== 'string') {
    errors.push({
      field: 'repository',
      message: 'repository must be a string',
      code: 'INVALID_TYPE',
    });
  } else if (!isValidRepository(request.repository)) {
    errors.push({
      field: 'repository',
      message: 'repository must be in owner/repo format',
      code: 'INVALID_FORMAT',
    });
  }

  // options の検証
  if (request.options !== undefined) {
    if (typeof request.options !== 'object' || request.options === null) {
      errors.push({
        field: 'options',
        message: 'options must be an object',
        code: 'INVALID_TYPE',
      });
    } else {
      const options = request.options as Record<string, unknown>;

      // auto_merge
      if (options.auto_merge !== undefined && typeof options.auto_merge !== 'boolean') {
        errors.push({
          field: 'options.auto_merge',
          message: 'auto_merge must be a boolean',
          code: 'INVALID_TYPE',
        });
      }

      // notify
      if (options.notify !== undefined && typeof options.notify !== 'boolean') {
        errors.push({
          field: 'options.notify',
          message: 'notify must be a boolean',
          code: 'INVALID_TYPE',
        });
      }

      // priority
      if (options.priority !== undefined) {
        const validPriorities = ['low', 'normal', 'high', 'critical'];
        if (typeof options.priority !== 'string' || !validPriorities.includes(options.priority)) {
          errors.push({
            field: 'options.priority',
            message: `priority must be one of: ${validPriorities.join(', ')}`,
            code: 'INVALID_VALUE',
          });
        }
      }

      // target_branch
      if (options.target_branch !== undefined && typeof options.target_branch !== 'string') {
        errors.push({
          field: 'options.target_branch',
          message: 'target_branch must be a string',
          code: 'INVALID_TYPE',
        });
      }

      // require_review
      if (options.require_review !== undefined && typeof options.require_review !== 'boolean') {
        errors.push({
          field: 'options.require_review',
          message: 'require_review must be a boolean',
          code: 'INVALID_TYPE',
        });
      }

      // callback_url
      if (options.callback_url !== undefined) {
        if (typeof options.callback_url !== 'string') {
          errors.push({
            field: 'options.callback_url',
            message: 'callback_url must be a string',
            code: 'INVALID_TYPE',
          });
        } else if (!isValidUrl(options.callback_url)) {
          errors.push({
            field: 'options.callback_url',
            message: 'callback_url must be a valid URL',
            code: 'INVALID_FORMAT',
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Task IDを検証
 */
export function validateTaskId(taskId: string): ValidationResult {
  const errors: ValidationError[] = [];

  // UUID形式をチェック
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!taskId) {
    errors.push({
      field: 'taskId',
      message: 'taskId is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (!uuidRegex.test(taskId)) {
    errors.push({
      field: 'taskId',
      message: 'taskId must be a valid UUID',
      code: 'INVALID_FORMAT',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
