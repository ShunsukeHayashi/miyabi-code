/**
 * Course Platform Logout API Endpoint
 * Issue #1300: Logout API for AI Course functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateJWTToken, extractJWTToken, SessionManager } from '../../../../lib/auth/course-auth';
import { AuditLogger, SecurityEventType } from '../../../../lib/auth/security';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Extract token from request
    const token = extractJWTToken(request);
    let userId: string | null = null;

    // Validate token and get user info for logging
    if (token) {
      const user = await validateJWTToken(token);
      if (user) {
        userId = user.id;

        // Log logout in user history
        const clientId = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
        await prisma.$executeRaw`
          INSERT INTO user_login_history (user_id, login_at, ip_address, user_agent, action)
          VALUES (${userId}, NOW(), ${clientId}, ${request.headers.get('user-agent')}, 'LOGOUT')
        `;

        // Destroy session if using session management
        try {
          SessionManager.destroySession(token);
        } catch (error) {
          // Session cleanup error is non-critical
          console.warn('Session cleanup warning:', error);
        }

        // Log security event
        await AuditLogger.logSecurityEvent(
          userId,
          'LOGOUT' as SecurityEventType,
          { action: 'user_logout' },
          request
        );
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear authentication cookies
    response.cookies.set('miyabi-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Expire immediately
      path: '/',
    });

    // Clear any other auth-related cookies
    response.cookies.set('miyabi-session-id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, we should clear the cookies and return success
    // This ensures the client-side logout process completes
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear cookies regardless of error
    response.cookies.set('miyabi-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });

    return response;
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}