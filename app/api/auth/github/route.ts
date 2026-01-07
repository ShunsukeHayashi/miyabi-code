/**
 * GitHub OAuth Initiation Endpoint
 * GET /api/auth/github - Redirects to GitHub OAuth authorization
 *
 * Query Parameters:
 * - redirect_url: Optional URL to redirect after successful auth
 * - installation_id: Optional installation ID for app installation flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthState, buildOAuthAuthorizeUrl } from '../../../../lib/github-app/oauth';
import { checkOAuthRateLimit } from '../../../../lib/github-app/rate-limit';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = checkOAuthRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-Request-ID': requestId,
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt / 1000)),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirect_url') || undefined;
    const installationId = searchParams.get('installation_id');

    const state = generateOAuthState(
      redirectUrl,
      installationId ? parseInt(installationId, 10) : undefined
    );

    const authUrl = buildOAuthAuthorizeUrl(state);

    console.log(`[OAuth] Initiating GitHub OAuth flow`, {
      requestId,
      clientIp,
      hasRedirectUrl: !!redirectUrl,
      hasInstallationId: !!installationId,
    });

    return NextResponse.redirect(authUrl, {
      status: 302,
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[OAuth] Error initiating GitHub OAuth:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate OAuth flow',
        code: 'OAUTH_INIT_ERROR',
        requestId,
      },
      {
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'Content-Type': 'application/json',
        },
      }
    );
  }
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

export const dynamic = 'force-dynamic';
