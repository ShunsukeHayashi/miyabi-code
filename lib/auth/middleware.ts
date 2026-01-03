/**
 * API Authentication Middleware
 * Issue #1300: Middleware for API endpoint authentication and authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  getCourseAuthContext,
  CourseAuthContext,
  CourseAuthOptions
} from './course-auth';
import {
  hasPermission as checkRolePermission,
  Permission,
  PermissionContext
} from './roles';

const prisma = new PrismaClient();

export interface MiddlewareOptions {
  requiredPermissions?: Permission[];
  requireAnyPermission?: boolean; // If true, user needs ANY of the permissions instead of ALL
  courseId?: string; // Extract from URL params if not provided
  courseOptions?: CourseAuthOptions;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  auditLog?: boolean;
}

export interface AuthMiddlewareResult {
  success: boolean;
  context?: CourseAuthContext;
  permissionContext?: PermissionContext;
  error?: string;
  statusCode?: number;
}

/**
 * Rate limiting store (in production, use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: Date }>();

/**
 * Audit log store (in production, use database)
 */
interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
}

const auditLogs: AuditLogEntry[] = [];

/**
 * Main authentication middleware
 */
export async function authMiddleware(
  request: NextRequest,
  options: MiddlewareOptions = {}
): Promise<AuthMiddlewareResult> {
  try {
    // Extract course ID from URL if not provided
    const courseId = options.courseId || extractCourseIdFromUrl(request.url);

    // Rate limiting check
    if (options.rateLimit) {
      const rateLimitResult = checkRateLimit(request, options.rateLimit);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          statusCode: 429,
        };
      }
    }

    // Get authentication context
    let context: CourseAuthContext | null = null;
    let permissionContext: PermissionContext | null = null;

    if (courseId) {
      // Course-specific authentication
      context = await getCourseAuthContext(request, courseId, options.courseOptions);
      if (context) {
        permissionContext = createPermissionContext(context, courseId);
      }
    } else {
      // General authentication without course context
      const generalContext = await getGeneralAuthContext(request);
      if (generalContext) {
        context = generalContext as CourseAuthContext;
        permissionContext = createPermissionContext(generalContext, undefined);
      }
    }

    // Check if authentication is required
    if (!context && (options.requiredPermissions || options.courseOptions?.requireEnrollment)) {
      await logAuditEvent(request, {
        action: 'AUTH_FAILED',
        resource: courseId || 'api',
        success: false,
        details: { reason: 'No valid authentication' }
      });

      return {
        success: false,
        error: 'Authentication required',
        statusCode: 401,
      };
    }

    // Check permissions if required
    if (options.requiredPermissions && context && permissionContext) {
      const hasRequiredPermissions = options.requireAnyPermission
        ? options.requiredPermissions.some(permission =>
            checkRolePermission(permissionContext!, permission)
          )
        : options.requiredPermissions.every(permission =>
            checkRolePermission(permissionContext!, permission)
          );

      if (!hasRequiredPermissions) {
        await logAuditEvent(request, {
          userId: context.id,
          action: 'AUTHORIZATION_FAILED',
          resource: courseId || 'api',
          success: false,
          details: {
            requiredPermissions: options.requiredPermissions,
            userPermissions: permissionContext ? getUserPermissionsForContext(permissionContext) : []
          }
        });

        return {
          success: false,
          error: 'Insufficient permissions',
          statusCode: 403,
        };
      }
    }

    // Log successful authentication
    if (options.auditLog && context) {
      await logAuditEvent(request, {
        userId: context.id,
        action: 'AUTH_SUCCESS',
        resource: courseId || 'api',
        success: true,
        details: {
          permissions: options.requiredPermissions || [],
          courseId: courseId
        }
      });
    }

    return {
      success: true,
      context: context || undefined,
      permissionContext: permissionContext || undefined,
    };

  } catch (error) {
    console.error('Auth middleware error:', error);

    await logAuditEvent(request, {
      action: 'AUTH_ERROR',
      resource: options.courseId || 'api',
      success: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });

    return {
      success: false,
      error: 'Authentication system error',
      statusCode: 500,
    };
  }
}

/**
 * Extract course ID from URL path
 */
function extractCourseIdFromUrl(url: string): string | undefined {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');

  // Look for course ID in common patterns
  // /api/courses/[courseId]/...
  // /courses/[courseId]/...
  const courseIndex = pathParts.findIndex(part => part === 'courses');
  if (courseIndex !== -1 && pathParts[courseIndex + 1]) {
    return pathParts[courseIndex + 1];
  }

  return undefined;
}

/**
 * Get general authentication context (without course)
 */
async function getGeneralAuthContext(request: NextRequest): Promise<CourseAuthContext | null> {
  // This would integrate with the existing Miyabi auth system
  // For now, we'll use a simplified version
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return null;
    }

    // Validate token and get user
    const user = await validateGeneralToken(token);
    if (!user) {
      return null;
    }

    return {
      ...user,
      isEnrolled: false,
      hasActiveSubscription: false,
      completedPrerequisites: [],
      coursePermissions: [],
    };
  } catch (error) {
    console.error('General auth context error:', error);
    return null;
  }
}

/**
 * Extract token from request (integrates with existing auth)
 */
function extractTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check cookies
  const tokenCookie = request.cookies.get('miyabi-auth-token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * Validate general token (placeholder - integrate with existing Miyabi auth)
 */
async function validateGeneralToken(token: string): Promise<any | null> {
  // This would integrate with the existing Miyabi authentication system
  // For now, return null to indicate integration needed
  return null;
}

/**
 * Create permission context from auth context
 */
function createPermissionContext(
  authContext: CourseAuthContext,
  courseId?: string
): PermissionContext {
  return {
    userId: authContext.id,
    userRole: authContext.role,
    courseId,
    courseCreatorId: undefined, // Would be set based on course data
    isEnrolled: authContext.isEnrolled,
    isInstructor: authContext.role === 'INSTRUCTOR',
    enrollmentStatus: authContext.hasActiveSubscription ? 'ACTIVE' : undefined,
  };
}

/**
 * Get user permissions for logging
 */
function getUserPermissionsForContext(context: PermissionContext): string[] {
  // This would integrate with the roles system
  // Return basic permissions for now
  return [`${context.userRole.toLowerCase()}:basic`];
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(
  request: NextRequest,
  options: { requests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: Date } {
  const clientId = getClientIdentifier(request);
  const now = new Date();
  const windowStart = new Date(now.getTime() - options.windowMs);

  let rateLimitInfo = rateLimitStore.get(clientId);

  // Clean up old entries or create new one
  if (!rateLimitInfo || rateLimitInfo.resetAt < windowStart) {
    rateLimitInfo = {
      count: 0,
      resetAt: new Date(now.getTime() + options.windowMs),
    };
    rateLimitStore.set(clientId, rateLimitInfo);
  }

  rateLimitInfo.count++;

  const remaining = Math.max(0, options.requests - rateLimitInfo.count);
  const allowed = rateLimitInfo.count <= options.requests;

  return {
    allowed,
    remaining,
    resetAt: rateLimitInfo.resetAt,
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // In production, use IP address or authenticated user ID
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

/**
 * Log audit event
 */
async function logAuditEvent(request: NextRequest, details: Partial<AuditLogEntry>): Promise<void> {
  const entry: AuditLogEntry = {
    action: details.action || 'UNKNOWN',
    resource: details.resource || 'unknown',
    timestamp: new Date(),
    ip: getClientIdentifier(request),
    userAgent: request.headers.get('user-agent') || undefined,
    success: details.success ?? false,
    userId: details.userId,
    details: details.details,
  };

  // In production, this would write to database
  auditLogs.push(entry);

  // Keep only last 1000 entries in memory
  if (auditLogs.length > 1000) {
    auditLogs.splice(0, auditLogs.length - 1000);
  }

  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Audit Log:', entry);
  }
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withAuth(
  handler: (
    req: NextRequest,
    context: {
      params: any,
      authContext?: CourseAuthContext,
      permissionContext?: PermissionContext
    }
  ) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return async (req: NextRequest, context: { params: any }) => {
    const authResult = await authMiddleware(req, options);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error || 'Authentication failed',
          code: authResult.statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' :
                authResult.statusCode === 403 ? 'INSUFFICIENT_PERMISSIONS' :
                authResult.statusCode === 401 ? 'AUTHENTICATION_REQUIRED' : 'AUTH_ERROR'
        },
        { status: authResult.statusCode || 401 }
      );
    }

    // Add auth context to the handler context
    const enhancedContext = {
      ...context,
      authContext: authResult.context,
      permissionContext: authResult.permissionContext,
    };

    return handler(req, enhancedContext);
  };
}

/**
 * Get audit logs (for admin users)
 */
export function getAuditLogs(limit = 100): AuditLogEntry[] {
  return auditLogs.slice(-limit);
}

/**
 * Clear audit logs (for maintenance)
 */
export function clearAuditLogs(): void {
  auditLogs.length = 0;
}

/**
 * Export rate limit information for monitoring
 */
export function getRateLimitStats(): Map<string, { count: number; resetAt: Date }> {
  return new Map(rateLimitStore);
}

/**
 * Simple authentication function for API routes
 * This is a simpler wrapper around the main authMiddleware
 */
export async function authenticateRequest(
  request: NextRequest,
  options: MiddlewareOptions = {}
): Promise<AuthMiddlewareResult> {
  return await authMiddleware(request, options);
}