/**
 * Course Platform Login API Endpoint
 * Issue #1300: Authentication API for AI Course functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateJWTToken } from '../../../../lib/auth/course-auth';
import { AuditLogger, SecurityEventType } from '../../../../lib/auth/security';
import { AdaptiveRateLimit } from '../../../../lib/auth/security';

const prisma = new PrismaClient();

interface LoginRequest {
  email: string;
  password: string;
  courseId?: string;
  rememberMe?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientId = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    const rateLimit = AdaptiveRateLimit.checkRateLimit(clientId, 'login', 5, 3600000); // 5 attempts per hour

    if (!rateLimit.allowed) {
      await AuditLogger.logSecurityEvent(
        null,
        'RATE_LIMIT_EXCEEDED' as SecurityEventType,
        { action: 'login_attempt', remaining: rateLimit.remaining },
        request
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(rateLimit.resetTime / 1000).toString(),
          }
        }
      );
    }

    const body: LoginRequest = await request.json();
    const { email, password, courseId, rememberMe } = body;

    // Validate input
    if (!email || !password) {
      await AuditLogger.logSecurityEvent(
        null,
        'LOGIN_FAILURE' as SecurityEventType,
        { reason: 'missing_credentials', email },
        request
      );

      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      await AuditLogger.logSecurityEvent(
        null,
        'LOGIN_FAILURE' as SecurityEventType,
        { reason: 'user_not_found', email },
        request
      );

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user's password hash (stored separately for security)
    const userCredentials = await prisma.$queryRaw<Array<{ password_hash: string }>>`
      SELECT password_hash FROM user_credentials WHERE user_id = ${user.id}
    `;

    if (!userCredentials.length) {
      await AuditLogger.logSecurityEvent(
        user.id,
        'LOGIN_FAILURE' as SecurityEventType,
        { reason: 'no_credentials', email },
        request
      );

      return NextResponse.json(
        { success: false, error: 'Account setup incomplete. Please contact support.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userCredentials[0].password_hash);

    if (!isValidPassword) {
      await AuditLogger.logSecurityEvent(
        user.id,
        'LOGIN_FAILURE' as SecurityEventType,
        { reason: 'invalid_password', email },
        request
      );

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if course access is required
    let courseAccess = null;
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          status: true,
          creatorId: true,
        },
      });

      if (!course) {
        return NextResponse.json(
          { success: false, error: 'Course not found' },
          { status: 404 }
        );
      }

      // Check enrollment for non-creator users
      if (course.creatorId !== user.id && user.role === 'STUDENT') {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: courseId,
            },
          },
        });

        if (!enrollment || enrollment.status !== 'ACTIVE') {
          await AuditLogger.logSecurityEvent(
            user.id,
            'UNAUTHORIZED_ACCESS_ATTEMPT' as SecurityEventType,
            { courseId, reason: 'not_enrolled' },
            request
          );

          return NextResponse.json(
            { success: false, error: 'Course enrollment required' },
            { status: 403 }
          );
        }

        courseAccess = {
          isEnrolled: true,
          enrollmentDate: enrollment.enrolledAt,
          status: enrollment.status,
        };
      }
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };

    const token = generateJWTToken(tokenPayload);

    // Update last login timestamp
    await prisma.$executeRaw`
      INSERT INTO user_login_history (user_id, login_at, ip_address, user_agent)
      VALUES (${user.id}, NOW(), ${clientId}, ${request.headers.get('user-agent')})
    `;

    // Log successful login
    await AuditLogger.logSecurityEvent(
      user.id,
      'LOGIN_SUCCESS' as SecurityEventType,
      { courseId, rememberMe },
      request
    );

    // Determine redirect URL
    let redirectUrl = '/dashboard';
    if (courseId) {
      redirectUrl = `/courses/${courseId}`;
    } else if (user.role === 'INSTRUCTOR') {
      redirectUrl = '/instructor/dashboard';
    } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      redirectUrl = '/admin/dashboard';
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        ...courseAccess,
      },
      token,
      redirectUrl,
    });

    // Set secure HTTP-only cookie for token
    const cookieMaxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 days or 1 day
    response.cookies.set('miyabi-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);

    await AuditLogger.logSecurityEvent(
      null,
      'LOGIN_FAILURE' as SecurityEventType,
      { reason: 'system_error', error: error instanceof Error ? error.message : 'Unknown error' },
      request
    );

    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}