/**
 * AI Course API Test Script
 * Issue #1298: Test all REST API endpoints
 *
 * Usage: node scripts/test-ai-course-api.js
 */

const BASE_URL = 'http://localhost:3000/api';

// Mock user headers for testing
const HEADERS = {
  'Content-Type': 'application/json',
  'X-User-ID': 'test-user-123',
  'X-User-Email': 'test@example.com',
  'X-User-Role': 'INSTRUCTOR',
  'X-Username': 'testuser'
};

const STUDENT_HEADERS = {
  'Content-Type': 'application/json',
  'X-User-ID': 'student-456',
  'X-User-Email': 'student@example.com',
  'X-User-Role': 'STUDENT',
  'X-Username': 'student'
};

/**
 * Test helper function
 */
async function apiTest(method, endpoint, body = null, headers = HEADERS) {
  const url = `${BASE_URL}${endpoint}`;

  console.log(`\n🧪 Testing ${method} ${endpoint}`);

  try {
    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${response.status} - Success`);
      console.log('Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log(`❌ ${response.status} - Error`);
      console.log('Error:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`💥 Network Error:`, error.message);
    return null;
  }
}

/**
 * Test data
 */
const testCourse = {
  title: 'AI Fundamentals Test Course',
  description: 'A comprehensive course covering AI fundamentals for testing purposes',
  slug: 'ai-fundamentals-test',
  level: 'BEGINNER',
  estimatedTime: 600, // 10 hours
  price: 99.99,
  tags: ['ai', 'machine-learning', 'programming'],
  metaTitle: 'Learn AI Fundamentals',
  metaDescription: 'Master the basics of artificial intelligence'
};

const testLesson = {
  title: 'Introduction to Neural Networks',
  description: 'Learn the basics of neural networks',
  content: 'Neural networks are computing systems inspired by biological neural networks...',
  type: 'TEXT',
  order: 1,
  duration: 1800, // 30 minutes
  isPreview: true
};

const testAssessment = {
  title: 'Neural Networks Quiz',
  description: 'Test your understanding of neural networks',
  type: 'QUIZ',
  maxScore: 10,
  passingScore: 7,
  timeLimit: 30,
  attempts: 3,
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice',
      question: 'What is a neural network?',
      options: [
        'A type of computer network',
        'A computing system inspired by biological neural networks',
        'A social network for neurons',
        'A type of internet protocol'
      ],
      correctAnswer: 1,
      points: 5,
      explanation: 'Neural networks are computing systems inspired by biological neural networks.'
    },
    {
      id: 'q2',
      type: 'true_false',
      question: 'Neural networks can only solve linear problems.',
      correctAnswer: false,
      points: 5,
      explanation: 'Neural networks are particularly useful for solving non-linear problems.'
    }
  ]
};

/**
 * Main test suite
 */
async function runTests() {
  console.log('🚀 Starting AI Course API Tests...\n');

  let courseId, lessonId, assessmentId, enrollmentId;

  // 1. Test Course Management APIs
  console.log('\n📚 Testing Course Management APIs...');

  // Create course
  const courseResult = await apiTest('POST', '/courses', testCourse);
  if (courseResult) {
    courseId = courseResult.data.id;
  }

  // List courses
  await apiTest('GET', '/courses?limit=5');

  // Get specific course
  if (courseId) {
    await apiTest('GET', `/courses/${courseId}`);
  }

  // Update course
  if (courseId) {
    await apiTest('PUT', `/courses/${courseId}`, {
      description: 'Updated description for testing'
    });
  }

  // 2. Test Lesson Management APIs
  console.log('\n📝 Testing Lesson Management APIs...');

  if (courseId) {
    // Create lesson
    const lessonResult = await apiTest('POST', `/courses/${courseId}/lessons`, testLesson);
    if (lessonResult) {
      lessonId = lessonResult.data.id;
    }

    // Get course lessons
    await apiTest('GET', `/courses/${courseId}/lessons`);

    // Get specific lesson
    if (lessonId) {
      await apiTest('GET', `/lessons/${lessonId}`);
    }

    // Update lesson
    if (lessonId) {
      await apiTest('PUT', `/lessons/${lessonId}`, {
        description: 'Updated lesson description'
      });
    }
  }

  // 3. Test Assessment APIs
  console.log('\n🧪 Testing Assessment APIs...');

  if (lessonId) {
    // Create assessment
    const assessmentResult = await apiTest('POST', `/lessons/${lessonId}/assessments`, testAssessment);
    if (assessmentResult) {
      assessmentId = assessmentResult.data.id;
    }

    // Get lesson assessments
    await apiTest('GET', `/lessons/${lessonId}/assessments`);

    // Get specific assessment
    if (assessmentId) {
      await apiTest('GET', `/assessments/${assessmentId}`);
    }
  }

  // 4. Test Enrollment & Progress APIs
  console.log('\n🎓 Testing Enrollment & Progress APIs...');

  if (courseId) {
    // Enroll in course (as student)
    const enrollResult = await apiTest('POST', `/courses/${courseId}/enroll`, {}, STUDENT_HEADERS);
    if (enrollResult) {
      enrollmentId = enrollResult.data.enrollment.id;
    }

    // Get user enrollments
    await apiTest('GET', `/users/${STUDENT_HEADERS['X-User-ID']}/enrollments`, null, STUDENT_HEADERS);

    // Update progress
    if (enrollmentId) {
      await apiTest('PUT', `/enrollments/${enrollmentId}/progress`, {
        lessonId: lessonId,
        completedAt: new Date().toISOString(),
        timeSpent: 1800,
        bookmarked: false
      }, STUDENT_HEADERS);

      // Get detailed progress
      await apiTest('GET', `/enrollments/${enrollmentId}/progress`, null, STUDENT_HEADERS);
    }
  }

  // 5. Test Assessment Submission
  console.log('\n📋 Testing Assessment Submission...');

  if (assessmentId) {
    // Submit assessment (as student)
    await apiTest('POST', `/assessments/${assessmentId}/submit`, {
      answers: {
        'q1': 1,
        'q2': true
      },
      timeSpent: 900
    }, STUDENT_HEADERS);

    // Get assessment results
    await apiTest('GET', `/assessments/${assessmentId}/results`, null, STUDENT_HEADERS);
  }

  // 6. Test Analytics
  console.log('\n📊 Testing Analytics APIs...');

  if (courseId) {
    // Get course analytics (as instructor)
    await apiTest('GET', `/courses/${courseId}/analytics`);
  }

  // 7. Test Error Cases
  console.log('\n❌ Testing Error Cases...');

  // Test unauthorized access
  await apiTest('GET', '/courses', null, {
    'Content-Type': 'application/json'
    // No auth headers
  });

  // Test not found
  await apiTest('GET', '/courses/non-existent-id');

  // Test validation errors
  await apiTest('POST', '/courses', {
    title: '', // Invalid empty title
    description: 'Test',
    slug: 'invalid-slug'
  });

  console.log('\n🎉 Test suite completed!');
  console.log('\nNote: Some tests may fail if the database is not properly set up or seeded.');
  console.log('Make sure to run `npm run db:push` and set up test data if needed.');
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, apiTest };