/**
 * API Error handling utilities
 * Issue #1298: AI Course API Error Handling
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

export interface APIError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
}

export class APIException extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'APIException';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Standard API error responses
 */
export const APIErrors = {
  UNAUTHORIZED: new APIException('Unauthorized', 401),
  FORBIDDEN: new APIException('Forbidden', 403),
  NOT_FOUND: new APIException('Resource not found', 404),
  VALIDATION_ERROR: new APIException('Validation failed', 400),
  INTERNAL_ERROR: new APIException('Internal server error', 500),
  COURSE_NOT_FOUND: new APIException('Course not found', 404),
  LESSON_NOT_FOUND: new APIException('Lesson not found', 404),
  ENROLLMENT_NOT_FOUND: new APIException('Enrollment not found', 404),
  ASSESSMENT_NOT_FOUND: new APIException('Assessment not found', 404),
  ALREADY_ENROLLED: new APIException('User already enrolled in this course', 409),
  INSUFFICIENT_PERMISSIONS: new APIException('Insufficient permissions for this action', 403),
} as const;

/**
 * Create error response
 */
export function createErrorResponse(error: APIException | Error, statusCode?: number): NextResponse {
  const isAPIException = error instanceof APIException;
  const code = statusCode || (isAPIException ? error.statusCode : 500);

  const errorData: APIError = {
    error: error.name || 'Error',
    message: error.message,
    statusCode: code,
    details: isAPIException ? error.details : undefined,
    timestamp: new Date().toISOString(),
  };

  console.error('[API Error]', {
    ...errorData,
    stack: error.stack,
  });

  return NextResponse.json(errorData, { status: code });
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: z.ZodError): NextResponse {
  const details = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  const apiError = new APIException('Validation failed', 400, { validationErrors: details });
  return createErrorResponse(apiError);
}

/**
 * Handle Prisma errors
 */
export function handlePrismaError(error: any): NextResponse {
  console.error('[Prisma Error]', error);

  // Handle specific Prisma error codes
  switch (error.code) {
    case 'P2002':
      return createErrorResponse(new APIException('Resource already exists', 409, { constraint: error.meta?.target }));
    case 'P2025':
      return createErrorResponse(new APIException('Resource not found', 404));
    case 'P2003':
      return createErrorResponse(new APIException('Foreign key constraint failed', 400));
    default:
      return createErrorResponse(new APIException('Database error', 500));
  }
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>,
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof APIException) {
        return createErrorResponse(error);
      }
      if (error instanceof z.ZodError) {
        return handleValidationError(error);
      }
      if (error && typeof error === 'object' && 'code' in error) {
        return handlePrismaError(error);
      }
      console.error('[Unhandled API Error]', error);
      return createErrorResponse(APIErrors.INTERNAL_ERROR);
    }
  };
}
