/**
 * Course-specific Authentication Check API Endpoint
 * Issue #1300: Course access verification API
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  getCourseAuthContext,
  CourseAuthOptions,
  validateJWTToken,
  extractJWTToken
} from '../../../../../lib/auth/course-auth';
import { AuditLogger, SecurityEventType } from '../../../../../lib/auth/security';
import { withAuth } from '../../../../../lib/auth/middleware';

const prisma = new PrismaClient();

interface CourseAuthCheckParams {
  id: string;
}

export async function GET(
  request: NextRequest,
  context: { params: CourseAuthCheckParams }
) {
  return withAuth(async (req, authContext) => {
    const { id: courseId } = context.params;

    try {
      // Validate courseId
      if (!courseId) {
        return NextResponse.json(
          { success: false, error: 'Course ID is required' },
          { status: 400 }
        );
      }

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          creator: {
            select: { id: true, username: true, role: true }
          },
          instructors: {
            include: {
              instructor: {
                select: { id: true, username: true, role: true }
              }
            }
          },
          prerequisites: {
            include: {
              prerequisite: {
                select: { id: true, title: true }
              }
            }
          },
        },
      });

      if (!course) {
        return NextResponse.json(
          { success: false, error: 'Course not found' },
          { status: 404 }
        );
      }

      // Get comprehensive course authentication context
      const courseAuthOptions: CourseAuthOptions = {
        requireEnrollment: false, // We'll check this conditionally
        allowPreview: true,
        checkPrerequisites: true,
      };

      const authContextResult = await getCourseAuthContext(
        request,
        courseId,
        courseAuthOptions
      );

      if (!authContextResult) {
        await AuditLogger.logSecurityEvent(
          null,
          'UNAUTHORIZED_ACCESS_ATTEMPT' as SecurityEventType,
          { courseId, reason: 'no_auth_context' },
          request
        );

        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Get user's enrollment details
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: authContextResult.id,
            courseId: courseId,
          },
        },
        include: {
          course: {
            select: { title: true, status: true }
          }
        },
      });

      // Get user's progress
      const progress = await prisma.userProgress.findUnique({
        where: {
          userId_courseId: {
            userId: authContextResult.id,
            courseId: courseId,
          },
        },
        include: {
          completedLessons: {
            select: { lessonId: true, completedAt: true }
          }
        },
      });

      // Check completed prerequisites
      const completedPrerequisites: string[] = [];
      if (course.prerequisites.length > 0) {
        const userCertificates = await prisma.certificate.findMany({
          where: {
            userId: authContextResult.id,
            courseId: { in: course.prerequisites.map(p => p.prerequisiteId) },
          },
          select: { courseId: true, earnedAt: true },
        });
        completedPrerequisites.push(...userCertificates.map(c => c.courseId));
      }

      // Determine access level and permissions
      const isCreator = course.creatorId === authContextResult.id;
      const isInstructor = course.instructors.some(inst =>
        inst.instructorId === authContextResult.id
      );
      const isAdmin = authContextResult.role === 'ADMIN' || authContextResult.role === 'SUPER_ADMIN';

      // Compile comprehensive context
      const comprehensiveContext = {
        ...authContextResult,
        course: {
          id: course.id,
          title: course.title,
          status: course.status,
          isCreator,
          isInstructor: isInstructor || isCreator,
          isAdmin,
        },
        enrollment: enrollment ? {
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
        } : null,
        progress: progress ? {
          progressPercentage: progress.progressPercentage,
          completedLessons: progress.completedLessons.length,
          lastAccessedAt: progress.lastAccessedAt,
        } : null,
        prerequisites: {
          required: course.prerequisites.map(p => ({
            id: p.prerequisiteId,
            title: p.prerequisite.title,
          })),
          completed: completedPrerequisites,
          allCompleted: course.prerequisites.length === 0 ||
                       course.prerequisites.every(p =>
                         completedPrerequisites.includes(p.prerequisiteId)
                       ),
        },
        permissions: {
          canViewCourse: isCreator || isInstructor || isAdmin || (
            course.status === 'PUBLISHED' && (
              !enrollment || enrollment.status === 'ACTIVE'
            )
          ),
          canEditCourse: isCreator || isAdmin,
          canManageStudents: isCreator || isInstructor || isAdmin,
          canViewAnalytics: isCreator || isInstructor || isAdmin,
          canTakeAssessments: enrollment?.status === 'ACTIVE' && !isInstructor && !isAdmin,
          canViewProgress: !!enrollment || isCreator || isInstructor || isAdmin,
        },
      };

      // Log access check
      await AuditLogger.logSecurityEvent(
        authContextResult.id,
        'CONTENT_ACCESS' as SecurityEventType,
        {
          courseId,
          action: 'auth_check',
          isEnrolled: !!enrollment,
          permissions: Object.keys(comprehensiveContext.permissions).filter(
            key => comprehensiveContext.permissions[key as keyof typeof comprehensiveContext.permissions]
          ),
        },
        request
      );

      return NextResponse.json({
        success: true,
        context: comprehensiveContext,
      });

    } catch (error) {
      console.error('Course auth check error:', error);

      await AuditLogger.logSecurityEvent(
        authContext?.authContext?.id || null,
        'LOGIN_FAILURE' as SecurityEventType,
        {
          courseId,
          reason: 'system_error',
          action: 'auth_check',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        request
      );

      return NextResponse.json(
        { success: false, error: 'Authentication check failed' },
        { status: 500 }
      );
    }
  }, {
    // Middleware options - authentication required but no specific permissions
    auditLog: true,
  })(request, context);
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}