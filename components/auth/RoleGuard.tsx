/**
 * Role-based Access Control Component
 * Issue #1300: Component-level access control for AI Course functionality
 */

'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import type { UserRole } from '@prisma/client';
import type { Permission, PermissionContext } from '../../lib/auth/roles';
import { hasPermission } from '../../lib/auth/roles';
import type { CourseAuthContext } from '../../lib/auth/course-auth';

/**
 * Auth Context for React components
 */
interface AuthContextType {
  user: CourseAuthContext | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CourseAuthContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Create permission context from user
  const createPermissionContext = (authUser: CourseAuthContext): PermissionContext => ({
    userId: authUser.id,
    userRole: authUser.role,
    courseId: undefined, // Will be set contextually
    isEnrolled: authUser.isEnrolled,
    isInstructor: authUser.role === 'INSTRUCTOR',
    enrollmentStatus: authUser.hasActiveSubscription ? 'ACTIVE' : undefined,
  });

  // Permission checking functions
  const checkPermission = (permission: Permission): boolean => {
    if (!user) {return false;}
    const permissionContext = createPermissionContext(user);
    return hasPermission(permissionContext, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => permissions.some(permission => checkPermission(permission));

  const checkAllPermissions = (permissions: Permission[]): boolean => permissions.every(permission => checkPermission(permission));

  // Authentication functions
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/course-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        if (data.token) {
          localStorage.setItem('miyabi-auth-token', data.token);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/course-logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('miyabi-auth-token');
      document.cookie = 'miyabi-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('miyabi-auth-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem('miyabi-auth-token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      localStorage.removeItem('miyabi-auth-token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    refreshAuth();
  }, []);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Role Guard Component - Controls access based on user roles
 */
interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAnyRole?: boolean;
  requireAnyPermission?: boolean;
  courseId?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showLoading?: boolean;
}

export function RoleGuard({
  children,
  requiredRoles,
  requiredPermissions,
  requireAnyRole = false,
  requireAnyPermission = false,
  courseId,
  fallback,
  redirectTo,
  showLoading = true,
}: RoleGuardProps) {
  const auth = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Show loading state
  if (auth.isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Check authentication
  if (!auth.isAuthenticated) {
    if (redirectTo && !isRedirecting) {
      setIsRedirecting(true);
      window.location.href = `${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`;
      return null;
    }

    return fallback || (
      <div className="text-center p-6">
        <h3 className="text-lg font-semibold text-gray-900">Authentication Required</h3>
        <p className="text-gray-600 mt-2">Please sign in to access this content.</p>
      </div>
    );
  }

  // Check role-based access
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requireAnyRole
      ? requiredRoles.includes(auth.user!.role)
      : requiredRoles.every(role => auth.user!.role === role || isRoleHierarchySatisfied(auth.user!.role, role));

    if (!hasRequiredRole) {
      return fallback || (
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
          <p className="text-gray-600 mt-2">
            You don&apos;t have the required role to access this content.
          </p>
        </div>
      );
    }
  }

  // Check permission-based access
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAnyPermission
      ? auth.hasAnyPermission(requiredPermissions)
      : auth.hasAllPermissions(requiredPermissions);

    if (!hasRequiredPermissions) {
      return fallback || (
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
          <p className="text-gray-600 mt-2">
            You don&apos;t have the required permissions to access this content.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}

/**
 * Check if user role satisfies required role based on hierarchy
 */
function isRoleHierarchySatisfied(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    STUDENT: 1,
    INSTRUCTOR: 2,
    ADMIN: 3,
    SUPER_ADMIN: 4,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Higher-order component for role-based access control
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RoleGuardProps, 'children'> = {},
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <RoleGuard {...options}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

/**
 * Course-specific Role Guard
 */
interface CourseRoleGuardProps extends Omit<RoleGuardProps, 'courseId'> {
  courseId: string;
  requireEnrollment?: boolean;
  requireActiveSubscription?: boolean;
}

export function CourseRoleGuard({
  children,
  courseId,
  requireEnrollment = false,
  requireActiveSubscription = false,
  fallback,
  ...otherProps
}: CourseRoleGuardProps) {
  const auth = useAuth();
  const [courseAuth, setCourseAuth] = useState<CourseAuthContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkCourseAuth() {
      if (!auth.isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/courses/${courseId}/auth-check`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('miyabi-auth-token')}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setCourseAuth(data.context);
        }
      } catch (error) {
        console.error('Course auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkCourseAuth();
  }, [courseId, auth.isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Checking course access...</span>
      </div>
    );
  }

  // Check enrollment requirement
  if (requireEnrollment && (!courseAuth?.isEnrolled)) {
    return fallback || (
      <div className="text-center p-6">
        <h3 className="text-lg font-semibold text-gray-900">Enrollment Required</h3>
        <p className="text-gray-600 mt-2">
          You must be enrolled in this course to access this content.
        </p>
      </div>
    );
  }

  // Check active subscription requirement
  if (requireActiveSubscription && (!courseAuth?.hasActiveSubscription)) {
    return fallback || (
      <div className="text-center p-6">
        <h3 className="text-lg font-semibold text-gray-900">Active Subscription Required</h3>
        <p className="text-gray-600 mt-2">
          An active subscription is required to access this content.
        </p>
      </div>
    );
  }

  return (
    <RoleGuard courseId={courseId} {...otherProps}>
      {children}
    </RoleGuard>
  );
}

/**
 * Permission Check Component
 */
interface PermissionCheckProps {
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
}

export function PermissionCheck({ children, permission, fallback }: PermissionCheckProps) {
  const auth = useAuth();

  if (!auth.hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Conditional Rendering based on authentication status
 */
interface ConditionalRenderProps {
  authenticated?: React.ReactNode;
  unauthenticated?: React.ReactNode;
  loading?: React.ReactNode;
}

export function ConditionalRender({ authenticated, unauthenticated, loading }: ConditionalRenderProps) {
  const auth = useAuth();

  if (auth.isLoading) {
    return <>{loading}</>;
  }

  if (auth.isAuthenticated) {
    return <>{authenticated}</>;
  }

  return <>{unauthenticated}</>;
}
