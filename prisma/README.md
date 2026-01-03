# Miyabi AI Course Database Schema

This document describes the comprehensive database schema for AI Course functionality in the Miyabi Dashboard, implemented using Prisma ORM with PostgreSQL.

## Schema Overview

The database is designed to support a full-featured online learning platform with the following key entities:

### Core Entities

- **Users** - Students, instructors, and administrators
- **Courses** - Learning content with metadata, pricing, and status
- **Lessons** - Individual learning units within courses
- **Categories** - Hierarchical course organization
- **Assessments** - Quizzes, assignments, and exams
- **Enrollments** - Student-course relationships with progress tracking

### Advanced Features

- **Learning Paths** - Structured course sequences
- **Prerequisites** - Course dependency management
- **Certificates** - Automated certificate generation
- **Analytics** - Course performance metrics
- **Reviews** - Student feedback and ratings
- **User Progress** - Detailed learning analytics

## Database Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Environment variables configured

### Environment Configuration

Create a `.env` file in your project root:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/miyabi_courses?schema=public"

# Optional: for development
POSTGRES_USER=miyabi_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=miyabi_courses
```

### Installation & Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Generate Prisma Client:**
```bash
npm run db:generate
```

3. **Push schema to database:**
```bash
npm run db:push
```

4. **Seed database with sample data:**
```bash
npm run db:seed
```

5. **Open Prisma Studio (optional):**
```bash
npm run db:studio
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and apply migration |
| `npm run db:migrate:deploy` | Deploy migrations (production) |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database and re-seed |

## Schema Details

### User Management

```typescript
enum UserRole {
  STUDENT       // Regular learners
  INSTRUCTOR    // Course creators and teachers
  ADMIN         // Platform administrators
  SUPER_ADMIN   // Full system access
}
```

### Course Structure

```typescript
enum CourseStatus {
  DRAFT         // Work in progress
  UNDER_REVIEW  // Awaiting approval
  PUBLISHED     // Live and available
  ARCHIVED      // No longer active
}

enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}
```

### Lesson Types

```typescript
enum LessonType {
  TEXT          // Written content
  VIDEO         // Video lessons
  AUDIO         // Audio content
  INTERACTIVE   // Interactive exercises
  QUIZ          // Embedded assessments
  ASSIGNMENT    // Homework/projects
}
```

### Assessment System

```typescript
enum AssessmentType {
  QUIZ          // Multiple choice questions
  ASSIGNMENT    // Project submissions
  PROJECT       // Portfolio pieces
  FINAL_EXAM    // Course completion tests
}
```

## Key Features & Relationships

### 1. Course Organization
- **Categories**: Hierarchical structure with parent-child relationships
- **Tags**: Flexible tagging system for improved discoverability
- **Prerequisites**: Define course dependencies and learning sequences

### 2. Progress Tracking
- **User Progress**: Lesson-level completion tracking
- **Enrollments**: Course-level progress and status
- **Time Tracking**: Study time analytics
- **Bookmarks**: Student-defined lesson bookmarks

### 3. Assessment & Certification
- **Flexible Assessment Types**: Support for various question formats
- **Attempt Tracking**: Multiple attempts with scoring history
- **Automated Certificates**: Generated upon course completion
- **Verification System**: Unique hashes for certificate authenticity

### 4. Instructor Features
- **Role-based Permissions**: Fine-grained access control
- **Multiple Instructors**: Team teaching support
- **Content Management**: Lesson creation and modification
- **Student Analytics**: Progress monitoring and reporting

### 5. Learning Paths
- **Structured Learning**: Curated course sequences
- **Flexible Requirements**: Optional vs required courses
- **Progress Tracking**: Path-level completion monitoring

## Sample Data

The seed file creates:
- 1 Super Admin + 2 Instructors + 10 Students
- 4 Categories (with subcategories)
- 4 Courses (3 published, 1 under review)
- 7 Lessons across courses
- 3 Assessments with various types
- 17 Enrollments with realistic progress
- Course reviews, certificates, and analytics
- 2 Learning paths with course sequences

## Performance Optimizations

### Indexes
All critical queries are optimized with indexes:
- User email and role lookups
- Course status and featured filtering
- Category and slug searches
- Progress tracking queries
- Assessment and enrollment associations

### Query Optimization
- Foreign key indexes on all relationships
- Composite indexes for common query patterns
- Unique constraints to prevent duplicates

## Usage Examples

### Basic Course Query
```typescript
const course = await prisma.course.findUnique({
  where: { slug: 'intro-ai-ml' },
  include: {
    lessons: {
      orderBy: { order: 'asc' }
    },
    categories: {
      include: { category: true }
    },
    creator: true,
    enrollments: {
      where: { userId: currentUserId }
    }
  }
});
```

### User Progress Tracking
```typescript
const progress = await prisma.userProgress.findMany({
  where: {
    userId: currentUserId,
    courseId: courseId
  },
  include: {
    lesson: true
  },
  orderBy: {
    lesson: { order: 'asc' }
  }
});
```

### Course Analytics
```typescript
const analytics = await prisma.courseAnalytics.findUnique({
  where: { courseId: courseId },
  include: {
    course: {
      include: {
        reviews: true,
        enrollments: true
      }
    }
  }
});
```

## Security Considerations

1. **Input Validation**: All user inputs should be validated before database operations
2. **Authorization**: Implement proper role-based access control
3. **Data Encryption**: Sensitive data should be encrypted at rest
4. **Audit Logging**: Track all modifications for security auditing

## Migration Strategy

For existing systems:
1. Export existing data in compatible format
2. Run schema migration
3. Import data using custom scripts
4. Validate data integrity
5. Update application code to use new schema

## Monitoring & Maintenance

- Monitor query performance with Prisma metrics
- Regular database maintenance (VACUUM, ANALYZE)
- Backup strategy for course content and user data
- Monitor storage growth for media assets

## Contributing

When modifying the schema:
1. Create migration file: `npx prisma migrate dev --name descriptive-name`
2. Update seed data if necessary
3. Update documentation
4. Test with sample data