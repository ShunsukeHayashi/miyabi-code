import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  githubId: number;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (token, user) =>
        set({
          token,
          accessToken: token,
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          token: null,
          accessToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      clearAuth: () =>
        set({
          token: null,
          accessToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'miyabi-auth-storage',
    }
  )
);
