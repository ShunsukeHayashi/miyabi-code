/**
 * Role-based Access Control and Permission System
 * Issue #1300: Role definitions and permission matrices for AI Course functionality
 */

import type { UserRole } from '@prisma/client';

export type CoursePermission =
  // Course-level permissions
  | 'course:view' | 'course:edit' | 'course:delete' | 'course:publish'
  | 'course:manage_students' | 'course:view_analytics' | 'course:preview'

  // Lesson-level permissions
  | 'lesson:view' | 'lesson:edit' | 'lesson:delete' | 'lesson:create'
  | 'lesson:reorder' | 'lesson:publish'

  // Assessment permissions
  | 'assessment:view' | 'assessment:edit' | 'assessment:create' | 'assessment:delete'
  | 'assessment:take' | 'assessment:grade' | 'assessment:view_results'

  // Progress and tracking
  | 'progress:view' | 'progress:edit' | 'progress:reset'
  | 'certificate:view' | 'certificate:generate'

  // Enrollment management
  | 'enrollment:view' | 'enrollment:create' | 'enrollment:edit' | 'enrollment:delete'
  | 'enrollment:bulk_manage'

  // System administration
  | 'admin:users' | 'admin:courses' | 'admin:analytics' | 'admin:settings'
  | 'admin:payments' | 'admin:reports';

export type SystemPermission =
  | 'user:create' | 'user:edit' | 'user:delete' | 'user:view'
  | 'course:create' | 'course:approve'
  | 'system:settings' | 'system:logs' | 'system:backup';

export type Permission = CoursePermission | SystemPermission;

/**
 * Permission matrices for different user roles
 */
const STUDENT_PERMISSIONS: Permission[] = [
  // Course access for enrolled students
  'course:view',
  'course:preview',
  'lesson:view',
  'assessment:take',
  'assessment:view_results',
  'progress:view',
  'certificate:view',
  'enrollment:view',
];

const INSTRUCTOR_PERMISSIONS: Permission[] = [
  ...STUDENT_PERMISSIONS,
  // Course management for assigned courses
  'course:edit',
  'course:view_analytics',
  'course:manage_students',
  'lesson:edit',
  'lesson:create',
  'lesson:delete',
  'lesson:reorder',
  'lesson:publish',
  'assessment:view',
  'assessment:edit',
  'assessment:create',
  'assessment:delete',
  'assessment:grade',
  'progress:edit',
  'enrollment:view',
  'enrollment:create',
  'enrollment:edit',
  'certificate:generate',
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...INSTRUCTOR_PERMISSIONS,
  // Platform-wide administration
  'course:delete',
  'course:publish',
  'course:approve',
  'course:create',
  'progress:reset',
  'enrollment:delete',
  'enrollment:bulk_manage',
  'admin:courses',
  'admin:analytics',
  'admin:users',
  'admin:payments',
  'admin:reports',
  'user:create',
  'user:edit',
  'user:delete',
  'user:view',
];

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  'admin:settings',
  'system:settings',
  'system:logs',
  'system:backup',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  STUDENT: STUDENT_PERMISSIONS,
  INSTRUCTOR: INSTRUCTOR_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
};

/**
 * Context-specific permissions based on relationship to course
 */
export interface PermissionContext {
  userId: string;
  userRole: UserRole;
  courseId?: string;
  courseCreatorId?: string;
  isEnrolled?: boolean;
  isInstructor?: boolean;
  enrollmentStatus?: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'PENDING';
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  context: PermissionContext,
  permission: Permission,
): boolean {
  // Super admin has all permissions
  if (context.userRole === 'SUPER_ADMIN') {
    return true;
  }

  // Check base role permissions
  const basePermissions = ROLE_PERMISSIONS[context.userRole];
  if (!basePermissions.includes(permission)) {
    return false;
  }

  // Context-specific checks
  return checkContextualPermissions(context, permission);
}

/**
 * Check contextual permissions based on user's relationship to the course
 */
function checkContextualPermissions(
  context: PermissionContext,
  permission: Permission,
): boolean {
  const { userId, userRole, courseCreatorId, isEnrolled, isInstructor, enrollmentStatus } = context;

  // Course creator has full control over their courses
  if (courseCreatorId === userId) {
    const creatorPermissions: Permission[] = [
      'course:view', 'course:edit', 'course:delete', 'course:publish',
      'course:manage_students', 'course:view_analytics',
      'lesson:view', 'lesson:edit', 'lesson:create', 'lesson:delete',
      'lesson:reorder', 'lesson:publish',
      'assessment:view', 'assessment:edit', 'assessment:create',
      'assessment:delete', 'assessment:grade',
      'progress:view', 'progress:edit',
      'enrollment:view', 'enrollment:create', 'enrollment:edit',
      'certificate:generate',
    ];
    return creatorPermissions.includes(permission);
  }

  // Assigned instructor permissions
  if (isInstructor && userRole === 'INSTRUCTOR') {
    return ROLE_PERMISSIONS.INSTRUCTOR.includes(permission);
  }

  // Student-specific contextual checks
  if (userRole === 'STUDENT') {
    // Only enrolled students can view course content
    if (permission === 'course:view' || permission === 'lesson:view') {
      return isEnrolled === true && enrollmentStatus === 'ACTIVE';
    }

    // Assessment permissions require active enrollment
    if (permission === 'assessment:take' || permission === 'assessment:view_results') {
      return isEnrolled === true && enrollmentStatus === 'ACTIVE';
    }

    // Progress viewing requires enrollment
    if (permission === 'progress:view') {
      return isEnrolled === true;
    }
  }

  return true; // Default to allowing if base permission exists
}

/**
 * Get all permissions for a user in a specific context
 */
export function getUserPermissions(context: PermissionContext): Permission[] {
  const basePermissions = ROLE_PERMISSIONS[context.userRole];

  // Filter permissions based on context
  return basePermissions.filter(permission =>
    checkContextualPermissions(context, permission),
  );
}

/**
 * Permission groups for UI role management
 */
export const PERMISSION_GROUPS = {
  'Course Management': [
    'course:view', 'course:edit', 'course:delete', 'course:publish',
    'course:manage_students', 'course:view_analytics', 'course:preview',
  ],
  'Content Creation': [
    'lesson:view', 'lesson:edit', 'lesson:delete', 'lesson:create',
    'lesson:reorder', 'lesson:publish',
  ],
  'Assessment Management': [
    'assessment:view', 'assessment:edit', 'assessment:create', 'assessment:delete',
    'assessment:take', 'assessment:grade', 'assessment:view_results',
  ],
  'Student Management': [
    'enrollment:view', 'enrollment:create', 'enrollment:edit', 'enrollment:delete',
    'enrollment:bulk_manage', 'progress:view', 'progress:edit', 'progress:reset',
  ],
  'Certification': [
    'certificate:view', 'certificate:generate',
  ],
  'Administration': [
    'admin:users', 'admin:courses', 'admin:analytics', 'admin:settings',
    'admin:payments', 'admin:reports',
  ],
  'System': [
    'system:settings', 'system:logs', 'system:backup',
    'user:create', 'user:edit', 'user:delete', 'user:view',
  ],
} as const;

/**
 * Role hierarchy for permission inheritance
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  STUDENT: ['STUDENT'],
  INSTRUCTOR: ['STUDENT', 'INSTRUCTOR'],
  ADMIN: ['STUDENT', 'INSTRUCTOR', 'ADMIN'],
  SUPER_ADMIN: ['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
};

/**
 * Check if a role can be assigned by another role
 */
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  const assignerHierarchy = ROLE_HIERARCHY[assignerRole];
  return assignerHierarchy.includes(targetRole) && assignerRole !== targetRole;
}

/**
 * Get human-readable permission descriptions
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  // Course permissions
  'course:view': 'View course content and details',
  'course:edit': 'Modify course information and settings',
  'course:delete': 'Delete courses permanently',
  'course:publish': 'Publish or unpublish courses',
  'course:manage_students': 'Manage student enrollments and progress',
  'course:view_analytics': 'View course performance analytics',
  'course:preview': 'Preview course content without enrollment',
  'course:create': 'Create new courses',
  'course:approve': 'Approve courses for publication',

  // Lesson permissions
  'lesson:view': 'Access lesson content',
  'lesson:edit': 'Modify lesson content and structure',
  'lesson:delete': 'Delete lessons',
  'lesson:create': 'Create new lessons',
  'lesson:reorder': 'Change lesson order within courses',
  'lesson:publish': 'Publish or unpublish lessons',

  // Assessment permissions
  'assessment:view': 'View assessment questions and settings',
  'assessment:edit': 'Modify assessment content and settings',
  'assessment:create': 'Create new assessments',
  'assessment:delete': 'Delete assessments',
  'assessment:take': 'Take assessments as a student',
  'assessment:grade': 'Grade and review student submissions',
  'assessment:view_results': 'View assessment results and scores',

  // Progress permissions
  'progress:view': 'View learning progress and statistics',
  'progress:edit': 'Modify user progress records',
  'progress:reset': 'Reset user progress to start over',

  // Certificate permissions
  'certificate:view': 'View earned certificates',
  'certificate:generate': 'Generate certificates for students',

  // Enrollment permissions
  'enrollment:view': 'View enrollment information',
  'enrollment:create': 'Enroll students in courses',
  'enrollment:edit': 'Modify enrollment details and status',
  'enrollment:delete': 'Remove student enrollments',
  'enrollment:bulk_manage': 'Bulk enroll/unenroll students',

  // Admin permissions
  'admin:users': 'Manage user accounts and roles',
  'admin:courses': 'Oversee all courses on the platform',
  'admin:analytics': 'Access platform-wide analytics',
  'admin:settings': 'Configure platform settings',
  'admin:payments': 'Manage payments and billing',
  'admin:reports': 'Generate and access reports',

  // User management
  'user:create': 'Create new user accounts',
  'user:edit': 'Modify user profiles and settings',
  'user:delete': 'Delete user accounts',
  'user:view': 'View user profiles and information',

  // System permissions
  'system:settings': 'Access system-level configuration',
  'system:logs': 'View system logs and monitoring',
  'system:backup': 'Perform system backups and restoration',
};

/**
 * Utility to check multiple permissions at once
 */
export function hasAnyPermission(
  context: PermissionContext,
  permissions: Permission[],
): boolean {
  return permissions.some(permission => hasPermission(context, permission));
}

/**
 * Utility to check if user has all required permissions
 */
export function hasAllPermissions(
  context: PermissionContext,
  permissions: Permission[],
): boolean {
  return permissions.every(permission => hasPermission(context, permission));
}
