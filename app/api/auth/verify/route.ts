/**
 * Authentication Verification API Endpoint
 * Issue #1300: Token verification API for AI Course functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateJWTToken, extractJWTToken } from '../../../../lib/auth/course-auth';
import { AuditLogger, SecurityEventType } from '../../../../lib/auth/security';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Extract token from request
    const token = extractJWTToken(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'No authentication token provided',
          code: 'NO_TOKEN',
        },
        { status: 401 }
      );
    }

    // Validate JWT token
    const user = await validateJWTToken(token);

    if (!user) {
      await AuditLogger.logSecurityEvent(
        null,
        'LOGIN_FAILURE' as SecurityEventType,
        { reason: 'invalid_token', action: 'token_verification' },
        request
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        },
        { status: 401 }
      );
    }

    // Get additional user information if needed
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userDetails) {
      await AuditLogger.logSecurityEvent(
        user.id,
        'LOGIN_FAILURE' as SecurityEventType,
        { reason: 'user_not_found', action: 'token_verification' },
        request
      );

      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Update last activity timestamp
    await prisma.$executeRaw`
      UPDATE users
      SET updated_at = NOW()
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      user: {
        id: userDetails.id,
        email: userDetails.email,
        username: userDetails.username,
        role: userDetails.role,
        createdAt: userDetails.createdAt,
        updatedAt: userDetails.updatedAt,
      },
      token, // Return the same token for client-side usage
    });

  } catch (error) {
    console.error('Token verification error:', error);

    await AuditLogger.logSecurityEvent(
      null,
      'LOGIN_FAILURE' as SecurityEventType,
      {
        reason: 'system_error',
        action: 'token_verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      request
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Token verification failed',
        code: 'VERIFICATION_ERROR',
      },
      { status: 500 }
    );
  }
}

// Handle POST for explicit verification requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token: bodyToken } = body;

    // Use token from body or headers
    const token = bodyToken || extractJWTToken(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'No authentication token provided',
          code: 'NO_TOKEN',
        },
        { status: 401 }
      );
    }

    // Validate token
    const user = await validateJWTToken(token);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      valid: true,
    });

  } catch (error) {
    console.error('Token verification error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Token verification failed',
        code: 'VERIFICATION_ERROR',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}