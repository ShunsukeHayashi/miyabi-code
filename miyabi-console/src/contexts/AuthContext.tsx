import axios from 'axios';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Role types for authorization
export type UserRole = 'admin' | 'developer' | 'viewer';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  created_at: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error?: string | null;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          // Verify token and get user info
          const response = await axios.get('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          // Determine role based on user (default to admin for repo owners)
          // In production, this would come from your backend/JWT
          const userRole: UserRole = 'admin'; // TODO: Get from backend

          setUser({
            id: response.data.id.toString(),
            username: response.data.login,
            email: response.data.email || '',
            avatar_url: response.data.avatar_url,
            created_at: response.data.created_at,
            role: userRole,
          });
          setError(null);
        } catch (err) {
          console.error('Auth check failed:', err);
          if (axios.isAxiosError(err)) {
            setError(err.response?.data?.message || 'Authentication failed');
          } else {
            setError('An unexpected error occurred');
          }
          localStorage.removeItem('access_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = () => {
    // Redirect to GitHub OAuth
    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23liZZwnVGZaAa809q';
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'user:email';

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setError(null);
    window.location.href = '/';
  };

  // Role hierarchy: admin > developer > viewer
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    developer: 2,
    viewer: 1,
  };

  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userLevel = roleHierarchy[user.role];

    // Check if user has any of the required roles (or higher)
    return roles.some((role) => userLevel >= roleHierarchy[role]);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
