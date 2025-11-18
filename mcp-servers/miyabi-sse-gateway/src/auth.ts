import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// API Key認証用のキー生成
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// API Key検証ミドルウェア
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const validApiKey = process.env.MIYABI_API_KEY;

  if (!validApiKey) {
    // API Key未設定の場合は認証なし（開発モード）
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key'
    });
  }

  next();
}

// Bearer Token認証ミドルウェア
export function bearerAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const validToken = process.env.MIYABI_BEARER_TOKEN;

  if (!validToken) {
    // Token未設定の場合は認証なし（開発モード）
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header'
    });
  }

  const token = authHeader.substring(7);
  if (token !== validToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid bearer token'
    });
  }

  next();
}

// OAuth2 簡易実装（ChatGPT用）
interface OAuth2Token {
  access_token: string;
  token_type: string;
  expires_in: number;
}

const tokenStore = new Map<string, { userId: string; expiresAt: number }>();

export function generateOAuth2Token(userId: string): OAuth2Token {
  const accessToken = crypto.randomBytes(32).toString('hex');
  const expiresIn = 3600; // 1時間
  
  tokenStore.set(accessToken, {
    userId,
    expiresAt: Date.now() + expiresIn * 1000
  });

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn
  };
}

export function validateOAuth2Token(token: string): string | null {
  const tokenData = tokenStore.get(token);
  
  if (!tokenData) {
    return null;
  }

  if (Date.now() > tokenData.expiresAt) {
    tokenStore.delete(token);
    return null;
  }

  return tokenData.userId;
}

export function oauth2Middleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'unauthorized',
      error_description: 'Missing or invalid authorization header'
    });
  }

  const token = authHeader.substring(7);
  const userId = validateOAuth2Token(token);

  if (!userId) {
    return res.status(401).json({
      error: 'invalid_token',
      error_description: 'Token is expired or invalid'
    });
  }

  // ユーザーIDをリクエストに追加
  (req as any).userId = userId;
  next();
}
