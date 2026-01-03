/**
 * Error Sanitization for Production Security
 * Prevents information disclosure through error messages
 */

interface ErrorResponse {
  error: string;
  code?: string;
  timestamp: string;
  requestId?: string;
}

interface DetailedError extends ErrorResponse {
  stack?: string;
  details?: any;
}

export class ErrorSanitizer {
  private static readonly isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Sanitize error for client response
   */
  static sanitizeError(
    error: Error,
    requestId?: string,
    errorCode?: string
  ): ErrorResponse | DetailedError {
    const baseResponse: ErrorResponse = {
      error: this.getPublicErrorMessage(error),
      timestamp: new Date().toISOString(),
      requestId
    };

    if (errorCode) {
      baseResponse.code = errorCode;
    }

    // In development, include additional details
    if (this.isDevelopment) {
      return {
        ...baseResponse,
        stack: error.stack,
        details: {
          name: error.name,
          cause: error.cause
        }
      };
    }

    return baseResponse;
  }

  /**
   * Log error securely (full details in logs, sanitized for client)
   */
  static logAndSanitize(
    error: Error,
    context: string,
    requestId?: string,
    errorCode?: string
  ): ErrorResponse | DetailedError {
    // Log full error details for debugging
    console.error(`[${context}] Error ${requestId || 'unknown'}:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      timestamp: new Date().toISOString()
    });

    // Return sanitized error for client
    return this.sanitizeError(error, requestId, errorCode);
  }

  /**
   * Get user-friendly error message
   */
  private static getPublicErrorMessage(error: Error): string {
    // Map common error types to user-friendly messages
    const errorMappings: Record<string, string> = {
      'ValidationError': 'Invalid input data provided',
      'AuthenticationError': 'Authentication failed',
      'AuthorizationError': 'Insufficient permissions',
      'NotFoundError': 'Requested resource not found',
      'ConflictError': 'Resource conflict detected',
      'RateLimitError': 'Too many requests. Please try again later',
      'DatabaseError': 'Database operation failed',
      'ExternalServiceError': 'External service unavailable',
      'FileUploadError': 'File upload failed',
      'AIServiceError': 'AI service temporarily unavailable'
    };

    // Check for known error types
    for (const [errorType, message] of Object.entries(errorMappings)) {
      if (error.name === errorType || error.message.includes(errorType)) {
        return message;
      }
    }

    // Check for specific error patterns
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return 'Service temporarily unavailable';
    }

    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again';
    }

    if (error.message.includes('Invalid JSON')) {
      return 'Invalid request format';
    }

    if (error.message.includes('JWT') || error.message.includes('token')) {
      return 'Authentication token invalid or expired';
    }

    // For unknown errors, provide generic message in production
    return this.isDevelopment ? error.message : 'An unexpected error occurred';
  }

  /**
   * Create standardized API error response
   */
  static createErrorResponse(
    error: Error,
    status: number = 500,
    context: string = 'API',
    requestId?: string
  ) {
    const sanitizedError = this.logAndSanitize(error, context, requestId);

    return Response.json(sanitizedError, {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId || crypto.randomUUID(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  }
}

/**
 * Error codes for common application errors
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_001',
  AUTHENTICATION_ERROR: 'AUTH_001',
  AUTHORIZATION_ERROR: 'AUTH_002',
  NOT_FOUND: 'NOTFOUND_001',
  RATE_LIMIT_EXCEEDED: 'RATE_001',
  DATABASE_ERROR: 'DB_001',
  AI_SERVICE_ERROR: 'AI_001',
  FILE_UPLOAD_ERROR: 'FILE_001',
  EXTERNAL_SERVICE_ERROR: 'EXT_001'
} as const;

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class AIServiceError extends Error {
  constructor(message: string = 'AI service error') {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class FileUploadError extends Error {
  constructor(message: string = 'File upload failed') {
    super(message);
    this.name = 'FileUploadError';
  }
}

/**
 * Middleware wrapper for API routes with error handling
 */
export function withErrorHandling(
  handler: (request: Request, context: any) => Promise<Response>,
  context: string = 'API'
) {
  return async (request: Request, routeContext: any) => {
    const requestId = crypto.randomUUID();

    try {
      return await handler(request, { ...routeContext, requestId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Determine appropriate status code
      let status = 500;
      if (err instanceof ValidationError) status = 400;
      else if (err instanceof AuthenticationError) status = 401;
      else if (err instanceof AuthorizationError) status = 403;
      else if (err instanceof NotFoundError) status = 404;
      else if (err instanceof RateLimitError) status = 429;

      return ErrorSanitizer.createErrorResponse(err, status, context, requestId);
    }
  };
}