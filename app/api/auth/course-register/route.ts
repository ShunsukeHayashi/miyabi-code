/**
 * Course Platform Registration API Endpoint
 * Issue #1300: User registration API for AI Course functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateJWTToken } from '../../../../lib/auth/course-auth';
import { AuditLogger, SecurityEventType } from '../../../../lib/auth/security';
import { AdaptiveRateLimit } from '../../../../lib/auth/security';

const prisma = new PrismaClient();

interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  role?: UserRole;
  courseId?: string;
  acceptTerms: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientId = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    const rateLimit = AdaptiveRateLimit.checkRateLimit(clientId, 'register', 3, 3600000); // 3 attempts per hour

    if (!rateLimit.allowed) {
      await AuditLogger.logSecurityEvent(
        null,
        'RATE_LIMIT_EXCEEDED' as SecurityEventType,
        { action: 'register_attempt', remaining: rateLimit.remaining },
        request
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Too many registration attempts. Please try again later.',
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

    const body: RegisterRequest = await request.json();
    const {
      email,
      password,
      confirmPassword,
      username,
      role = 'STUDENT',
      courseId,
      acceptTerms
    } = body;

    // Validate input
    const errors: Record<string, string> = {};

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Valid email is required';
    }

    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!username || username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      errors.role = 'Invalid role specified';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      const error = existingUser.email === email.toLowerCase()
        ? 'An account with this email already exists'
        : 'This username is already taken';

      await AuditLogger.logSecurityEvent(
        null,
        'LOGIN_FAILURE' as SecurityEventType,
        { reason: 'user_exists', email, username },
        request
      );

      return NextResponse.json(
        { success: false, error },
        { status: 409 }
      );
    }

    // Validate course access if courseId is provided
    let courseInfo = null;
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

      if (course.status !== 'PUBLISHED') {
        return NextResponse.json(
          { success: false, error: 'Course is not available for enrollment' },
          { status: 403 }
        );
      }

      courseInfo = course;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user and credentials in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          role,
        },
      });

      // Store password hash separately
      await tx.$executeRaw`
        INSERT INTO user_credentials (user_id, password_hash, created_at, updated_at)
        VALUES (${newUser.id}, ${passwordHash}, NOW(), NOW())
      `;

      // Auto-enroll in course if provided and user is a student
      let enrollment = null;
      if (courseId && courseInfo && role === 'STUDENT') {
        enrollment = await tx.enrollment.create({
          data: {
            userId: newUser.id,
            courseId: courseId,
            status: 'ACTIVE',
            enrolledAt: new Date(),
          },
        });
      }

      return { user: newUser, enrollment };
    });

    // Generate JWT token
    const tokenPayload = {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      username: result.user.username,
    };

    const token = generateJWTToken(tokenPayload);

    // Log successful registration
    await AuditLogger.logSecurityEvent(
      result.user.id,
      'LOGIN_SUCCESS' as SecurityEventType,
      {
        action: 'user_registered',
        courseId,
        role,
        autoEnrolled: !!result.enrollment
      },
      request
    );

    // Log registration in user history
    await prisma.$executeRaw`
      INSERT INTO user_login_history (user_id, login_at, ip_address, user_agent, action)
      VALUES (${result.user.id}, NOW(), ${clientId}, ${request.headers.get('user-agent')}, 'REGISTER')
    `;

    // Determine redirect URL
    let redirectUrl = '/dashboard';
    if (courseId) {
      redirectUrl = `/courses/${courseId}`;
    } else if (role === 'INSTRUCTOR') {
      redirectUrl = '/instructor/setup';
    } else {
      redirectUrl = '/welcome';
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
        isEnrolled: !!result.enrollment,
        enrollmentDate: result.enrollment?.enrolledAt,
      },
      token,
      redirectUrl,
    });

    // Set secure HTTP-only cookie for token
    response.cookies.set('miyabi-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 1 day for new users
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);

    await AuditLogger.logSecurityEvent(
      null,
      'LOGIN_FAILURE' as SecurityEventType,
      {
        reason: 'system_error',
        action: 'registration_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      request
    );

    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}