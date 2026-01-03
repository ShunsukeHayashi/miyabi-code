/**
 * Authentication utilities for API endpoints
 * Issue #1298: AI Course API Authentication
 */

import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  username?: string;
}

/**
 * Extract user from request (placeholder implementation)
 * In production, this would validate JWT tokens, session cookies, etc.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  // TODO: Implement actual authentication logic
  // For now, return mock user from headers for testing
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userRole = request.headers.get('x-user-role') as UserRole;

  if (!userId || !userEmail || !userRole) {
    return null;
  }

  return {
    id: userId,
    email: userEmail,
    role: userRole,
    username: request.headers.get('x-username') || undefined,
  };
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