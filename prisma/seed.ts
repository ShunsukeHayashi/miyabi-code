import { PrismaClient, UserRole, CourseStatus, CourseLevel, LessonType, AssessmentType, EnrollmentStatus, InstructorRole, InstructorPermission, SettingType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in reverse order of dependencies)
  await prisma.userAnswer.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseReview.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.courseAnalytics.deleteMany();
  await prisma.learningPathCourse.deleteMany();
  await prisma.learningPath.deleteMany();
  await prisma.coursePrerequisite.deleteMany();
  await prisma.courseInstructor.deleteMany();
  await prisma.courseCategory.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  console.log('🧹 Database cleared');

  // 1. Create System Settings
  const systemSettings = [
    { key: 'platform_name', value: 'Miyabi Learning Platform', type: SettingType.STRING, description: 'Platform display name' },
    { key: 'default_course_price', value: '99.99', type: SettingType.FLOAT, description: 'Default course pricing' },
    { key: 'max_course_duration', value: '720', type: SettingType.INTEGER, description: 'Maximum course duration in minutes' },
    { key: 'enable_certificates', value: 'true', type: SettingType.BOOLEAN, description: 'Enable certificate generation' },
    { key: 'payment_config', value: '{"stripe_public_key": "pk_test_...", "enabled": true}', type: SettingType.JSON, description: 'Payment gateway configuration' }
  ];

  await prisma.systemSetting.createMany({ data: systemSettings });
  console.log('⚙️ System settings created');

  // 2. Create Users
  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@miyabi.dev',
        username: 'admin',
        displayName: 'Miyabi Admin',
        role: UserRole.SUPER_ADMIN,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      }
    }),

    // Instructors
    prisma.user.create({
      data: {
        email: 'instructor1@miyabi.dev',
        username: 'yuki_sensei',
        displayName: 'Yuki Tanaka',
        role: UserRole.INSTRUCTOR,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      }
    }),

    prisma.user.create({
      data: {
        email: 'instructor2@miyabi.dev',
        username: 'ai_master',
        displayName: 'Hiroshi Nakamura',
        role: UserRole.INSTRUCTOR,
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face'
      }
    }),

    // Students
    ...Array.from({ length: 10 }, (_, i) =>
      prisma.user.create({
        data: {
          email: `student${i + 1}@example.com`,
          username: `student_${i + 1}`,
          displayName: faker.person.fullName(),
          role: UserRole.STUDENT,
          avatar: `https://images.unsplash.com/photo-${faker.number.int({ min: 1500000000000, max: 1700000000000 })}?w=150&h=150&fit=crop&crop=face`
        }
      })
    )
  ]);

  console.log(`👥 Created ${users.length} users`);

  // 3. Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'AI & Machine Learning',
        description: 'Artificial Intelligence and Machine Learning courses',
        slug: 'ai-ml',
        color: '#3B82F6',
        icon: '🤖'
      }
    }),

    prisma.category.create({
      data: {
        name: 'Programming',
        description: 'Programming languages and software development',
        slug: 'programming',
        color: '#10B981',
        icon: '💻'
      }
    }),

    prisma.category.create({
      data: {
        name: 'Data Science',
        description: 'Data analysis, visualization and statistics',
        slug: 'data-science',
        color: '#8B5CF6',
        icon: '📊'
      }
    }),

    prisma.category.create({
      data: {
        name: 'Web Development',
        description: 'Frontend and backend web development',
        slug: 'web-development',
        color: '#F59E0B',
        icon: '🌐'
      }
    })
  ]);

  // Create subcategories
  const subcategories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Deep Learning',
        slug: 'deep-learning',
        parentId: categories[0].id,
        color: '#1E40AF',
        icon: '🧠'
      }
    }),

    prisma.category.create({
      data: {
        name: 'Natural Language Processing',
        slug: 'nlp',
        parentId: categories[0].id,
        color: '#3730A3',
        icon: '💬'
      }
    })
  ]);

  console.log(`📂 Created ${categories.length + subcategories.length} categories`);

  // 4. Create Courses
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        title: 'Introduction to AI and Machine Learning',
        description: 'A comprehensive introduction to artificial intelligence and machine learning concepts, covering the fundamentals you need to get started in this exciting field.',
        slug: 'intro-ai-ml',
        status: CourseStatus.PUBLISHED,
        level: CourseLevel.BEGINNER,
        language: 'en',
        estimatedTime: 480, // 8 hours
        price: 149.99,
        featured: true,
        thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=400&fit=crop',
        metaTitle: 'Learn AI & ML from Scratch | Miyabi Learning',
        metaDescription: 'Master the fundamentals of AI and ML with hands-on projects and real-world examples.',
        tags: ['AI', 'Machine Learning', 'Python', 'Beginner'],
        publishedAt: new Date(),
        creatorId: users[1].id, // Yuki instructor
      }
    }),

    prisma.course.create({
      data: {
        title: 'Advanced Neural Networks and Deep Learning',
        description: 'Deep dive into advanced neural network architectures, including CNNs, RNNs, Transformers, and cutting-edge techniques in deep learning.',
        slug: 'advanced-neural-networks',
        status: CourseStatus.PUBLISHED,
        level: CourseLevel.ADVANCED,
        language: 'en',
        estimatedTime: 960, // 16 hours
        price: 299.99,
        featured: true,
        thumbnail: 'https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=600&h=400&fit=crop',
        metaTitle: 'Advanced Neural Networks Course | Miyabi Learning',
        metaDescription: 'Master advanced deep learning techniques with state-of-the-art neural network architectures.',
        tags: ['Deep Learning', 'Neural Networks', 'Python', 'TensorFlow', 'PyTorch'],
        publishedAt: new Date(),
        creatorId: users[2].id, // Hiroshi instructor
      }
    }),

    prisma.course.create({
      data: {
        title: 'Full-Stack Web Development with React and Node.js',
        description: 'Build modern web applications from scratch using React, Node.js, Express, and MongoDB. Learn both frontend and backend development.',
        slug: 'fullstack-react-nodejs',
        status: CourseStatus.PUBLISHED,
        level: CourseLevel.INTERMEDIATE,
        language: 'en',
        estimatedTime: 720, // 12 hours
        price: 199.99,
        featured: false,
        thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
        metaTitle: 'Full-Stack React & Node.js Course | Miyabi Learning',
        metaDescription: 'Learn to build complete web applications with React, Node.js, and modern development practices.',
        tags: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'Web Development'],
        publishedAt: new Date(),
        creatorId: users[1].id,
      }
    }),

    prisma.course.create({
      data: {
        title: 'Data Science with Python and Pandas',
        description: 'Master data science fundamentals using Python, Pandas, NumPy, and Matplotlib. Learn to analyze and visualize data effectively.',
        slug: 'data-science-python-pandas',
        status: CourseStatus.UNDER_REVIEW,
        level: CourseLevel.BEGINNER,
        language: 'en',
        estimatedTime: 600, // 10 hours
        price: 179.99,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
        metaTitle: 'Data Science with Python Course | Miyabi Learning',
        metaDescription: 'Learn data science with Python, Pandas, and essential data analysis techniques.',
        tags: ['Python', 'Data Science', 'Pandas', 'NumPy', 'Visualization'],
        creatorId: users[2].id,
      }
    })
  ]);

  console.log(`📚 Created ${courses.length} courses`);

  // 5. Create Course Categories (associations)
  await Promise.all([
    // AI/ML course belongs to AI category and subcategory
    prisma.courseCategory.create({
      data: { courseId: courses[0].id, categoryId: categories[0].id }
    }),

    // Advanced Neural Networks course
    prisma.courseCategory.create({
      data: { courseId: courses[1].id, categoryId: categories[0].id }
    }),
    prisma.courseCategory.create({
      data: { courseId: courses[1].id, categoryId: subcategories[0].id }
    }),

    // Web Development course
    prisma.courseCategory.create({
      data: { courseId: courses[2].id, categoryId: categories[3].id }
    }),
    prisma.courseCategory.create({
      data: { courseId: courses[2].id, categoryId: categories[1].id }
    }),

    // Data Science course
    prisma.courseCategory.create({
      data: { courseId: courses[3].id, categoryId: categories[2].id }
    }),
    prisma.courseCategory.create({
      data: { courseId: courses[3].id, categoryId: categories[1].id }
    })
  ]);

  // 6. Create Course Instructors
  await Promise.all([
    prisma.courseInstructor.create({
      data: {
        courseId: courses[0].id,
        userId: users[1].id,
        role: InstructorRole.INSTRUCTOR,
        permissions: [InstructorPermission.CREATE_LESSON, InstructorPermission.EDIT_LESSON, InstructorPermission.GRADE_ASSESSMENT, InstructorPermission.VIEW_ANALYTICS]
      }
    }),

    prisma.courseInstructor.create({
      data: {
        courseId: courses[1].id,
        userId: users[2].id,
        role: InstructorRole.INSTRUCTOR,
        permissions: [InstructorPermission.CREATE_LESSON, InstructorPermission.EDIT_LESSON, InstructorPermission.GRADE_ASSESSMENT, InstructorPermission.VIEW_ANALYTICS, InstructorPermission.MANAGE_STUDENTS]
      }
    })
  ]);

  // 7. Create Lessons for each course
  const lessons = [];

  // Lessons for AI/ML course
  const aiMlLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        courseId: courses[0].id,
        title: 'What is Artificial Intelligence?',
        description: 'Introduction to the concept of artificial intelligence and its applications',
        content: '<h1>Introduction to AI</h1><p>Artificial Intelligence (AI) is the simulation of human intelligence in machines...</p>',
        type: LessonType.VIDEO,
        videoUrl: 'https://www.youtube.com/watch?v=example1',
        duration: 1800, // 30 minutes
        order: 1,
        isPreview: true,
        notes: 'Make sure to emphasize real-world applications'
      }
    }),

    prisma.lesson.create({
      data: {
        courseId: courses[0].id,
        title: 'Machine Learning Fundamentals',
        description: 'Understanding the basics of machine learning algorithms',
        content: '<h1>ML Fundamentals</h1><p>Machine learning is a subset of AI that enables computers to learn...</p>',
        type: LessonType.TEXT,
        duration: 2700, // 45 minutes
        order: 2,
        attachments: JSON.stringify([
          { name: 'ML_Cheatsheet.pdf', url: '/attachments/ml-cheat.pdf', type: 'pdf' },
          { name: 'Example_Code.py', url: '/attachments/example.py', type: 'code' }
        ])
      }
    }),

    prisma.lesson.create({
      data: {
        courseId: courses[0].id,
        title: 'Supervised vs Unsupervised Learning',
        description: 'Compare different types of machine learning approaches',
        content: '<h1>Types of Learning</h1><p>There are several types of machine learning...</p>',
        type: LessonType.INTERACTIVE,
        duration: 2100, // 35 minutes
        order: 3
      }
    }),

    prisma.lesson.create({
      data: {
        courseId: courses[0].id,
        title: 'Hands-on: Your First ML Model',
        description: 'Build your first machine learning model with Python',
        content: '<h1>Building Your First Model</h1><p>In this lesson, we will build a simple classification model...</p>',
        type: LessonType.ASSIGNMENT,
        duration: 3600, // 60 minutes
        order: 4
      }
    })
  ]);

  lessons.push(...aiMlLessons);

  // Lessons for Advanced Neural Networks course
  const advancedNNLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        courseId: courses[1].id,
        title: 'Advanced Neural Network Architectures',
        description: 'Deep dive into modern neural network designs',
        content: '<h1>Advanced Architectures</h1><p>We will explore state-of-the-art neural network architectures...</p>',
        type: LessonType.VIDEO,
        videoUrl: 'https://www.youtube.com/watch?v=example2',
        duration: 3600, // 60 minutes
        order: 1,
        isPreview: true
      }
    }),

    prisma.lesson.create({
      data: {
        courseId: courses[1].id,
        title: 'Convolutional Neural Networks (CNNs)',
        description: 'Understanding CNNs for computer vision tasks',
        content: '<h1>CNNs Explained</h1><p>Convolutional Neural Networks are specialized for processing grid-like data...</p>',
        type: LessonType.VIDEO,
        videoUrl: 'https://www.youtube.com/watch?v=example3',
        duration: 4500, // 75 minutes
        order: 2
      }
    }),

    prisma.lesson.create({
      data: {
        courseId: courses[1].id,
        title: 'Transformer Architecture',
        description: 'Learn about the revolutionary Transformer architecture',
        content: '<h1>Transformers</h1><p>The Transformer architecture has revolutionized natural language processing...</p>',
        type: LessonType.TEXT,
        duration: 5400, // 90 minutes
        order: 3
      }
    })
  ]);

  lessons.push(...advancedNNLessons);

  console.log(`📝 Created ${lessons.length} lessons`);

  // 8. Create Assessments
  const assessments = await Promise.all([
    prisma.assessment.create({
      data: {
        lessonId: aiMlLessons[0].id,
        title: 'AI Fundamentals Quiz',
        description: 'Test your understanding of AI basics',
        questions: JSON.stringify([
          {
            id: 1,
            type: 'multiple_choice',
            question: 'What does AI stand for?',
            options: ['Artificial Intelligence', 'Automated Information', 'Advanced Integration', 'None of the above'],
            correct_answer: 0,
            points: 10
          },
          {
            id: 2,
            type: 'multiple_choice',
            question: 'Which of the following is NOT a type of machine learning?',
            options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Quantum Learning'],
            correct_answer: 3,
            points: 10
          }
        ]),
        maxScore: 20,
        passingScore: 14,
        timeLimit: 15,
        type: AssessmentType.QUIZ
      }
    }),

    prisma.assessment.create({
      data: {
        lessonId: aiMlLessons[3].id,
        title: 'ML Model Building Assignment',
        description: 'Build and submit your first machine learning model',
        questions: JSON.stringify([
          {
            id: 1,
            type: 'code_submission',
            question: 'Submit your Python code for the classification model',
            requirements: 'Use scikit-learn library, achieve at least 80% accuracy',
            points: 50
          }
        ]),
        maxScore: 50,
        passingScore: 35,
        attempts: 3,
        type: AssessmentType.ASSIGNMENT
      }
    }),

    // Final exam for the course
    prisma.assessment.create({
      data: {
        courseId: courses[0].id,
        title: 'AI & ML Final Examination',
        description: 'Comprehensive final exam covering all course topics',
        questions: JSON.stringify([
          {
            id: 1,
            type: 'multiple_choice',
            question: 'What is the primary goal of supervised learning?',
            options: ['Find hidden patterns', 'Learn from labeled data', 'Maximize rewards', 'Reduce dimensions'],
            correct_answer: 1,
            points: 5
          },
          {
            id: 2,
            type: 'essay',
            question: 'Explain the difference between overfitting and underfitting in machine learning.',
            points: 15
          },
          {
            id: 3,
            type: 'multiple_choice',
            question: 'Which algorithm is best for clustering?',
            options: ['Linear Regression', 'K-Means', 'Decision Trees', 'SVM'],
            correct_answer: 1,
            points: 5
          }
        ]),
        maxScore: 25,
        passingScore: 18,
        timeLimit: 120, // 2 hours
        attempts: 2,
        type: AssessmentType.FINAL_EXAM
      }
    })
  ]);

  console.log(`📋 Created ${assessments.length} assessments`);

  // 9. Create Enrollments
  const students = users.slice(3); // Get student users
  const enrollments = [];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];

    // Enroll in AI/ML course (everyone)
    const enrollment1 = await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: courses[0].id,
        status: i < 5 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
        progress: i < 5 ? 100 : faker.number.int({ min: 20, max: 95 }),
        enrolledAt: faker.date.past({ years: 0.5 }),
        completedAt: i < 5 ? faker.date.recent({ days: 30 }) : null,
        amount: 149.99
      }
    });
    enrollments.push(enrollment1);

    // Enroll some students in other courses
    if (i < 6) {
      const enrollment2 = await prisma.enrollment.create({
        data: {
          userId: student.id,
          courseId: courses[2].id, // Web Development
          status: i < 3 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
          progress: i < 3 ? 100 : faker.number.int({ min: 30, max: 80 }),
          enrolledAt: faker.date.past({ years: 0.3 }),
          completedAt: i < 3 ? faker.date.recent({ days: 15 }) : null,
          amount: 199.99
        }
      });
      enrollments.push(enrollment2);
    }

    // Enroll advanced students in neural networks course
    if (i < 3) {
      const enrollment3 = await prisma.enrollment.create({
        data: {
          userId: student.id,
          courseId: courses[1].id, // Advanced Neural Networks
          status: EnrollmentStatus.ACTIVE,
          progress: faker.number.int({ min: 10, max: 60 }),
          enrolledAt: faker.date.recent({ days: 60 }),
          amount: 299.99
        }
      });
      enrollments.push(enrollment3);
    }
  }

  console.log(`🎓 Created ${enrollments.length} enrollments`);

  // 10. Create User Progress
  const progressRecords = [];
  for (const enrollment of enrollments) {
    const courseId = enrollment.courseId;
    const courseLessons = lessons.filter(l => l.courseId === courseId);

    const lessonsToComplete = Math.floor((enrollment.progress / 100) * courseLessons.length);

    for (let i = 0; i < lessonsToComplete; i++) {
      const lesson = courseLessons[i];
      await prisma.userProgress.create({
        data: {
          userId: enrollment.userId,
          courseId: courseId,
          lessonId: lesson.id,
          completedAt: faker.date.between({
            from: enrollment.enrolledAt,
            to: enrollment.completedAt || new Date()
          }),
          timeSpent: faker.number.int({ min: lesson.duration * 0.8, max: lesson.duration * 1.5 }),
          lastAccessedAt: faker.date.recent({ days: 7 }),
          bookmarked: faker.datatype.boolean({ probability: 0.2 }),
          notes: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.sentences(2) : null
        }
      });
      progressRecords.push(lesson.id);
    }
  }

  console.log(`📈 Created ${progressRecords.length} progress records`);

  // 11. Create User Answers for assessments
  let answerCount = 0;
  for (const enrollment of enrollments.slice(0, 8)) { // First 8 enrollments
    for (const assessment of assessments) {
      if (assessment.lessonId && lessons.find(l => l.id === assessment.lessonId)?.courseId === enrollment.courseId) {
        await prisma.userAnswer.create({
          data: {
            userId: enrollment.userId,
            assessmentId: assessment.id,
            answers: JSON.stringify([
              { questionId: 1, answer: faker.number.int({ min: 0, max: 3 }) },
              { questionId: 2, answer: faker.number.int({ min: 0, max: 3 }) }
            ]),
            score: faker.number.int({ min: 10, max: 20 }),
            passed: faker.datatype.boolean({ probability: 0.8 }),
            completedAt: faker.date.recent({ days: 30 }),
            attemptNumber: 1,
            feedback: 'Good work! Focus on improving your understanding of supervised learning concepts.'
          }
        });
        answerCount++;
      }
    }
  }

  console.log(`✅ Created ${answerCount} assessment answers`);

  // 12. Create Course Reviews
  const reviews = [];
  for (let i = 0; i < 15; i++) {
    const student = faker.helpers.arrayElement(students);
    const course = faker.helpers.arrayElement(courses.slice(0, 3)); // Only published courses

    try {
      const review = await prisma.courseReview.create({
        data: {
          userId: student.id,
          courseId: course.id,
          rating: faker.number.int({ min: 3, max: 5 }),
          title: faker.lorem.words(3),
          comment: faker.lorem.sentences(3),
          helpful: faker.number.int({ min: 0, max: 20 })
        }
      });
      reviews.push(review);
    } catch (error) {
      // Skip if already exists (unique constraint)
    }
  }

  console.log(`⭐ Created ${reviews.length} course reviews`);

  // 13. Create Certificates for completed enrollments
  const completedEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.COMPLETED);
  const certificates = [];

  for (const enrollment of completedEnrollments) {
    const course = courses.find(c => c.id === enrollment.courseId);
    const user = users.find(u => u.id === enrollment.userId);

    const certificate = await prisma.certificate.create({
      data: {
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        title: `Certificate of Completion`,
        description: `This certifies that ${user?.displayName} has successfully completed the course "${course?.title}"`,
        imageUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=800&h=600&fit=crop',
        verificationHash: `cert_${faker.string.alphanumeric(32)}`,
        issuedAt: enrollment.completedAt || new Date()
      }
    });
    certificates.push(certificate);
  }

  console.log(`🏆 Created ${certificates.length} certificates`);

  // 14. Create Learning Paths
  const learningPaths = await Promise.all([
    prisma.learningPath.create({
      data: {
        title: 'AI Mastery Path',
        description: 'Complete learning path from AI basics to advanced neural networks',
        thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop',
        level: CourseLevel.BEGINNER,
        estimatedTime: 1440, // 24 hours total
        featured: true
      }
    }),

    prisma.learningPath.create({
      data: {
        title: 'Full-Stack Developer Path',
        description: 'Become a complete web developer with modern technologies',
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
        level: CourseLevel.INTERMEDIATE,
        estimatedTime: 720, // 12 hours
        featured: false
      }
    })
  ]);

  // Create Learning Path Courses
  await Promise.all([
    // AI Mastery Path
    prisma.learningPathCourse.create({
      data: {
        learningPathId: learningPaths[0].id,
        courseId: courses[0].id, // Intro AI/ML
        order: 1,
        required: true
      }
    }),
    prisma.learningPathCourse.create({
      data: {
        learningPathId: learningPaths[0].id,
        courseId: courses[1].id, // Advanced Neural Networks
        order: 2,
        required: true
      }
    }),

    // Full-Stack Path
    prisma.learningPathCourse.create({
      data: {
        learningPathId: learningPaths[1].id,
        courseId: courses[2].id, // Full-Stack Web Dev
        order: 1,
        required: true
      }
    })
  ]);

  console.log(`🛣️ Created ${learningPaths.length} learning paths`);

  // 15. Create Prerequisites
  await prisma.coursePrerequisite.create({
    data: {
      courseId: courses[1].id, // Advanced Neural Networks
      prerequisiteCourseId: courses[0].id, // requires Intro AI/ML
      required: true
    }
  });

  console.log('📚 Created course prerequisites');

  // 16. Create Course Analytics
  for (const course of courses.slice(0, 3)) { // Only for published courses
    const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
    const completions = courseEnrollments.filter(e => e.status === EnrollmentStatus.COMPLETED);
    const courseReviews = reviews.filter(r => r.courseId === course.id);
    const avgRating = courseReviews.length > 0
      ? courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length
      : null;

    await prisma.courseAnalytics.create({
      data: {
        courseId: course.id,
        totalEnrollments: courseEnrollments.length,
        totalCompletions: completions.length,
        averageRating: avgRating,
        totalRevenue: courseEnrollments.reduce((sum, e) => sum + Number(e.amount || 0), 0),
        avgCompletionTime: course.estimatedTime ? course.estimatedTime * 0.8 : null,
        dropoffRate: courseEnrollments.length > 0
          ? ((courseEnrollments.length - completions.length) / courseEnrollments.length) * 100
          : null
      }
    });
  }

  console.log('📊 Created course analytics');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`• Users: ${users.length} (1 admin, 2 instructors, ${students.length} students)`);
  console.log(`• Categories: ${categories.length + subcategories.length} (with hierarchy)`);
  console.log(`• Courses: ${courses.length} (3 published, 1 under review)`);
  console.log(`• Lessons: ${lessons.length}`);
  console.log(`• Assessments: ${assessments.length}`);
  console.log(`• Enrollments: ${enrollments.length}`);
  console.log(`• Progress Records: ${progressRecords.length}`);
  console.log(`• Reviews: ${reviews.length}`);
  console.log(`• Certificates: ${certificates.length}`);
  console.log(`• Learning Paths: ${learningPaths.length}`);
  console.log(`• System Settings: ${systemSettings.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });