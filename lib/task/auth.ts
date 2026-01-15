/**
 * API Key Authentication for Task API
 * Issue #1214: シンプルなAPI Key認証
 */

import type { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import type { ApiKey, ValidationResult } from './types';

// テストモード判定
const isTestMode = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';

// デモ用のAPI Key (本番ではDB管理)
const DEMO_API_KEYS: ApiKey[] = [
  {
    id: 'demo-key-1',
    key_hash: hashApiKey('miyabi-demo-key-12345'),
    name: 'Demo API Key',
    owner_id: 'demo-user',
    permissions: ['task:create', 'task:read', 'task:cancel'],
    rate_limit: 100, // 100 req/hour
    created_at: new Date(),
  },
  {
    id: 'admin-key-1',
    key_hash: hashApiKey('miyabi-admin-key-secret'),
    name: 'Admin API Key',
    owner_id: 'admin',
    permissions: ['task:*', 'admin:*'],
    rate_limit: 1000,
    created_at: new Date(),
  },
  // テスト用API Key
  {
    id: 'test-key-1',
    key_hash: hashApiKey('miyabi-test-key-valid'),
    name: 'Test API Key',
    owner_id: 'test-user',
    permissions: ['task:create', 'task:read', 'task:cancel'],
    rate_limit: 1000,
    created_at: new Date(),
  },
];

// Rate limit tracking (in-memory, 本番ではRedis使用)
const rateLimitStore = new Map<string, { count: number; resetAt: Date }>();

/**
 * API Keyをハッシュ化
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * リクエストからAPI Keyを抽出
 */
function extractApiKey(request: NextRequest): { key: string | null; invalidFormat: boolean } {
  // Authorization: Bearer <api-key>
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Bearerで始まる場合のみ有効
    if (authHeader.startsWith('Bearer ')) {
      return { key: authHeader.slice(7), invalidFormat: false };
    }
    // Authorizationヘッダーがあるが形式が不正
    return { key: null, invalidFormat: true };
  }

  // X-API-Key: <api-key>
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return { key: apiKeyHeader, invalidFormat: false };
  }

  // Query parameter (非推奨)
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('api_key');
  if (queryKey) {
    return { key: queryKey, invalidFormat: false };
  }

  return { key: null, invalidFormat: false };
}

/**
 * API Keyを検証
 */
function validateApiKey(key: string): ApiKey | null {
  const keyHash = hashApiKey(key);
  return DEMO_API_KEYS.find((k) => k.key_hash === keyHash) || null;
}

/**
 * Rate Limitをチェック
 */
function checkRateLimit(apiKey: ApiKey): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = new Date();
  const hourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  let limitInfo = rateLimitStore.get(apiKey.id);

  // リセット時間を過ぎていたらリセット
  if (!limitInfo || limitInfo.resetAt < now) {
    limitInfo = { count: 0, resetAt: hourFromNow };
    rateLimitStore.set(apiKey.id, limitInfo);
  }

  limitInfo.count++;

  const remaining = Math.max(0, apiKey.rate_limit - limitInfo.count);
  const allowed = limitInfo.count <= apiKey.rate_limit;

  return { allowed, remaining, resetAt: limitInfo.resetAt };
}

/**
 * 権限をチェック
 */
function hasPermission(apiKey: ApiKey, requiredPermission: string): boolean {
  // ワイルドカード対応
  if (apiKey.permissions.includes('*')) {return true;}

  const [resource, action] = requiredPermission.split(':');

  // リソースワイルドカード
  if (apiKey.permissions.includes(`${resource}:*`)) {return true;}

  // 完全一致
  return apiKey.permissions.includes(requiredPermission);
}

/**
 * 認証結果
 */
export interface AuthResult {
  success: boolean;
  apiKey?: ApiKey;
  error?: {
    code: string;
    message: string;
  };
  rateLimit?: {
    remaining: number;
    resetAt: Date;
  };
}

/**
 * リクエストを認証
 */
export async function authenticateRequest(
  request: NextRequest,
  requiredPermission?: string,
): Promise<AuthResult> {
  // API Keyを抽出
  const { key, invalidFormat } = extractApiKey(request);

  // 形式が不正な場合
  if (invalidFormat) {
    return {
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid authorization format. Use "Bearer <api-key>" format.',
      },
    };
  }

  // API Keyがない場合
  if (!key) {
    return {
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required. Provide it via Authorization header or X-API-Key header.',
      },
    };
  }

  // API Keyを検証
  const apiKey = validateApiKey(key);
  if (!apiKey) {
    return {
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key.',
      },
    };
  }

  // 有効期限チェック
  if (apiKey.expires_at && apiKey.expires_at < new Date()) {
    return {
      success: false,
      error: {
        code: 'EXPIRED_API_KEY',
        message: 'API key has expired.',
      },
    };
  }

  // 権限チェック
  if (requiredPermission && !hasPermission(apiKey, requiredPermission)) {
    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Required permission: ${requiredPermission}`,
      },
    };
  }

  // Rate Limitチェック
  const rateLimit = checkRateLimit(apiKey);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Resets at ${rateLimit.resetAt.toISOString()}`,
      },
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    };
  }

  return {
    success: true,
    apiKey,
    rateLimit: {
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt,
    },
  };
}

/**
 * Rate Limitヘッダーを設定
 */
export function setRateLimitHeaders(
  headers: Headers,
  rateLimit: { remaining: number; resetAt: Date },
): void {
  headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.floor(rateLimit.resetAt.getTime() / 1000).toString());
}
