/**
 * GitHub OAuth Callback Endpoint
 * GET /api/auth/github/callback - Handles OAuth callback from GitHub
 *
 * Query Parameters (from GitHub):
 * - code: Authorization code
 * - state: State parameter for CSRF protection
 * - error: Error code (if authorization failed)
 * - error_description: Error description (if authorization failed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  validateOAuthState,
  exchangeCodeForToken,
  getGitHubUser,
  getGitHubUserEmails,
  getUserInstallations,
  generateMiyabiSessionToken,
} from '../../../../../lib/github-app/oauth';
import { checkOAuthRateLimit } from '../../../../../lib/github-app/rate-limit';
import { MiyabiGitHubUser } from '../../../../../lib/github-app/types';
import { AuditLogger, SecurityEventType } from '../../../../../lib/auth/security';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = checkOAuthRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Rate limit exceeded',
        'RATE_LIMIT_EXCEEDED',
        429,
        requestId,
        { retryAfter: rateLimitResult.retryAfter }
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.warn('[OAuth Callback] GitHub returned error:', { error, errorDescription });

      await AuditLogger.logSecurityEvent(
        null,
        'LOGIN_FAILURE' as SecurityEventType,
        {
          action: 'github_oauth_callback',
          success: false,
          errorMessage: errorDescription || error,
          metadata: { provider: 'github' },
        },
        request
      );

      return createErrorResponse(
        errorDescription || error,
        'OAUTH_ERROR',
        400,
        requestId
      );
    }

    if (!code || !state) {
      return createErrorResponse(
        'Missing required parameters',
        'INVALID_REQUEST',
        400,
        requestId
      );
    }

    const oauthState = validateOAuthState(state);
    if (!oauthState) {
      await AuditLogger.logSecurityEvent(
        null,
        'LOGIN_FAILURE' as SecurityEventType,
        {
          action: 'github_oauth_callback',
          success: false,
          errorMessage: 'Invalid or expired OAuth state',
          metadata: { provider: 'github' },
        },
        request
      );

      return createErrorResponse(
        'Invalid or expired state parameter',
        'INVALID_STATE',
        400,
        requestId
      );
    }

    console.log('[OAuth Callback] Exchanging code for token...');
    const tokenResponse = await exchangeCodeForToken(code);

    console.log('[OAuth Callback] Fetching user profile...');
    const [githubUser, userEmails] = await Promise.all([
      getGitHubUser(tokenResponse.access_token),
      getGitHubUserEmails(tokenResponse.access_token),
    ]);

    const primaryEmail = userEmails.find((e) => e.primary && e.verified)?.email ||
                        userEmails.find((e) => e.verified)?.email ||
                        githubUser.email;

    console.log('[OAuth Callback] Fetching user installations...');
    let installations: number[] = [];
    try {
      const installationsResponse = await getUserInstallations(tokenResponse.access_token);
      installations = installationsResponse.installations.map((i) => i.id);
    } catch (installError) {
      console.warn('[OAuth Callback] Failed to fetch installations:', installError);
    }

    const miyabiUser = await upsertMiyabiUser({
      githubId: githubUser.id,
      githubLogin: githubUser.login,
      email: primaryEmail,
      name: githubUser.name,
      avatarUrl: githubUser.avatar_url,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiresAt: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : undefined,
      installations,
    });

    const sessionToken = generateMiyabiSessionToken(miyabiUser);

    await AuditLogger.logSecurityEvent(
      miyabiUser.id,
      'LOGIN_SUCCESS' as SecurityEventType,
      {
        action: 'github_oauth_callback',
        success: true,
        metadata: {
          provider: 'github',
          githubLogin: githubUser.login,
          installationCount: installations.length,
        },
      },
      request
    );

    console.log('[OAuth Callback] Authentication successful', {
      requestId,
      userId: miyabiUser.id,
      githubLogin: githubUser.login,
      installationCount: installations.length,
    });

    const redirectUrl = oauthState.redirectUrl || '/dashboard';
    const response = NextResponse.redirect(
      new URL(redirectUrl, request.url),
      { status: 302 }
    );

    response.cookies.set('miyabi-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('miyabi-user', JSON.stringify({
      id: miyabiUser.id,
      githubLogin: miyabiUser.githubLogin,
      avatarUrl: miyabiUser.avatarUrl,
      tier: miyabiUser.tier,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.headers.set('X-Request-ID', requestId);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    return response;

  } catch (error) {
    console.error('[OAuth Callback] Error:', error);

    await AuditLogger.logSecurityEvent(
      null,
      'LOGIN_FAILURE' as SecurityEventType,
      {
        action: 'github_oauth_callback',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: { provider: 'github' },
      },
      request
    );

    return createErrorResponse(
      'Authentication failed',
      'AUTH_ERROR',
      500,
      requestId
    );
  }
}

async function upsertMiyabiUser(data: {
  githubId: number;
  githubLogin: string;
  email: string | null;
  name: string | null;
  avatarUrl: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  installations: number[];
}): Promise<MiyabiGitHubUser> {
  const existingUser = await prisma.$queryRaw<any[]>`
    SELECT * FROM github_users WHERE github_id = ${data.githubId} LIMIT 1
  `;

  const now = new Date();

  if (existingUser.length > 0) {
    await prisma.$executeRaw`
      UPDATE github_users
      SET
        github_login = ${data.githubLogin},
        email = ${data.email},
        name = ${data.name},
        avatar_url = ${data.avatarUrl},
        access_token = ${data.accessToken},
        refresh_token = ${data.refreshToken || null},
        token_expires_at = ${data.tokenExpiresAt || null},
        installations = ${JSON.stringify(data.installations)},
        updated_at = ${now}
      WHERE github_id = ${data.githubId}
    `;

    return {
      id: existingUser[0].id,
      githubId: data.githubId,
      githubLogin: data.githubLogin,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      installations: data.installations,
      tier: existingUser[0].tier || 'free',
      createdAt: existingUser[0].created_at,
      updatedAt: now,
    };
  }

  const id = crypto.randomUUID();

  await prisma.$executeRaw`
    INSERT INTO github_users (
      id, github_id, github_login, email, name, avatar_url,
      access_token, refresh_token, token_expires_at,
      installations, tier, created_at, updated_at
    ) VALUES (
      ${id}, ${data.githubId}, ${data.githubLogin}, ${data.email}, ${data.name}, ${data.avatarUrl},
      ${data.accessToken}, ${data.refreshToken || null}, ${data.tokenExpiresAt || null},
      ${JSON.stringify(data.installations)}, 'free', ${now}, ${now}
    )
  `;

  return {
    id,
    githubId: data.githubId,
    githubLogin: data.githubLogin,
    email: data.email,
    name: data.name,
    avatarUrl: data.avatarUrl,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tokenExpiresAt: data.tokenExpiresAt,
    installations: data.installations,
    tier: 'free',
    createdAt: now,
    updatedAt: now,
  };
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.ip ||
    'unknown'
  );
}

function createErrorResponse(
  message: string,
  code: string,
  status: number,
  requestId: string,
  extra?: Record<string, unknown>
): NextResponse {
  const errorPageUrl = new URL('/auth/error', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  errorPageUrl.searchParams.set('error', code);
  errorPageUrl.searchParams.set('message', message);

  if (status >= 500) {
    return NextResponse.redirect(errorPageUrl, {
      status: 302,
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      requestId,
      ...extra,
    },
    {
      status,
      headers: {
        'X-Request-ID': requestId,
        'Content-Type': 'application/json',
      },
    }
  );
}

export const dynamic = 'force-dynamic';
