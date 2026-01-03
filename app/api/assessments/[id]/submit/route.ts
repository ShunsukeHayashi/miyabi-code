/**
 * Assessment Submission API
 * Issue #1298: AI Course API Implementation
 *
 * POST /api/assessments/[id]/submit - Submit assessment
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, APIErrors } from '@/lib/api-error';
import {
  parseBody,
  createSuccessResponse,
  withAuth,
  handleOptions
} from '@/lib/api-utils';
import {
  SubmitAssessmentSchema,
  type SubmitAssessmentInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/assessments/[id]/submit
 * Submit assessment answers
 */
export const POST = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const assessmentId = params.id;
  const input: SubmitAssessmentInput = await parseBody(request, SubmitAssessmentSchema);

  // Get assessment with questions
  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      lesson: {
        include: {
          course: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!assessment) {
    throw APIErrors.ASSESSMENT_NOT_FOUND;
  }

  // Check if user is enrolled in the course
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: assessment.lesson!.course.id,
      },
    },
  });

  if (!enrollment || enrollment.status !== 'ACTIVE') {
    throw new Error('You must be actively enrolled in the course to take assessments');
  }

  // Check existing attempts
  const existingAttempts = await db.userAnswer.count({
    where: {
      userId: user.id,
      assessmentId,
    },
  });

  if (existingAttempts >= assessment.attempts) {
    throw new Error(`Maximum attempts (${assessment.attempts}) exceeded for this assessment`);
  }

  const attemptNumber = existingAttempts + 1;

  // Grade the assessment
  const questions = assessment.questions as any[];
  const results = questions.map(question => {
    const userAnswer = input.answers[question.id];
    const correctAnswer = question.correctAnswer;

    let isCorrect = false;
    let partialPoints = 0;

    switch (question.type) {
      case 'multiple_choice':
      case 'true_false':
        isCorrect = userAnswer === correctAnswer;
        partialPoints = isCorrect ? question.points : 0;
        break;

      case 'short_answer':
        // Simple string comparison for short answers
        // In production, you might want more sophisticated matching
        isCorrect = String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
        partialPoints = isCorrect ? question.points : 0;
        break;

      case 'essay':
        // Essays require manual grading
        partialPoints = 0;
        isCorrect = false;
        break;

      default:
        isCorrect = false;
        partialPoints = 0;
    }

    return {
      questionId: question.id,
      userAnswer,
      correctAnswer,
      isCorrect,
      pointsEarned: partialPoints,
      totalPoints: question.points,
      explanation: question.explanation,
    };
  });

  // Calculate total score
  const score = results.reduce((sum, result) => sum + result.pointsEarned, 0);
  const passed = assessment.passingScore ? score >= assessment.passingScore : true;

  // Generate feedback
  const feedback = generateFeedback(results, score, assessment.maxScore, passed);

  // Save user answer
  const userAnswer = await db.userAnswer.create({
    data: {
      userId: user.id,
      assessmentId,
      answers: input.answers,
      score,
      passed,
      completedAt: new Date(),
      attemptNumber,
      feedback,
    },
  });

  // If assessment is passed, mark lesson progress
  if (passed && assessment.lessonId) {
    await db.userProgress.upsert({
      where: {
        userId_courseId_lessonId: {
          userId: user.id,
          courseId: assessment.lesson!.course.id,
          lessonId: assessment.lessonId,
        },
      },
      update: {
        completedAt: new Date(),
        lastAccessedAt: new Date(),
        timeSpent: input.timeSpent,
      },
      create: {
        userId: user.id,
        courseId: assessment.lesson!.course.id,
        lessonId: assessment.lessonId,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
        timeSpent: input.timeSpent,
      },
    });
  }

  const response = {
    submission: {
      id: userAnswer.id,
      score,
      maxScore: assessment.maxScore,
      passed,
      attemptNumber,
      completedAt: userAnswer.completedAt,
      feedback,
      remainingAttempts: assessment.attempts - attemptNumber,
    },
    results: results.map(r => ({
      questionId: r.questionId,
      isCorrect: r.isCorrect,
      pointsEarned: r.pointsEarned,
      totalPoints: r.totalPoints,
      explanation: r.explanation,
      // Don't show correct answer unless assessment allows review
      ...(passed || attemptNumber >= assessment.attempts ? {
        correctAnswer: r.correctAnswer,
        userAnswer: r.userAnswer,
      } : {}),
    })),
  };

  return createSuccessResponse(response);
}));

/**
 * Generate feedback based on assessment results
 */
function generateFeedback(
  results: any[],
  score: number,
  maxScore: number,
  passed: boolean
): string {
  const percentage = Math.round((score / maxScore) * 100);
  const correctAnswers = results.filter(r => r.isCorrect).length;
  const totalQuestions = results.length;

  let feedback = `You scored ${score} out of ${maxScore} points (${percentage}%). `;
  feedback += `You answered ${correctAnswers} out of ${totalQuestions} questions correctly. `;

  if (passed) {
    if (percentage >= 90) {
      feedback += "Excellent work! You have a strong understanding of the material.";
    } else if (percentage >= 80) {
      feedback += "Good job! You demonstrate a solid grasp of the concepts.";
    } else {
      feedback += "Well done! You've successfully completed this assessment.";
    }
  } else {
    feedback += "You haven't reached the passing score yet. ";

    const weakAreas = results
      .filter(r => !r.isCorrect)
      .map(r => r.questionId);

    if (weakAreas.length > 0) {
      feedback += `Consider reviewing the material related to questions ${weakAreas.join(', ')}. `;
    }

    feedback += "You can try again to improve your score.";
  }

  return feedback;
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}