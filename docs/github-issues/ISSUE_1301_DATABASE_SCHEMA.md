# Issue #1301: Database Schema Design and Implementation for AI Course Functionality

**Priority**: P0 - Critical
**Phase**: Foundation (Phase 1)
**Agent Assignment**: DataArchitect Agent + CodeGen Agent
**Estimated Time**: 16 hours
**Milestone**: AI Course Phase 1: Foundation

---

## 🎯 Description

Design and implement the complete database schema for the AI Course functionality, including all tables, relationships, indexes, and constraints. This is the foundational data layer that will support all course management, student progress tracking, and assessment features.

## 🏷️ Labels

- `✨feature` - New functionality
- `🏗️infrastructure` - Core infrastructure component
- `⭐Sev.2-High` - High severity/priority
- `📊影響度-High` - High impact on system
- `👥担当-テックリード` - Requires tech lead oversight
- `🤖CodeGenAgent` - Assigned to CodeGen Agent
- `🎓course` - AI Course functionality
- `🔥Phase-1` - Phase 1 implementation

## ✅ Acceptance Criteria

### Database Tables
- [ ] **Courses table** with comprehensive metadata fields
  - UUID primary key, title, description, instructor_id
  - Difficulty enum, estimated duration, publish status
  - Created/updated timestamps, soft delete support

- [ ] **Course modules table** with hierarchical structure
  - UUID primary key, course foreign key
  - Title, description, order index for sequencing
  - Created timestamp

- [ ] **Lessons table** with rich content support
  - UUID primary key, module foreign key
  - Title, JSONB content field for flexible storage
  - Duration estimate, order index, publish status
  - Created/updated timestamps

- [ ] **Student progress table** for learning analytics
  - UUID primary key, student_id + lesson_id composite unique
  - Started/completed timestamps, time spent tracking
  - Score field, attempt counter
  - Performance metrics storage

- [ ] **Assessments table** for quiz and test management
  - UUID primary key, lesson foreign key
  - Title, JSONB questions field
  - Passing score, max attempts, time limit
  - Created timestamp

- [ ] **Assessment attempts table** for detailed tracking
  - UUID primary key, assessment + student foreign keys
  - JSONB answers field, calculated score
  - Started/completed timestamps, attempt number
  - Session metadata

### Database Relationships
- [ ] **Proper foreign key constraints** with cascade rules
- [ ] **Composite unique indexes** for performance optimization
- [ ] **Audit triggers** for change tracking
- [ ] **Data validation constraints** at database level

### Prisma ORM Integration
- [ ] **Complete Prisma schema** with proper typing
- [ ] **Migration scripts** for development and production
- [ ] **Seeding scripts** with realistic test data
- [ ] **Type-safe database client** configuration

### Performance Optimization
- [ ] **Strategic indexes** for query optimization
  - Course listing and filtering
  - Student progress queries
  - Assessment performance lookups
- [ ] **Database connection pooling** configuration
- [ ] **Query performance benchmarks** established

### Documentation
- [ ] **Schema diagram** with relationships visualization
- [ ] **Data dictionary** with field descriptions
- [ ] **Migration guide** for deployment
- [ ] **Performance benchmark results** documented

## 🛠️ Technical Specifications

### Database Schema SQL

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE assessment_type AS ENUM ('quiz', 'exam', 'project', 'assignment');

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID NOT NULL, -- References users table
    difficulty difficulty_level NOT NULL DEFAULT 'beginner',
    estimated_duration INTEGER, -- in minutes
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    max_students INTEGER,
    prerequisites JSONB DEFAULT '[]',
    learning_objectives JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Course modules table
CREATE TABLE course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT false,
    estimated_duration INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

-- Lessons table
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}', -- Rich content structure
    duration INTEGER, -- in minutes
    order_index INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT false,
    is_free BOOLEAN DEFAULT false, -- Allow free preview
    learning_objectives JSONB DEFAULT '[]',
    resources JSONB DEFAULT '[]', -- Additional resources
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(module_id, order_index)
);

-- User enrollments
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL, -- References users table
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(course_id, student_id)
);

-- Student progress tracking
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- in seconds
    score DECIMAL(5,2),
    attempts INTEGER DEFAULT 1,
    notes TEXT,
    bookmarks JSONB DEFAULT '[]',
    last_position JSONB, -- Resume position in content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- Assessments
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type assessment_type NOT NULL DEFAULT 'quiz',
    questions JSONB NOT NULL DEFAULT '[]',
    passing_score DECIMAL(5,2) DEFAULT 70.0,
    max_attempts INTEGER DEFAULT 3,
    time_limit INTEGER, -- in minutes
    is_randomized BOOLEAN DEFAULT false,
    show_correct_answers BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment attempts
CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}',
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_taken INTEGER, -- in seconds
    attempt_number INTEGER NOT NULL,
    is_submitted BOOLEAN DEFAULT false,
    feedback JSONB DEFAULT '{}',
    UNIQUE(assessment_id, student_id, attempt_number)
);

-- User notes and annotations
CREATE TABLE user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position_data JSONB, -- Position in content
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion forums
CREATE TABLE course_discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_id UUID REFERENCES course_discussions(id), -- For threading
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_question BOOLEAN DEFAULT false,
    is_answered BOOLEAN DEFAULT false,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_courses_instructor ON courses(instructor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_published ON courses(is_published) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_difficulty ON courses(difficulty) WHERE deleted_at IS NULL;
CREATE INDEX idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_lesson ON student_progress(lesson_id);
CREATE INDEX idx_assessments_lesson ON assessments(lesson_id);
CREATE INDEX idx_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX idx_attempts_student ON assessment_attempts(student_id);
CREATE INDEX idx_discussions_course ON course_discussions(course_id);
CREATE INDEX idx_discussions_parent ON course_discussions(parent_id);

-- Full-text search indexes
CREATE INDEX idx_courses_search ON courses USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));
CREATE INDEX idx_lessons_search ON lessons USING gin(to_tsvector('english', title));
```

### Prisma Schema

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum DifficultyLevel {
  beginner
  intermediate
  advanced
}

enum AssessmentType {
  quiz
  exam
  project
  assignment
}

model Course {
  id                  String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  title               String    @db.VarChar(255)
  description         String?
  instructorId        String    @map("instructor_id") @db.Uuid
  difficulty          DifficultyLevel @default(beginner)
  estimatedDuration   Int?      @map("estimated_duration")
  isPublished         Boolean   @default(false) @map("is_published")
  isFeatured          Boolean   @default(false) @map("is_featured")
  maxStudents         Int?      @map("max_students")
  prerequisites       Json      @default("[]")
  learningObjectives  Json      @default("[]") @map("learning_objectives")
  tags                Json      @default("[]")
  thumbnailUrl        String?   @map("thumbnail_url")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  deletedAt           DateTime? @map("deleted_at")

  // Relations
  modules       CourseModule[]
  enrollments   CourseEnrollment[]
  discussions   CourseDiscussion[]

  @@map("courses")
}

model CourseModule {
  id                String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  courseId          String   @map("course_id") @db.Uuid
  title             String   @db.VarChar(255)
  description       String?
  orderIndex        Int      @map("order_index")
  isPublished       Boolean  @default(false) @map("is_published")
  estimatedDuration Int?     @map("estimated_duration")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relations
  course  Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons Lesson[]

  @@unique([courseId, orderIndex])
  @@map("course_modules")
}

model Lesson {
  id                 String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  moduleId           String   @map("module_id") @db.Uuid
  title              String   @db.VarChar(255)
  content            Json     @default("{}")
  duration           Int?
  orderIndex         Int      @map("order_index")
  isPublished        Boolean  @default(false) @map("is_published")
  isFree             Boolean  @default(false) @map("is_free")
  learningObjectives Json     @default("[]") @map("learning_objectives")
  resources          Json     @default("[]")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  // Relations
  module      CourseModule      @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress    StudentProgress[]
  assessments Assessment[]
  notes       UserNote[]

  @@unique([moduleId, orderIndex])
  @@map("lessons")
}

model CourseEnrollment {
  id                 String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  courseId           String    @map("course_id") @db.Uuid
  studentId          String    @map("student_id") @db.Uuid
  enrolledAt         DateTime  @default(now()) @map("enrolled_at")
  completedAt        DateTime? @map("completed_at")
  progressPercentage Decimal   @default(0.0) @map("progress_percentage") @db.Decimal(5, 2)
  isActive           Boolean   @default(true) @map("is_active")

  // Relations
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([courseId, studentId])
  @@map("course_enrollments")
}

model StudentProgress {
  id           String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  studentId    String    @map("student_id") @db.Uuid
  lessonId     String    @map("lesson_id") @db.Uuid
  startedAt    DateTime? @map("started_at")
  completedAt  DateTime? @map("completed_at")
  timeSpent    Int       @default(0) @map("time_spent")
  score        Decimal?  @db.Decimal(5, 2)
  attempts     Int       @default(1)
  notes        String?
  bookmarks    Json      @default("[]")
  lastPosition Json?     @map("last_position")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([studentId, lessonId])
  @@map("student_progress")
}

model Assessment {
  id                 String         @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  lessonId           String         @map("lesson_id") @db.Uuid
  title              String         @db.VarChar(255)
  description        String?
  assessmentType     AssessmentType @default(quiz) @map("assessment_type")
  questions          Json           @default("[]")
  passingScore       Decimal        @default(70.0) @map("passing_score") @db.Decimal(5, 2)
  maxAttempts        Int            @default(3) @map("max_attempts")
  timeLimit          Int?           @map("time_limit")
  isRandomized       Boolean        @default(false) @map("is_randomized")
  showCorrectAnswers Boolean        @default(true) @map("show_correct_answers")
  createdAt          DateTime       @default(now()) @map("created_at")
  updatedAt          DateTime       @updatedAt @map("updated_at")

  // Relations
  lesson   Lesson              @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  attempts AssessmentAttempt[]

  @@map("assessments")
}

model AssessmentAttempt {
  id            String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  assessmentId  String    @map("assessment_id") @db.Uuid
  studentId     String    @map("student_id") @db.Uuid
  answers       Json      @default("{}")
  score         Decimal?  @db.Decimal(5, 2)
  maxScore      Decimal?  @map("max_score") @db.Decimal(5, 2)
  startedAt     DateTime  @default(now()) @map("started_at")
  completedAt   DateTime? @map("completed_at")
  timeTaken     Int?      @map("time_taken")
  attemptNumber Int       @map("attempt_number")
  isSubmitted   Boolean   @default(false) @map("is_submitted")
  feedback      Json      @default("{}")

  // Relations
  assessment Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  @@unique([assessmentId, studentId, attemptNumber])
  @@map("assessment_attempts")
}

model UserNote {
  id           String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId       String    @map("user_id") @db.Uuid
  lessonId     String    @map("lesson_id") @db.Uuid
  content      String
  positionData Json?     @map("position_data")
  isPublic     Boolean   @default(false) @map("is_public")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@map("user_notes")
}

model CourseDiscussion {
  id         String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  courseId   String    @map("course_id") @db.Uuid
  userId     String    @map("user_id") @db.Uuid
  parentId   String?   @map("parent_id") @db.Uuid
  title      String?   @db.VarChar(255)
  content    String
  isQuestion Boolean   @default(false) @map("is_question")
  isAnswered Boolean   @default(false) @map("is_answered")
  voteCount  Int       @default(0) @map("vote_count")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  // Relations
  course   Course             @relation(fields: [courseId], references: [id], onDelete: Cascade)
  parent   CourseDiscussion?  @relation("DiscussionThread", fields: [parentId], references: [id])
  replies  CourseDiscussion[] @relation("DiscussionThread")

  @@map("course_discussions")
}
```

## 📋 Dependencies

- **None** - This is the foundational infrastructure component

## 🚫 Blockers

- **None identified** - Standard database setup required

## 🧪 Testing Requirements

### Unit Tests
- [ ] Prisma schema validation tests
- [ ] Migration script tests
- [ ] Database constraint validation tests
- [ ] Performance benchmark tests

### Integration Tests
- [ ] Database connection and pooling tests
- [ ] Foreign key constraint tests
- [ ] Full-text search functionality tests
- [ ] Data seeding and cleanup tests

### Performance Tests
- [ ] Query performance under load
- [ ] Index effectiveness validation
- [ ] Connection pooling efficiency
- [ ] Concurrent access testing

## 📚 Documentation Requirements

- [ ] **Entity Relationship Diagram** (ERD)
- [ ] **Data Dictionary** with field descriptions
- [ ] **Query Performance Guide** with optimization tips
- [ ] **Migration Guide** for development and production
- [ ] **Backup and Recovery Procedures**

## 🔍 Definition of Done

1. **Schema Implementation Complete**
   - All tables created with proper constraints
   - All indexes implemented and tested
   - Foreign key relationships validated

2. **Prisma Integration Working**
   - Schema file updated and validated
   - Client generation successful
   - Type safety confirmed

3. **Performance Validated**
   - Query benchmarks meet targets (<100ms for 95% of queries)
   - Index effectiveness confirmed
   - Connection pooling optimized

4. **Testing Complete**
   - All unit tests passing
   - Integration tests successful
   - Performance tests meet benchmarks

5. **Documentation Ready**
   - ERD created and reviewed
   - Migration guide complete
   - Performance guide documented

6. **Code Review Approved**
   - Schema reviewed by database architect
   - Security review completed
   - Performance review approved

---

**Agent Coordination Notes:**
- DataArchitect Agent: Schema design and optimization
- CodeGen Agent: Prisma integration and migration scripts
- Database Agent: Performance tuning and index optimization
- Security Agent: Review of constraints and access patterns

**Next Issue Dependencies:**
- Issue #1302 (API Endpoints) depends on this schema
- Issue #1305 (CRUD Operations) depends on this schema
- All subsequent course functionality depends on this foundation