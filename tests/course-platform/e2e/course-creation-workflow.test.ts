/**
 * End-to-End Tests for Course Creation Workflow
 * Tests the complete instructor workflow from course planning to publication
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  cleanDatabase,
  seedTestData,
  createTestUser,
  makeApiRequest,
  mockGeminiService,
  mockVideoService,
  mockCollaborationProvider,
  mockAnalyticsEngine
} from '../setup';

// Mock Next.js components
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  useParams: () => ({ courseId: 'test-course-123' }),
  useSearchParams: () => new URLSearchParams()
}));

describe('Course Creation Workflow E2E', () => {
  let instructor: any;
  let authToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    const testData = await seedTestData();
    instructor = testData.instructor;

    // Generate JWT token for authenticated requests
    authToken = jwt.sign(
      { userId: instructor.id, email: instructor.email, role: instructor.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe('AI-Powered Course Planning', () => {
    it('should complete full course planning workflow with AI assistance', async () => {
      // Step 1: Instructor navigates to course creation
      const { response, data } = await makeApiRequest('/api/courses', {
        method: 'GET',
        token: authToken
      });

      expect(response.status).toBe(200);

      // Step 2: Use AI to generate course suggestions
      mockGeminiService.generateCourseSuggestions.mockResolvedValue([
        {
          title: 'Modern React Development',
          description: 'Learn React 18 with hooks, context, and modern patterns',
          outline: [
            'React Fundamentals',
            'Hooks and State Management',
            'Context API',
            'Performance Optimization',
            'Testing React Applications'
          ],
          estimatedDuration: 180,
          difficulty: 'intermediate',
          prerequisites: ['JavaScript ES6+', 'HTML/CSS']
        },
        {
          title: 'Advanced React Patterns',
          description: 'Master advanced React patterns and architecture',
          outline: [
            'Compound Components',
            'Render Props',
            'Higher-Order Components',
            'Custom Hooks',
            'Performance Patterns'
          ],
          estimatedDuration: 120,
          difficulty: 'advanced',
          prerequisites: ['React Basics', 'JavaScript Advanced']
        }
      ]);

      const { response: aiResponse, data: aiData } = await makeApiRequest('/api/ai/course-suggestions', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          topic: 'React Development',
          targetAudience: 'Web Developers'
        })
      });

      expect(aiResponse.status).toBe(200);
      expect(aiData.success).toBe(true);
      expect(aiData.suggestions).toHaveLength(2);
      expect(aiData.suggestions[0].title).toBe('Modern React Development');

      // Step 3: Select and customize a course suggestion
      const selectedCourse = aiData.suggestions[0];

      const courseData = {
        title: selectedCourse.title,
        description: selectedCourse.description,
        difficulty: selectedCourse.difficulty,
        estimatedDuration: selectedCourse.estimatedDuration,
        category: 'programming',
        tags: ['react', 'javascript', 'frontend'],
        price: 99.99,
        currency: 'USD'
      };

      // Step 4: Create the course
      const { response: createResponse, data: createData } = await makeApiRequest('/api/courses', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify(courseData)
      });

      expect(createResponse.status).toBe(201);
      expect(createData.course.title).toBe('Modern React Development');
      expect(createData.course.instructorId).toBe(instructor.id);

      const courseId = createData.course.id;

      // Step 5: Generate lesson content with AI
      for (let i = 0; i < selectedCourse.outline.length; i++) {
        const lessonTitle = selectedCourse.outline[i];

        mockGeminiService.generateLessonContent.mockResolvedValue({
          title: `Lesson ${i + 1}: ${lessonTitle}`,
          content: `Comprehensive content about ${lessonTitle} with examples and practical exercises.`,
          objectives: [
            `Understand ${lessonTitle} concepts`,
            `Apply ${lessonTitle} in real projects`,
            `Solve common ${lessonTitle} challenges`
          ],
          activities: [
            'Code-along exercises',
            'Practice challenges',
            'Build a mini-project'
          ],
          assessmentQuestions: [
            `What is the main purpose of ${lessonTitle}?`,
            `How would you implement ${lessonTitle} in a project?`
          ]
        });

        const { response: lessonResponse, data: lessonData } = await makeApiRequest('/api/ai/lesson-content', {
          method: 'POST',
          token: authToken,
          body: JSON.stringify({
            courseTitle: selectedCourse.title,
            lessonTitle: lessonTitle,
            difficulty: selectedCourse.difficulty,
            estimatedDuration: 30
          })
        });

        expect(lessonResponse.status).toBe(200);
        expect(lessonData.success).toBe(true);
        expect(lessonData.content.title).toBe(`Lesson ${i + 1}: ${lessonTitle}`);

        // Create lesson with AI-generated content
        const lessonCreateData = {
          courseId,
          title: lessonData.content.title,
          content: lessonData.content.content,
          objectives: lessonData.content.objectives,
          activities: lessonData.content.activities,
          estimatedDuration: 30,
          orderIndex: i + 1
        };

        const { response: lessonCreateResponse } = await makeApiRequest('/api/lessons', {
          method: 'POST',
          token: authToken,
          body: JSON.stringify(lessonCreateData)
        });

        expect(lessonCreateResponse.status).toBe(201);
      }

      // Verify all lessons were created
      const { response: lessonsResponse, data: lessonsData } = await makeApiRequest(`/api/courses/${courseId}/lessons`, {
        method: 'GET',
        token: authToken
      });

      expect(lessonsResponse.status).toBe(200);
      expect(lessonsData.lessons).toHaveLength(5);
    });

    it('should analyze and improve course content with AI feedback', async () => {
      // Create a course with initial content
      const { data: courseData } = await makeApiRequest('/api/courses', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          title: 'JavaScript Basics',
          description: 'Learn JavaScript fundamentals',
          difficulty: 'beginner'
        })
      });

      const courseId = courseData.course.id;

      // Create a lesson with basic content
      const { data: lessonData } = await makeApiRequest('/api/lessons', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          courseId,
          title: 'Variables and Functions',
          content: 'Variables store data. Functions execute code.',
          estimatedDuration: 20
        })
      });

      const lessonId = lessonData.lesson.id;

      // Use AI to analyze content quality
      mockGeminiService.analyzeContent.mockResolvedValue({
        readabilityScore: 65,
        difficulty: 'too_simple',
        suggestedImprovements: [
          'Add more detailed explanations and examples',
          'Include code snippets and demonstrations',
          'Provide practical exercises',
          'Add visual aids or diagrams'
        ],
        missingTopics: [
          'Variable types and declarations',
          'Function parameters and return values',
          'Scope and closure concepts',
          'Common JavaScript patterns'
        ],
        engagementTips: [
          'Add interactive coding exercises',
          'Include real-world examples',
          'Create step-by-step tutorials'
        ]
      });

      const { response, data } = await makeApiRequest('/api/ai/analyze-content', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          content: lessonData.lesson.content,
          targetLevel: 'beginner'
        })
      });

      expect(response.status).toBe(200);
      expect(data.analysis.readabilityScore).toBe(65);
      expect(data.analysis.suggestedImprovements).toHaveLength(4);
      expect(data.analysis.missingTopics).toHaveLength(4);

      // Instructor implements AI suggestions by improving the lesson content
      const improvedContent = `
# Variables and Functions in JavaScript

## Variables
Variables are containers that store data values. In JavaScript, you can declare variables using \`let\`, \`const\`, or \`var\`.

### Examples:
\`\`\`javascript
let name = "John";
const age = 25;
var isStudent = true;
\`\`\`

## Functions
Functions are blocks of code designed to perform particular tasks. They can accept parameters and return values.

### Examples:
\`\`\`javascript
function greet(name) {
  return "Hello, " + name + "!";
}

const result = greet("Alice");
console.log(result); // "Hello, Alice!"
\`\`\`

## Practice Exercise
Create a function that calculates the area of a rectangle given width and height parameters.
      `.trim();

      const { response: updateResponse } = await makeApiRequest(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        token: authToken,
        body: JSON.stringify({
          content: improvedContent
        })
      });

      expect(updateResponse.status).toBe(200);
    });
  });

  describe('Video Content Integration', () => {
    it('should upload and process video content with AI features', async () => {
      // Create course and lesson
      const { data: courseData } = await makeApiRequest('/api/courses', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          title: 'Video Course',
          description: 'A course with video content'
        })
      });

      const { data: lessonData } = await makeApiRequest('/api/lessons', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          courseId: courseData.course.id,
          title: 'Introduction Video',
          content: 'Watch this introduction video'
        })
      });

      // Mock video service responses
      mockVideoService.uploadVideo.mockResolvedValue({
        id: 'video_123',
        lessonId: lessonData.lesson.id,
        title: 'Introduction Video',
        description: 'Course introduction',
        url: 'https://example.com/video_123.mp4',
        thumbnailUrl: 'https://example.com/thumb_123.jpg',
        duration: 300,
        fileSize: 50000000,
        format: 'mp4',
        quality: ['720p', '1080p'],
        status: 'processing',
        uploadedAt: new Date(),
        metadata: {
          width: 1920,
          height: 1080,
          bitrate: 2500,
          fps: 30,
          codec: 'h264',
          originalFilename: 'intro.mp4',
          uploadedBy: instructor.id
        },
        chapters: [],
        analytics: {
          totalViews: 0,
          uniqueViews: 0,
          averageWatchTime: 0,
          completionRate: 0,
          engagementPoints: [],
          popularSegments: []
        }
      });

      // Simulate video upload
      const videoFile = new File(['video content'], 'intro.mp4', {
        type: 'video/mp4'
      });

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('lessonId', lessonData.lesson.id);
      formData.append('title', 'Introduction Video');
      formData.append('description', 'Course introduction');

      const { response: uploadResponse, data: uploadData } = await makeApiRequest('/api/videos/upload', {
        method: 'POST',
        token: authToken,
        body: formData
      });

      expect(uploadResponse.status).toBe(201);
      expect(uploadData.video.status).toBe('processing');

      // Mock AI-powered video processing completion
      mockVideoService.generateTranscription.mockResolvedValue({
        id: 'trans_video_123',
        videoId: 'video_123',
        language: 'en',
        content: [
          {
            startTime: 0,
            endTime: 5,
            text: 'Welcome to this comprehensive course on modern web development.',
            confidence: 0.95,
            speaker: 'instructor'
          },
          {
            startTime: 5,
            endTime: 12,
            text: 'In this course, you will learn the latest technologies and best practices.',
            confidence: 0.92,
            speaker: 'instructor'
          }
        ],
        accuracy: 0.94,
        generatedAt: new Date()
      });

      mockVideoService.generateChapters.mockResolvedValue([
        {
          id: 'chapter_1_video_123',
          videoId: 'video_123',
          title: 'Course Introduction',
          startTime: 0,
          endTime: 60,
          description: 'Welcome and course overview'
        },
        {
          id: 'chapter_2_video_123',
          videoId: 'video_123',
          title: 'Learning Objectives',
          startTime: 60,
          endTime: 180,
          description: 'What you will learn in this course'
        }
      ]);

      // Simulate processing completion
      const { response: processResponse } = await makeApiRequest('/api/videos/video_123/process', {
        method: 'POST',
        token: authToken
      });

      expect(processResponse.status).toBe(200);

      // Get processed video with transcription and chapters
      const { response: videoResponse, data: videoData } = await makeApiRequest('/api/videos/video_123', {
        method: 'GET',
        token: authToken
      });

      expect(videoResponse.status).toBe(200);
      expect(videoData.video.status).toBe('ready');
      expect(videoData.video.transcription).toBeDefined();
      expect(videoData.video.chapters).toHaveLength(2);
    });
  });

  describe('Assessment Creation and Management', () => {
    it('should create AI-generated assessments and track results', async () => {
      // Create course and lesson
      const { data: courseData } = await makeApiRequest('/api/courses', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          title: 'JavaScript Assessment Course',
          description: 'Course with comprehensive assessments'
        })
      });

      const { data: lessonData } = await makeApiRequest('/api/lessons', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          courseId: courseData.course.id,
          title: 'JavaScript Functions',
          content: 'Learn about JavaScript functions, parameters, return values, and scope.'
        })
      });

      // Generate AI assessment
      mockGeminiService.generateAssessment.mockResolvedValue({
        questions: [
          {
            type: 'multiple_choice',
            question: 'What keyword is used to declare a function in JavaScript?',
            options: ['func', 'function', 'def', 'method'],
            correctAnswer: 1,
            explanation: 'The "function" keyword is used to declare functions in JavaScript.',
            difficulty: 'easy'
          },
          {
            type: 'short_answer',
            question: 'How do you call a function named "calculateArea" with parameters width=5 and height=3?',
            correctAnswer: 'calculateArea(5, 3)',
            explanation: 'Functions are called by writing the function name followed by parentheses with arguments.',
            difficulty: 'medium'
          },
          {
            type: 'true_false',
            question: 'JavaScript functions can return values.',
            correctAnswer: true,
            explanation: 'Functions can return values using the return statement.',
            difficulty: 'easy'
          }
        ]
      });

      const { response: assessmentResponse, data: assessmentData } = await makeApiRequest('/api/ai/generate-assessment', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          content: lessonData.lesson.content,
          questionCount: 3,
          questionTypes: ['multiple_choice', 'short_answer', 'true_false']
        })
      });

      expect(assessmentResponse.status).toBe(200);
      expect(assessmentData.assessment.questions).toHaveLength(3);

      // Create assessment from AI-generated questions
      const assessmentCreateData = {
        lessonId: lessonData.lesson.id,
        title: 'JavaScript Functions Quiz',
        description: 'Test your understanding of JavaScript functions',
        questions: assessmentData.assessment.questions,
        timeLimit: 600,
        passingScore: 70,
        maxAttempts: 3
      };

      const { response: createResponse, data: createData } = await makeApiRequest('/api/assessments', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify(assessmentCreateData)
      });

      expect(createResponse.status).toBe(201);
      expect(createData.assessment.questions).toHaveLength(3);

      // Verify assessment was created correctly
      const assessmentId = createData.assessment.id;
      const { response: getResponse, data: getData } = await makeApiRequest(`/api/assessments/${assessmentId}`, {
        method: 'GET',
        token: authToken
      });

      expect(getResponse.status).toBe(200);
      expect(getData.assessment.title).toBe('JavaScript Functions Quiz');
      expect(getData.assessment.questions[0].type).toBe('multiple_choice');
    });
  });

  describe('Real-time Collaboration', () => {
    it('should enable real-time collaborative editing between instructors', async () => {
      // Create course and lesson
      const { data: courseData } = await makeApiRequest('/api/courses', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          title: 'Collaborative Course',
          description: 'A course created with collaboration'
        })
      });

      const { data: lessonData } = await makeApiRequest('/api/lessons', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          courseId: courseData.course.id,
          title: 'Collaborative Lesson',
          content: 'Initial lesson content'
        })
      });

      // Mock collaboration service
      mockCollaborationProvider.joinRoom.mockResolvedValue({
        roomId: `lesson-${lessonData.lesson.id}`,
        type: 'lesson',
        isConnected: true,
        participants: [
          {
            id: instructor.id,
            name: instructor.name,
            email: instructor.email,
            avatar: instructor.avatar,
            role: instructor.role,
            isConnected: true,
            cursor: { position: 0, selection: null },
            lastSeen: new Date()
          }
        ]
      });

      // Start collaboration session
      const { response: joinResponse } = await makeApiRequest('/api/collaboration/join', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          roomId: `lesson-${lessonData.lesson.id}`,
          roomType: 'lesson'
        })
      });

      expect(joinResponse.status).toBe(200);

      // Simulate collaborative editing
      const editOperations = [
        {
          type: 'insert',
          position: 0,
          content: 'Welcome to our collaborative lesson! ',
          userId: instructor.id
        },
        {
          type: 'insert',
          position: 100,
          content: '\n\nThis section was added collaboratively.',
          userId: instructor.id
        }
      ];

      for (const operation of editOperations) {
        const { response } = await makeApiRequest('/api/collaboration/edit', {
          method: 'POST',
          token: authToken,
          body: JSON.stringify({
            roomId: `lesson-${lessonData.lesson.id}`,
            operation
          })
        });

        expect(response.status).toBe(200);
      }

      // Verify content was updated
      const { response: contentResponse, data: contentData } = await makeApiRequest(`/api/lessons/${lessonData.lesson.id}`, {
        method: 'GET',
        token: authToken
      });

      expect(contentResponse.status).toBe(200);
      expect(contentData.lesson.content).toContain('Welcome to our collaborative lesson!');
    });
  });

  describe('Course Publication and Analytics', () => {
    it('should publish course and track comprehensive analytics', async () => {
      // Create complete course with lessons and assessments
      const { data: courseData } = await makeApiRequest('/api/courses', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          title: 'Complete JavaScript Course',
          description: 'Comprehensive JavaScript course with analytics',
          difficulty: 'intermediate',
          estimatedDuration: 240,
          price: 149.99
        })
      });

      const courseId = courseData.course.id;

      // Add lessons
      const lessons = [
        { title: 'Introduction to JavaScript', content: 'JavaScript basics' },
        { title: 'Variables and Data Types', content: 'Learn about variables' },
        { title: 'Functions and Scope', content: 'Understanding functions' }
      ];

      for (let i = 0; i < lessons.length; i++) {
        await makeApiRequest('/api/lessons', {
          method: 'POST',
          token: authToken,
          body: JSON.stringify({
            courseId,
            ...lessons[i],
            orderIndex: i + 1,
            estimatedDuration: 45
          })
        });
      }

      // Publish the course
      const { response: publishResponse } = await makeApiRequest(`/api/courses/${courseId}/publish`, {
        method: 'POST',
        token: authToken
      });

      expect(publishResponse.status).toBe(200);

      // Mock analytics data
      mockAnalyticsEngine.getCourseAnalytics.mockResolvedValue({
        courseId,
        title: 'Complete JavaScript Course',
        totalEnrollments: 150,
        completionRate: 0.78,
        averageScore: 0.84,
        averageCompletionTime: 180,
        dropoffPoints: [
          { lessonId: 'lesson_2', dropoffRate: 0.15 },
          { lessonId: 'lesson_3', dropoffRate: 0.22 }
        ],
        engagementMetrics: {
          averageTimeSpent: 165,
          lessonCompletionRates: [0.95, 0.85, 0.78],
          mostReviewedLessons: ['lesson_2', 'lesson_3']
        },
        learningOutcomes: {
          skillsAcquired: ['JavaScript Basics', 'Function Programming', 'DOM Manipulation'],
          knowledgeRetention: 0.82,
          practicalApplication: 0.75
        }
      });

      // Get course analytics
      const { response: analyticsResponse, data: analyticsData } = await makeApiRequest(`/api/analytics/courses/${courseId}`, {
        method: 'GET',
        token: authToken
      });

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsData.analytics.totalEnrollments).toBe(150);
      expect(analyticsData.analytics.completionRate).toBe(0.78);
      expect(analyticsData.analytics.averageScore).toBe(0.84);

      // Check dropoff points for course improvement
      expect(analyticsData.analytics.dropoffPoints).toHaveLength(2);
      expect(analyticsData.analytics.dropoffPoints[0].dropoffRate).toBe(0.15);
    });
  });

  describe('Student Learning Journey', () => {
    it('should track complete student learning journey with adaptive features', async () => {
      // Create a student
      const student = createTestUser({ role: 'student' });
      const studentToken = jwt.sign(
        { userId: student.id, email: student.email, role: student.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Create published course
      const { data: courseData } = await makeApiRequest('/api/courses', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          title: 'Student Journey Course',
          description: 'Track student learning progression',
          isPublished: true
        })
      });

      const courseId = courseData.course.id;

      // Student enrolls in course
      const { response: enrollResponse } = await makeApiRequest('/api/enrollments', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ courseId })
      });

      expect(enrollResponse.status).toBe(201);

      // Mock adaptive learning engine
      const mockAdaptiveEngine = {
        getLearnerProfile: vi.fn().mockResolvedValue({
          userId: student.id,
          learningStyle: 'visual',
          preferredDifficulty: 'intermediate',
          knowledgeMap: {
            'javascript-basics': 0.6,
            'functions': 0.4,
            'objects': 0.2
          },
          performanceMetrics: {
            averageScore: 0.75,
            completionRate: 0.80,
            retentionRate: 0.70,
            engagementLevel: 0.85
          },
          goals: [
            { topic: 'JavaScript Mastery', targetScore: 0.9, deadline: new Date('2024-06-01') }
          ]
        }),
        generateRecommendations: vi.fn().mockResolvedValue({
          courses: [
            {
              courseId: 'advanced-js',
              title: 'Advanced JavaScript Patterns',
              relevanceScore: 0.85,
              difficulty: 'advanced',
              estimatedTime: 120,
              reasoning: 'Based on your JavaScript knowledge gaps'
            }
          ],
          nextLessons: [
            {
              lessonId: 'functions-deep-dive',
              title: 'Functions Deep Dive',
              priority: 'high',
              estimatedTime: 45
            }
          ],
          reviewTopics: ['javascript-basics', 'scope-concepts'],
          studyPath: {
            phases: [
              {
                title: 'Foundation Strengthening',
                duration: 20,
                topics: ['javascript-basics', 'variables'],
                difficulty: 'beginner'
              }
            ],
            estimatedCompletion: new Date('2024-05-15'),
            milestones: [
              { title: 'JavaScript Fundamentals Complete', targetDate: new Date('2024-04-01') }
            ]
          },
          studyTips: [
            'Focus on practical coding exercises',
            'Review basic concepts before advancing',
            'Practice daily for better retention'
          ]
        })
      };

      // Get personalized learning recommendations
      const { response: recommendResponse, data: recommendData } = await makeApiRequest('/api/learning/recommendations', {
        method: 'GET',
        token: studentToken
      });

      expect(recommendResponse.status).toBe(200);
      expect(recommendData.recommendations.courses).toBeDefined();
      expect(recommendData.recommendations.nextLessons).toBeDefined();

      // Track learning progress
      const { response: progressResponse } = await makeApiRequest('/api/progress', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: 'lesson_1',
          timeSpent: 1800, // 30 minutes
          completed: true,
          score: 0.85
        })
      });

      expect(progressResponse.status).toBe(201);

      // Get updated learning analytics
      const { response: analyticsResponse, data: analyticsData } = await makeApiRequest('/api/analytics/user/engagement', {
        method: 'GET',
        token: studentToken
      });

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsData.engagement.studyStreak).toBeGreaterThan(0);
      expect(analyticsData.engagement.learningVelocity).toBeGreaterThan(0);
    });
  });
});