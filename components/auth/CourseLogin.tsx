/**
 * Course Platform Login Component
 * Issue #1300: Authentication components for AI Course functionality
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserRole } from '@prisma/client';

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username?: string;
    role: UserRole;
  };
  token?: string;
  redirectUrl?: string;
  error?: string;
}

interface CourseLoginProps {
  redirectTo?: string;
  courseId?: string;
  allowRegistration?: boolean;
  className?: string;
  onSuccess?: (response: LoginResponse) => void;
  onError?: (error: string) => void;
}

export default function CourseLogin({
  redirectTo,
  courseId,
  allowRegistration = true,
  className = '',
  onSuccess,
  onError,
}: CourseLoginProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    role: 'STUDENT' as UserRole,
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (isRegistering) {
      setRegisterData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [isRegistering, errors]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (isRegistering) {
      if (!registerData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
        newErrors.email = 'Please enter a valid email';
      }

      if (!registerData.password) {
        newErrors.password = 'Password is required';
      } else if (registerData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (registerData.password !== registerData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!registerData.username) {
        newErrors.username = 'Username is required';
      }

      if (!registerData.acceptTerms) {
        newErrors.acceptTerms = 'You must accept the terms and conditions';
      }
    } else {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [isRegistering, formData, registerData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isRegistering ? '/api/auth/course-register' : '/api/auth/course-login';
      const payload = isRegistering ? {
        ...registerData,
        courseId,
      } : {
        ...formData,
        courseId,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: LoginResponse = await response.json();

      if (data.success) {
        // Store token in localStorage and cookies
        if (data.token) {
          localStorage.setItem('miyabi-auth-token', data.token);
          document.cookie = `miyabi-auth-token=${data.token}; path=/; secure; samesite=strict; max-age=${formData.rememberMe ? 604800 : 3600}`;
        }

        onSuccess?.(data);

        // Redirect to appropriate page
        const redirectUrl = data.redirectUrl ||
          redirectTo ||
          searchParams?.get('redirect') ||
          (courseId ? `/courses/${courseId}` : '/dashboard');

        router.push(redirectUrl);
      } else {
        const errorMessage = data.error || 'Authentication failed';
        setErrors({ submit: errorMessage });
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    validateForm,
    isRegistering,
    formData,
    registerData,
    courseId,
    onSuccess,
    onError,
    redirectTo,
    searchParams,
    router
  ]);

  const toggleMode = useCallback(() => {
    setIsRegistering(prev => !prev);
    setErrors({});
  }, []);

  return (
    <div className={`max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isRegistering ? 'Create Account' : 'Sign In'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isRegistering
            ? 'Join our learning platform'
            : 'Access your courses and continue learning'
          }
        </p>
      </div>

      {courseId && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            Sign in to access course content and track your progress
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={isRegistering ? registerData.email : formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {isRegistering && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={registerData.username}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Choose a username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={isRegistering ? registerData.password : formData.password}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {isRegistering && (
          <>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I am a...
              </label>
              <select
                id="role"
                name="role"
                value={registerData.role}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={registerData.acceptTerms}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                I accept the{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600">{errors.acceptTerms}</p>
            )}
          </>
        )}

        {!isRegistering && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <a href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
              Forgot password?
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isRegistering ? 'Creating Account...' : 'Signing In...'}
            </div>
          ) : (
            isRegistering ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>

      {allowRegistration && (
        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {isRegistering
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"
            }
          </button>
        </div>
      )}

      <div className="mt-6 border-t border-gray-200 pt-6">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Secure authentication powered by Miyabi AI Platform
          </p>
        </div>
      </div>
    </div>
  );
}