/**
 * Test validation schemas for new course management endpoints
 * Issue #1298: Course Management REST API Implementation
 */

import {
  ReviewQuerySchema,
  CreateReviewSchema,
  UpdateReviewSchema,
  CategoryQuerySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  AddInstructorSchema,
  UpdateInstructorSchema,
  PublishCourseSchema
} from '@/lib/validation-schemas';

describe('New Course Management Validation Schemas', () => {
  describe('Review Schemas', () => {
    it('should validate review query parameters', () => {
      const validQuery = {
        page: 1,
        limit: 10,
        rating: 5,
        verified: true
      };

      const result = ReviewQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should validate review creation', () => {
      const validReview = {
        rating: 5,
        title: 'Great Course!',
        comment: 'This course helped me learn a lot.',
        isAnonymous: false
      };

      const result = CreateReviewSchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it('should reject invalid rating', () => {
      const invalidReview = {
        rating: 6, // Invalid: > 5
        title: 'Test',
        comment: 'Test comment'
      };

      const result = CreateReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });
  });

  describe('Category Schemas', () => {
    it('should validate category creation', () => {
      const validCategory = {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Learn web development',
        color: '#FF5733',
        icon: 'web',
        order: 1,
        isActive: true
      };

      const result = CreateCategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
    });

    it('should reject invalid slug format', () => {
      const invalidCategory = {
        name: 'Web Development',
        slug: 'Web Development!', // Invalid: contains spaces and special chars
        description: 'Learn web development'
      };

      const result = CreateCategorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });

    it('should reject invalid color format', () => {
      const invalidCategory = {
        name: 'Web Development',
        slug: 'web-development',
        color: 'red' // Invalid: not hex format
      };

      const result = CreateCategorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });
  });

  describe('Instructor Schemas', () => {
    it('should validate instructor addition', () => {
      const validInstructor = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'ASSISTANT' as const,
        permissions: ['MANAGE_CONTENT', 'VIEW_ANALYTICS'] as const
      };

      const result = AddInstructorSchema.safeParse(validInstructor);
      expect(result.success).toBe(true);
    });

    it('should reject invalid permissions', () => {
      const invalidInstructor = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'ASSISTANT' as const,
        permissions: ['INVALID_PERMISSION'] // Invalid permission
      };

      const result = AddInstructorSchema.safeParse(invalidInstructor);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const invalidInstructor = {
        userId: 'not-a-uuid',
        role: 'ASSISTANT' as const
      };

      const result = AddInstructorSchema.safeParse(invalidInstructor);
      expect(result.success).toBe(false);
    });
  });

  describe('Publishing Schemas', () => {
    it('should validate publish action', () => {
      const validPublish = {
        action: 'PUBLISH' as const,
        reason: 'Course is ready for publication'
      };

      const result = PublishCourseSchema.safeParse(validPublish);
      expect(result.success).toBe(true);
    });

    it('should validate unpublish action', () => {
      const validUnpublish = {
        action: 'UNPUBLISH' as const,
        reason: 'Need to update course content'
      };

      const result = PublishCourseSchema.safeParse(validUnpublish);
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const invalidPublish = {
        action: 'INVALID_ACTION' // Invalid action
      };

      const result = PublishCourseSchema.safeParse(invalidPublish);
      expect(result.success).toBe(false);
    });
  });
});