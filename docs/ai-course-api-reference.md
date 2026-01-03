# AI Course API Reference

**Version**: 1.0.0
**Issue**: #1298
**Base URL**: `/api`

## Overview

Comprehensive REST API for AI Course functionality built on Next.js App Router with TypeScript, Zod validation, and Prisma ORM.

## Features

- ✅ **Input Validation** - Zod schemas for all request bodies and query parameters
- ✅ **Error Handling** - Consistent error responses with proper HTTP status codes
- ✅ **Authentication** - Middleware integration with role-based authorization
- ✅ **Role-Based Access** - Student/Instructor/Admin permissions
- ✅ **Database Integration** - Prisma ORM with PostgreSQL
- ✅ **Pagination** - Standardized pagination for list endpoints
- ✅ **Search & Filtering** - Query parameters for advanced filtering
- ✅ **CORS Support** - Cross-origin resource sharing headers

## Authentication

All API endpoints (except public course listing) require authentication headers:

```http
X-User-ID: string (required)
X-User-Email: string (required)
X-User-Role: STUDENT|INSTRUCTOR|ADMIN|SUPER_ADMIN (required)
X-Username: string (optional)
```

## Error Response Format

```json
{
  "error": "APIException",
  "message": "Detailed error message",
  "statusCode": 400,
  "details": {},
  "timestamp": "2025-01-03T15:30:00.000Z"
}
```

## Success Response Format

```json
{
  "success": true,
  "data": {},
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "timestamp": "2025-01-03T15:30:00.000Z"
}
```

---

## Course Management APIs

### List Courses

```http
GET /api/courses
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `sortBy` (string): Sort field
- `sortOrder` (enum): `asc` | `desc` (default: `desc`)
- `q` (string): Search query (title/description)
- `category` (string): Category slug
- `level` (enum): `BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `EXPERT`
- `status` (enum): `DRAFT` | `UNDER_REVIEW` | `PUBLISHED` | `ARCHIVED`
- `featured` (boolean): Featured courses only
- `creatorId` (string): Filter by creator

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "course-123",
      "title": "AI Fundamentals",
      "description": "Learn the basics of AI",
      "thumbnail": "https://example.com/thumb.jpg",
      "status": "PUBLISHED",
      "level": "BEGINNER",
      "estimatedTime": 600,
      "price": 99.99,
      "featured": true,
      "slug": "ai-fundamentals",
      "tags": ["ai", "programming"],
      "creator": {
        "id": "user-456",
        "username": "instructor1",
        "displayName": "John Doe"
      },
      "categories": [
        {
          "id": "cat-789",
          "name": "Artificial Intelligence",
          "slug": "ai"
        }
      ],
      "stats": {
        "lessonsCount": 10,
        "enrollmentsCount": 150,
        "reviewsCount": 25
      }
    }
  ]
}
```

### Get Course Details

```http
GET /api/courses/{id}
```

**Path Parameters:**
- `id` (string): Course ID

**Response includes:** Full course details, preview lessons, instructors, prerequisites, statistics

### Create Course

```http
POST /api/courses
```

**Required Roles:** `INSTRUCTOR`, `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```json
{
  "title": "AI Fundamentals",
  "description": "Comprehensive AI course",
  "slug": "ai-fundamentals",
  "level": "BEGINNER",
  "language": "en",
  "estimatedTime": 600,
  "price": 99.99,
  "featured": false,
  "metaTitle": "Learn AI Basics",
  "metaDescription": "Master AI fundamentals",
  "tags": ["ai", "ml"],
  "categories": ["cat-id-1", "cat-id-2"]
}
```

### Update Course

```http
PUT /api/courses/{id}
```

**Required Permissions:** Course creator or admin

**Request Body:** Same as create (all fields optional)

### Delete Course

```http
DELETE /api/courses/{id}
```

**Required Roles:** `ADMIN`, `SUPER_ADMIN`

**Constraints:** Cannot delete courses with enrollments

---

## Lesson Management APIs

### Get Course Lessons

```http
GET /api/courses/{id}/lessons
```

**Path Parameters:**
- `id` (string): Course ID

**Response:** Array of lessons ordered by sequence

### Create Lesson

```http
POST /api/courses/{id}/lessons
```

**Required Permissions:** Course creator or admin

**Request Body:**
```json
{
  "title": "Introduction to Neural Networks",
  "description": "Learn NN basics",
  "content": "Neural networks are...",
  "videoUrl": "https://example.com/video.mp4",
  "duration": 1800,
  "order": 1,
  "type": "VIDEO",
  "isPreview": true,
  "attachments": [
    {
      "name": "slides.pdf",
      "url": "https://example.com/slides.pdf",
      "type": "application/pdf",
      "size": 1024000
    }
  ],
  "notes": "Instructor notes"
}
```

### Get Lesson Details

```http
GET /api/lessons/{id}
```

**Path Parameters:**
- `id` (string): Lesson ID

### Update Lesson

```http
PUT /api/lessons/{id}
```

**Required Permissions:** Course creator or admin

### Delete Lesson

```http
DELETE /api/lessons/{id}
```

**Required Permissions:** Course creator or admin

**Constraints:** Cannot delete lessons with user progress

---

## Enrollment & Progress APIs

### Enroll in Course

```http
POST /api/courses/{id}/enroll
```

**Required Authentication:** Any user

**Request Body:**
```json
{
  "paymentId": "payment-123",
  "paymentStatus": "COMPLETED",
  "amount": 99.99
}
```

**Prerequisites:** Course must be published, user not already enrolled, prerequisites met

### Get User Enrollments

```http
GET /api/users/{id}/enrollments
```

**Query Parameters:**
- `page`, `limit`, `sortBy`, `sortOrder` (pagination)
- `status` (enum): `ACTIVE` | `COMPLETED` | `SUSPENDED` | `CANCELLED`
- `courseId` (string): Filter by course

**Required Permissions:** User's own enrollments or admin

### Update Progress

```http
PUT /api/enrollments/{id}/progress
```

**Request Body:**
```json
{
  "lessonId": "lesson-123",
  "completedAt": "2025-01-03T15:30:00.000Z",
  "timeSpent": 1800,
  "bookmarked": false,
  "notes": "Personal notes"
}
```

**Features:**
- Automatic course completion detection
- Certificate generation on completion
- Progress percentage calculation

### Get Detailed Progress

```http
GET /api/enrollments/{id}/progress
```

**Response:** Comprehensive progress data including per-lesson completion status

---

## Assessment APIs

### Get Lesson Assessments

```http
GET /api/lessons/{id}/assessments
```

**Response:** Array of assessments (questions hidden from students)

### Create Assessment

```http
POST /api/lessons/{id}/assessments
```

**Required Permissions:** Course creator or admin

**Request Body:**
```json
{
  "title": "Neural Networks Quiz",
  "description": "Test your knowledge",
  "type": "QUIZ",
  "maxScore": 10,
  "passingScore": 7,
  "timeLimit": 30,
  "attempts": 3,
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "What is a neural network?",
      "options": ["Option A", "Option B", "Option C"],
      "correctAnswer": 1,
      "points": 5,
      "explanation": "Detailed explanation"
    }
  ]
}
```

**Question Types:**
- `multiple_choice`: Single correct answer from options
- `true_false`: Boolean answer
- `short_answer`: Text answer with exact matching
- `essay`: Manual grading required

### Submit Assessment

```http
POST /api/assessments/{id}/submit
```

**Required:** Active enrollment in course

**Request Body:**
```json
{
  "answers": {
    "q1": 1,
    "q2": true,
    "q3": "neural network"
  },
  "timeSpent": 900
}
```

**Features:**
- Automatic grading for objective questions
- Attempt tracking and limits
- Immediate feedback and scoring
- Progress tracking integration

### Get Assessment Results

```http
GET /api/assessments/{id}/results?userId={userId}
```

**Query Parameters:**
- `userId` (string): Specific user results (instructors only)

**Response includes:**
- All attempts with scores and feedback
- Best/latest attempt summary
- Class statistics (instructors only)
- Detailed answer analysis (after completion/final attempt)

---

## Analytics APIs

### Course Analytics

```http
GET /api/courses/{id}/analytics
```

**Required Permissions:** Course creator or admin

**Query Parameters:**
- `startDate` (datetime): Analytics period start
- `endDate` (datetime): Analytics period end
- `groupBy` (enum): `day` | `week` | `month`

**Response includes:**
```json
{
  "overview": {
    "totalEnrollments": 150,
    "completionRate": 75.5,
    "averageRating": 4.3,
    "totalRevenue": 14985.00
  },
  "engagement": {
    "averageTimeSpent": 7200,
    "averageSessionTime": 1800
  },
  "lessons": {
    "performance": [
      {
        "lesson": {"id": "lesson-1", "title": "Introduction"},
        "completionRate": 95.2,
        "totalViews": 143,
        "completions": 136
      }
    ]
  }
}
```

---

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Missing/invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | ALREADY_ENROLLED | User already enrolled |
| 409 | CONFLICT | Resource already exists |
| 500 | INTERNAL_ERROR | Server error |

## Rate Limits

- **Default**: 100 requests/minute per user
- **Assessment Submission**: 10 requests/minute per assessment
- **Analytics**: 20 requests/minute per course

## Database Schema

The API is built on the comprehensive database schema defined in `prisma/schema.prisma` with the following key entities:

- **Users**: Authentication and roles
- **Courses**: Course content and metadata
- **Lessons**: Individual course content units
- **Assessments**: Quizzes and evaluations
- **Enrollments**: User-course relationships
- **Progress**: Learning progress tracking
- **Certificates**: Completion certificates
- **Analytics**: Performance metrics

## Testing

Run the test suite to verify API functionality:

```bash
node scripts/test-ai-course-api.js
```

This tests all endpoints with various scenarios including success cases, error conditions, and permission checks.

## Next Steps

1. Implement advanced search with Elasticsearch
2. Add real-time notifications via WebSockets
3. Implement content recommendation engine
4. Add video streaming and progress tracking
5. Integrate with payment processors
6. Add content moderation and approval workflows
7. Implement advanced analytics and reporting
8. Add mobile app API extensions