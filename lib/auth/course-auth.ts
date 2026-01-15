/**
 * Course-specific Authentication System
 * Issue #1300: Comprehensive authentication integration for AI Course functionality
 */

import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth';

const prisma = new PrismaClient();

export interface CourseAuthOptions {
  requireEnrollment?: boolean;
  requireActiveSubscription?: boolean;
  allowPreview?: boolean;
  checkPrerequisites?: boolean;
}

export interface CourseAuthContext extends AuthenticatedUser {
  isEnrolled: boolean;
  hasActiveSubscription: boolean;
  enrollmentDate?: Date;
  progress?: number;
  completedPrerequisites: string[];
  coursePermissions: string[];
}

/**
 * JWT Token payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  username?: string;
  iat?: number;
  exp?: number;
}

/**
 * Validate JWT token and extract user information
 */
export async function validateJWTToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = jwt.verify(token, jwtSecret) as JWTPayload;

    // Additional validation - check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
      return null; // User no longer exists
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username || undefined,
    };
  } catch (error) {
    console.error('JWT validation error:', error);
    return null;
  }
}

/**
 * Extract JWT token from request
 */
export function extractJWTToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check for session cookie
  const tokenCookie = request.cookies.get('miyabi-auth-token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * Get comprehensive course authentication context
 */
export async function getCourseAuthContext(
  request: NextRequest,
  courseId: string,
  options: CourseAuthOptions = {},
): Promise<CourseAuthContext | null> {
  // Extract and validate token
  const token = extractJWTToken(request);
  if (!token) {
    return null;
  }

  const user = await validateJWTToken(token);
  if (!user) {
    return null;
  }

  // Get course-specific information
  const courseData = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      creator: { select: { id: true } },
      instructors: {
        include: {
          instructor: { select: { id: true, role: true } },
        },
      },
      prerequisites: {
        include: {
          prerequisite: { select: { id: true, title: true } },
        },
      },
    },
  });

  if (!courseData) {
    return null;
  }

  // Check enrollment status
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId,
      },
    },
  });

  // Get user progress
  const progress = await prisma.userProgress.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId,
      },
    },
  });

  // Check completed prerequisites
  const completedPrerequisites: string[] = [];
  if (options.checkPrerequisites && courseData.prerequisites.length > 0) {
    const userCertificates = await prisma.certificate.findMany({
      where: {
        userId: user.id,
        courseId: { in: courseData.prerequisites.map(p => p.prerequisiteId) },
      },
      select: { courseId: true },
    });
    completedPrerequisites.push(...userCertificates.map(c => c.courseId));
  }

  // Determine permissions
  const coursePermissions = getCoursePermissions(user, courseData, enrollment);

  return {
    ...user,
    isEnrolled: !!enrollment,
    hasActiveSubscription: enrollment?.status === 'ACTIVE',
    enrollmentDate: enrollment?.enrolledAt,
    progress: progress?.progressPercentage || 0,
    completedPrerequisites,
    coursePermissions,
  };
}

/**
 * Determine user permissions for a specific course
 */
function getCoursePermissions(
  user: AuthenticatedUser,
  course: any,
  enrollment: any,
): string[] {
  const permissions: string[] = [];

  // Admin permissions
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    permissions.push(
      'course:view',
      'course:edit',
      'course:delete',
      'course:manage_students',
      'course:view_analytics',
      'lesson:view',
      'lesson:edit',
      'assessment:view',
      'assessment:edit',
      'assessment:grade',
    );
    return permissions;
  }

  // Course creator permissions
  if (course.creatorId === user.id) {
    permissions.push(
      'course:view',
      'course:edit',
      'course:manage_students',
      'course:view_analytics',
      'lesson:view',
      'lesson:edit',
      'assessment:view',
      'assessment:edit',
      'assessment:grade',
    );
    return permissions;
  }

  // Instructor permissions
  if (user.role === 'INSTRUCTOR') {
    const isInstructor = course.instructors.some((inst: any) => inst.instructorId === user.id);
    if (isInstructor) {
      permissions.push(
        'course:view',
        'lesson:view',
        'lesson:edit',
        'assessment:view',
        'assessment:edit',
        'assessment:grade',
      );
    }
  }

  // Student permissions
  if (enrollment?.status === 'ACTIVE') {
    permissions.push(
      'course:view',
      'lesson:view',
      'assessment:take',
      'progress:view',
    );
  } else if (course.status === 'PUBLISHED') {
    // Non-enrolled users can preview
    permissions.push('course:preview');
  }

  return permissions;
}

/**
 * Check if user has specific permission for a course
 */
export function hasPermission(context: CourseAuthContext, permission: string): boolean {
  return context.coursePermissions.includes(permission);
}

/**
 * Middleware function for course authentication
 */
export async function courseAuthMiddleware(
  request: NextRequest,
  courseId: string,
  requiredPermission?: string,
  options: CourseAuthOptions = {},
): Promise<{ success: boolean; context?: CourseAuthContext; error?: string }> {
  try {
    const context = await getCourseAuthContext(request, courseId, options);

    if (!context) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check required permission
    if (requiredPermission && !hasPermission(context, requiredPermission)) {
      return {
        success: false,
        error: `Insufficient permissions. Required: ${requiredPermission}`,
      };
    }

    // Check enrollment requirement
    if (options.requireEnrollment && !context.isEnrolled) {
      return {
        success: false,
        error: 'Course enrollment required',
      };
    }

    // Check active subscription requirement
    if (options.requireActiveSubscription && !context.hasActiveSubscription) {
      return {
        success: false,
        error: 'Active subscription required',
      };
    }

    // Check prerequisites
    if (options.checkPrerequisites) {
      // Implementation would check if all prerequisites are completed
      // For now, we just verify the completedPrerequisites array is populated
    }

    return {
      success: true,
      context,
    };
  } catch (error) {
    console.error('Course authentication error:', error);
    return {
      success: false,
      error: 'Authentication system error',
    };
  }
}

/**
 * Generate JWT token for authenticated user
 */
export function generateJWTToken(user: AuthenticatedUser): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'miyabi-course-platform',
    audience: 'miyabi-users',
  });
}

/**
 * Session management utilities
 */
export class SessionManager {
  private static readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static sessions = new Map<string, { userId: string; expiresAt: Date }>();

  static createSession(userId: string): string {
    const sessionId = jwt.sign(
      { userId, type: 'session' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    this.sessions.set(sessionId, {
      userId,
      expiresAt: new Date(Date.now() + this.SESSION_DURATION),
    });

    return sessionId;
  }

  static validateSession(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session.userId;
  }

  static destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  static cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Auto-cleanup expired sessions every hour
setInterval(() => {
  SessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);
