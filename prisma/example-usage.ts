import { PrismaClient } from '@prisma/client';
import type { CourseWithDetails, UserProgressSummary } from './types';

const prisma = new PrismaClient();

/**
 * Example usage of the AI Course database schema
 * These functions demonstrate common operations for the learning platform
 */

// 1. Get featured courses for homepage
export async function getFeaturedCourses() {
  return await prisma.course.findMany({
    where: {
      status: 'PUBLISHED',
      featured: true
    },
    include: {
      creator: {
        select: {
          id: true,
          displayName: true,
          avatar: true
        }
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true
            }
          }
        }
      },
      lessons: {
        select: {
          id: true,
          title: true,
          duration: true,
          order: true,
          type: true,
          isPreview: true
        },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

// 2. Get course with all details for course page
export async function getCourseBySlug(slug: string, userId?: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      creator: {
        select: {
          id: true,
          displayName: true,
          avatar: true
        }
      },
      categories: {
        include: {
          category: true
        }
      },
      lessons: {
        orderBy: { order: 'asc' }
      },
      prerequisites: {
        include: {
          prerequisiteCourse: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      },
      reviews: {
        include: {
          user: {
            select: {
              displayName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true
        }
      }
    }
  });

  if (!course) return null;

  // Get user enrollment if userId provided
  let enrollment = null;
  if (userId) {
    enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id
        }
      }
    });
  }

  // Calculate average rating
  const avgRating = course.reviews.length > 0
    ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
    : null;

  return {
    ...course,
    avgRating,
    userEnrollment: enrollment
  };
}

// 3. Enroll user in course
export async function enrollUserInCourse(userId: string, courseId: string) {
  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  });

  if (existing) {
    throw new Error('User is already enrolled in this course');
  }

  // Check prerequisites
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      prerequisites: {
        include: {
          prerequisiteCourse: true
        }
      }
    }
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // Verify prerequisites are completed
  for (const prerequisite of course.prerequisites) {
    if (prerequisite.required) {
      const completedPrereq = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: prerequisite.prerequisiteCourseId,
          status: 'COMPLETED'
        }
      });

      if (!completedPrereq) {
        throw new Error(`Prerequisite course "${prerequisite.prerequisiteCourse.title}" must be completed first`);
      }
    }
  }

  // Create enrollment
  return await prisma.enrollment.create({
    data: {
      userId,
      courseId,
      amount: course.price || 0
    }
  });
}

// 4. Get user's learning progress
export async function getUserProgress(userId: string, courseId: string): Promise<UserProgressSummary> {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  });

  if (!enrollment) {
    throw new Error('User is not enrolled in this course');
  }

  const courseWithLessons = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!courseWithLessons) {
    throw new Error('Course not found');
  }

  const progress = await prisma.userProgress.findMany({
    where: {
      userId,
      courseId
    },
    include: {
      lesson: true
    }
  });

  const completedLessons = progress.filter(p => p.completedAt).length;
  const totalLessons = courseWithLessons.lessons.length;
  const totalTimeSpent = progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
  const lastAccessed = progress.reduce((latest, p) =>
    p.lastAccessedAt > latest ? p.lastAccessedAt : latest,
    new Date(0)
  );

  return {
    courseId,
    totalLessons,
    completedLessons,
    progressPercentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
    timeSpent: totalTimeSpent,
    lastAccessedAt: lastAccessed,
    isCompleted: enrollment.status === 'COMPLETED',
    enrolledAt: enrollment.enrolledAt
  };
}

// 5. Submit assessment answer
export async function submitAssessmentAnswer(
  userId: string,
  assessmentId: string,
  answers: any[],
  attemptNumber: number = 1
) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId }
  });

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  const questions = assessment.questions as any[];
  let totalScore = 0;

  // Calculate score (simplified - in real app you'd have more sophisticated scoring)
  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId);
    if (question && question.correct_answer !== undefined) {
      if (answer.answer === question.correct_answer) {
        totalScore += question.points;
      }
    }
  }

  const passed = assessment.passingScore ? totalScore >= assessment.passingScore : null;

  return await prisma.userAnswer.create({
    data: {
      userId,
      assessmentId,
      answers: JSON.stringify(answers),
      score: totalScore,
      passed,
      completedAt: new Date(),
      attemptNumber
    }
  });
}

// 6. Get learning paths with user progress
export async function getLearningPaths(userId?: string) {
  const paths = await prisma.learningPath.findMany({
    include: {
      courses: {
        include: {
          course: {
            include: {
              _count: {
                select: {
                  enrollments: true
                }
              }
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  if (!userId) return paths;

  // Add user progress for each path
  const pathsWithProgress = await Promise.all(
    paths.map(async (path) => {
      const courseIds = path.courses.map(pc => pc.courseId);
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId,
          courseId: { in: courseIds }
        }
      });

      const completedCourses = enrollments.filter(e => e.status === 'COMPLETED').length;
      const progressPercentage = path.courses.length > 0
        ? (completedCourses / path.courses.length) * 100
        : 0;

      return {
        ...path,
        userProgress: {
          completedCourses,
          totalCourses: path.courses.length,
          progressPercentage
        }
      };
    })
  );

  return pathsWithProgress;
}

// 7. Create course review
export async function createCourseReview(
  userId: string,
  courseId: string,
  rating: number,
  title?: string,
  comment?: string
) {
  // Check if user has completed the course
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  });

  if (!enrollment) {
    throw new Error('Must be enrolled to review course');
  }

  if (enrollment.status !== 'COMPLETED') {
    throw new Error('Must complete course before reviewing');
  }

  return await prisma.courseReview.create({
    data: {
      userId,
      courseId,
      rating,
      title,
      comment
    }
  });
}

// 8. Get instructor dashboard data
export async function getInstructorDashboard(instructorId: string) {
  const courses = await prisma.course.findMany({
    where: { creatorId: instructorId },
    include: {
      _count: {
        select: {
          enrollments: true,
          reviews: true
        }
      },
      enrollments: {
        select: {
          amount: true,
          status: true
        }
      },
      reviews: {
        select: {
          rating: true
        }
      }
    }
  });

  const totalStudents = courses.reduce((sum, course) => sum + course._count.enrollments, 0);
  const totalRevenue = courses.reduce((sum, course) =>
    sum + course.enrollments.reduce((courseSum, enrollment) =>
      courseSum + Number(enrollment.amount || 0), 0), 0);

  const allRatings = courses.flatMap(course => course.reviews.map(r => r.rating));
  const averageRating = allRatings.length > 0
    ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
    : 0;

  const completedEnrollments = courses.reduce((sum, course) =>
    sum + course.enrollments.filter(e => e.status === 'COMPLETED').length, 0);
  const completionRate = totalStudents > 0 ? (completedEnrollments / totalStudents) * 100 : 0;

  return {
    totalCourses: courses.length,
    totalStudents,
    totalRevenue,
    averageRating,
    completionRate,
    courses
  };
}

// Cleanup function
export async function disconnect() {
  await prisma.$disconnect();
}