/**
 * Lesson Assessments API
 * Issue #1298: AI Course API Implementation
 *
 * GET /api/lessons/[id]/assessments - Get lesson assessments
 * POST /api/lessons/[id]/assessments - Create assessment
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
  CreateAssessmentSchema,
  type CreateAssessmentInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/lessons/[id]/assessments
 * Get lesson assessments
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const lessonId = params.id;

  // Check if lesson exists
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      courseId: true,
      course: {
        select: { status: true },
      },
    },
  });

  if (!lesson) {
    throw APIErrors.LESSON_NOT_FOUND;
  }

  // Get assessments
  const assessments = await db.assessment.findMany({
    where: { lessonId },
    include: {
      _count: {
        select: {
          userAnswers: true,
        },
      },
    },
  });

  // Transform response to hide correct answers from students
  const transformedAssessments = assessments.map(assessment => ({
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
    questions: Array.isArray(assessment.questions)
      ? (assessment.questions as any[]).map(q => ({
          id: q.id,
          type: q.type,
          question: q.question,
          options: q.options || [],
          points: q.points || 1,
          // Don't expose correct answers to students
          // correctAnswer and explanation only visible to instructors
        }))
      : [],
    stats: {
      totalAttempts: assessment._count.userAnswers,
    },
  }));

  return createSuccessResponse(transformedAssessments);
});

/**
 * POST /api/lessons/[id]/assessments
 * Create assessment (creator or admin only)
 */
export const POST = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const lessonId = params.id;
  const input: CreateAssessmentInput = await parseBody(request, CreateAssessmentSchema);

  // Check if lesson exists and get course info
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: {
        select: { id: true, creatorId: true },
      },
    },
  });

  if (!lesson) {
    throw APIErrors.LESSON_NOT_FOUND;
  }

  // Check permissions
  if (!canManageCourse(user, lesson.course.creatorId)) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Validate questions structure
  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    throw new Error('Assessment must have at least one question');
  }

  // Validate maxScore matches sum of question points
  const totalPoints = input.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  if (totalPoints !== input.maxScore) {
    throw new Error(`Max score (${input.maxScore}) must equal sum of question points (${totalPoints})`);
  }

  // Create assessment
  const assessment = await db.assessment.create({
    data: {
      ...input,
      lessonId,
      questions: input.questions,
    },
  });

  return createSuccessResponse(assessment);
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}