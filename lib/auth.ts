/**
 * Authentication utilities for API endpoints
 * Issue #1298: AI Course API Authentication
 */

import type { NextRequest } from 'next/server';
import type { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  username?: string;
}

/**
 * Extract user from request using JWT authentication
 * Integrates with course-auth system for consistent authentication
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Import JWT authentication functions from course-auth
    const { extractJWTToken, validateJWTToken } = await import('./auth/course-auth');

    // Extract JWT token from Authorization header or cookie
    const token = extractJWTToken(request);
    if (!token) {
      return null;
    }

    // Validate JWT token and return user information
    const user = await validateJWTToken(token);
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser, requiredRole: UserRole | UserRole[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
}

/**
 * Check if user can manage course (creator or admin)
 */
export function canManageCourse(user: AuthenticatedUser, courseCreatorId: string): boolean {
  return user.id === courseCreatorId || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
}

/**
 * Check if user is instructor or admin
 */
export function isInstructorOrAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, ['ADMIN', 'SUPER_ADMIN']);
}
