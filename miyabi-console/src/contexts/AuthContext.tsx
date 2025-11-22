import axios from 'axios';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error?: string | null;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
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

          setUser({
            id: response.data.id.toString(),
            username: response.data.login,
            email: response.data.email || '',
            avatar_url: response.data.avatar_url,
            created_at: response.data.created_at,
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

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
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
