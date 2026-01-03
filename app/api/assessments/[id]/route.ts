/**
 * Assessment Management API
 * Issue #1298: AI Course API Implementation
 *
 * GET /api/assessments/[id] - Get assessment details
 * PUT /api/assessments/[id] - Update assessment
 * DELETE /api/assessments/[id] - Delete assessment
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, APIErrors } from '@/lib/api-error';
import { canManageCourse } from '@/lib/auth';
import {
  parseBody,
  createSuccessResponse,
  withAuth,
  handleOptions
} from '@/lib/api-utils';
import {
  UpdateAssessmentSchema,
  type UpdateAssessmentInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/assessments/[id]
 * Get assessment details
 */
export const GET = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const assessmentId = params.id;

  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      lesson: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              creatorId: true,
            },
          },
        },
      },
      _count: {
        select: {
          userAnswers: true,
        },
      },
    },
  });

  if (!assessment) {
    throw APIErrors.ASSESSMENT_NOT_FOUND;
  }

  const courseId = assessment.lesson!.course.id;
  const isInstructor = canManageCourse(user, assessment.lesson!.course.creatorId);

  // Check if user is enrolled or is instructor
  if (!isInstructor) {
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error('You must be enrolled in the course to view this assessment');
    }
  }

  // Transform questions - hide answers from students
  const transformedQuestions = Array.isArray(assessment.questions)
    ? (assessment.questions as any[]).map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options || [],
        points: q.points || 1,
        // Only show correct answers and explanations to instructors
        ...(isInstructor ? {
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        } : {}),
      }))
    : [];

  const transformedAssessment = {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    maxScore: assessment.maxScore,
    passingScore: assessment.passingScore,
    timeLimit: assessment.timeLimit,
    attempts: assessment.attempts,
    type: assessment.type,
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
    questions: transformedQuestions,
    lesson: {
      id: assessment.lesson!.id,
      title: assessment.lesson!.title,
      course: assessment.lesson!.course,
    },
    stats: {
      totalAttempts: assessment._count.userAnswers,
    },
  };

  return createSuccessResponse(transformedAssessment);
}));

/**
 * PUT /api/assessments/[id]
 * Update assessment (creator or admin only)
 */
export const PUT = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const assessmentId = params.id;
  const input: UpdateAssessmentInput = await parseBody(request, UpdateAssessmentSchema);

  // Get assessment with course info
  const existingAssessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      lesson: {
        include: {
          course: {
            select: { id: true, creatorId: true },
          },
        },
      },
    },
  });

  if (!existingAssessment) {
    throw APIErrors.ASSESSMENT_NOT_FOUND;
  }

  // Check permissions
  if (!canManageCourse(user, existingAssessment.lesson!.course.creatorId)) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Check if assessment has attempts (prevent major changes if students have taken it)
  const hasAttempts = await db.userAnswer.count({
    where: { assessmentId },
  });

  if (hasAttempts > 0 && input.questions) {
    throw new Error('Cannot modify questions after students have taken the assessment');
  }

  // Validate updated data if questions are provided
  if (input.questions && input.maxScore) {
    const totalPoints = input.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    if (totalPoints !== input.maxScore) {
      throw new Error(`Max score (${input.maxScore}) must equal sum of question points (${totalPoints})`);
    }
  }

  // Update assessment
  const assessment = await db.assessment.update({
    where: { id: assessmentId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
    include: {
      lesson: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  return createSuccessResponse(assessment);
}));

/**
 * DELETE /api/assessments/[id]
 * Delete assessment (creator or admin only)
 */
export const DELETE = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const assessmentId = params.id;

  // Get assessment with course info
  const existingAssessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      lesson: {
        include: {
          course: {
            select: { id: true, creatorId: true },
          },
        },
      },
    },
  });

  if (!existingAssessment) {
    throw APIErrors.ASSESSMENT_NOT_FOUND;
  }

  // Check permissions
  if (!canManageCourse(user, existingAssessment.lesson!.course.creatorId)) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Check if assessment has attempts
  const hasAttempts = await db.userAnswer.count({
    where: { assessmentId },
  });

  if (hasAttempts > 0) {
    throw new Error('Cannot delete assessment with existing student attempts. Consider archiving the course instead.');
  }

  // Delete assessment
  await db.assessment.delete({
    where: { id: assessmentId },
  });

  return createSuccessResponse({
    message: `Assessment "${existingAssessment.title}" deleted successfully`,
    deletedAt: new Date().toISOString(),
  });
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}