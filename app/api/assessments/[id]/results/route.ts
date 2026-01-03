/**
 * Assessment Results API
 * Issue #1298: AI Course API Implementation
 *
 * GET /api/assessments/[id]/results - Get assessment results
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, APIErrors } from '@/lib/api-error';
import { canManageCourse } from '@/lib/auth';
import {
  createSuccessResponse,
  withAuth,
  handleOptions
} from '@/lib/api-utils';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/assessments/[id]/results
 * Get assessment results
 */
export const GET = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const assessmentId = params.id;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'); // Optional: for instructors to view specific student results

  // Get assessment with course info
  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      lesson: {
        include: {
          course: {
            select: {
              id: true,
              creatorId: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!assessment) {
    throw APIErrors.ASSESSMENT_NOT_FOUND;
  }

  const courseId = assessment.lesson!.course.id;
  const isInstructor = canManageCourse(user, assessment.lesson!.course.creatorId);

  // Determine whose results to fetch
  let targetUserId: string;

  if (userId && isInstructor) {
    // Instructor viewing specific student's results
    targetUserId = userId;

    // Verify student is enrolled
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: targetUserId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error('Student not enrolled in this course');
    }
  } else {
    // Student viewing their own results
    targetUserId = user.id;

    // Check if user is enrolled
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: targetUserId,
          courseId,
        },
      },
    });

    if (!enrollment && !isInstructor) {
      throw new Error('You must be enrolled in the course to view results');
    }
  }

  // Get user's attempts
  const attempts = await db.userAnswer.findMany({
    where: {
      userId: targetUserId,
      assessmentId,
    },
    orderBy: {
      attemptNumber: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  if (attempts.length === 0) {
    return createSuccessResponse({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        maxScore: assessment.maxScore,
        passingScore: assessment.passingScore,
        attempts: assessment.attempts,
      },
      attempts: [],
      summary: {
        hasAttempted: false,
        bestScore: 0,
        latestScore: 0,
        passed: false,
        remainingAttempts: assessment.attempts,
      },
    });
  }

  // Calculate summary statistics
  const scores = attempts.map(a => a.score || 0);
  const bestScore = Math.max(...scores);
  const latestScore = scores[0]; // First in array is latest due to ordering
  const bestAttempt = attempts.find(a => a.score === bestScore);
  const latestAttempt = attempts[0];
  const passed = bestAttempt?.passed || false;

  // Transform attempts for response
  const transformedAttempts = attempts.map(attempt => {
    const attemptData: any = {
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      score: attempt.score,
      passed: attempt.passed,
      completedAt: attempt.completedAt,
      feedback: attempt.feedback,
    };

    // Include detailed answers for instructors or if assessment allows review
    if (isInstructor || passed || attempt.attemptNumber >= assessment.attempts) {
      attemptData.answers = attempt.answers;

      // Add question analysis for instructors
      if (isInstructor && assessment.questions) {
        const questions = assessment.questions as any[];
        attemptData.questionAnalysis = questions.map(question => {
          const userAnswer = (attempt.answers as any)?.[question.id];
          return {
            questionId: question.id,
            question: question.question,
            userAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect: userAnswer === question.correctAnswer,
            points: question.points,
          };
        });
      }
    }

    return attemptData;
  });

  // Get class statistics if instructor
  let classStatistics = null;
  if (isInstructor) {
    const allAttempts = await db.userAnswer.findMany({
      where: { assessmentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    const uniqueStudents = new Map();
    allAttempts.forEach(attempt => {
      const existing = uniqueStudents.get(attempt.userId);
      if (!existing || (attempt.score || 0) > (existing.score || 0)) {
        uniqueStudents.set(attempt.userId, attempt);
      }
    });

    const bestScores = Array.from(uniqueStudents.values()).map(a => a.score || 0);
    const passedCount = Array.from(uniqueStudents.values()).filter(a => a.passed).length;

    classStatistics = {
      totalStudents: uniqueStudents.size,
      averageScore: bestScores.length > 0
        ? bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length
        : 0,
      highestScore: bestScores.length > 0 ? Math.max(...bestScores) : 0,
      lowestScore: bestScores.length > 0 ? Math.min(...bestScores) : 0,
      passRate: uniqueStudents.size > 0 ? (passedCount / uniqueStudents.size) * 100 : 0,
      totalAttempts: allAttempts.length,
    };
  }

  const results = {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      maxScore: assessment.maxScore,
      passingScore: assessment.passingScore,
      attempts: assessment.attempts,
      type: assessment.type,
      course: {
        id: assessment.lesson!.course.id,
        title: assessment.lesson!.course.title,
      },
    },
    student: isInstructor && userId ? {
      id: targetUserId,
      username: attempts[0]?.user.username,
      displayName: attempts[0]?.user.displayName,
    } : undefined,
    attempts: transformedAttempts,
    summary: {
      hasAttempted: true,
      totalAttempts: attempts.length,
      bestScore,
      latestScore,
      passed,
      remainingAttempts: Math.max(0, assessment.attempts - attempts.length),
      bestAttemptDate: bestAttempt?.completedAt,
      latestAttemptDate: latestAttempt?.completedAt,
    },
    classStatistics,
  };

  return createSuccessResponse(results);
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}