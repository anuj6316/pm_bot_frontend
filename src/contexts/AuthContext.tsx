import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, auth, User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const userData = await api.get<User>('/user/');
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      auth.clear();
      setUser(null);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      if (auth.isAuthenticated()) {
        await fetchUserProfile();
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const tokens = await api.login(email, password);
    auth.setTokens(tokens.access, tokens.refresh);
    await fetchUserProfile();
  };

  const logout = async () => {
    const refreshToken = auth.getRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/user/logout/', { refresh_token: refreshToken });
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }
    auth.clear();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const userData = await api.patch<User>('/user/', updates);
    setUser(userData);
  };

  const changePassword = async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    await api.post('/user/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    // Auto-logout after password change
    await logout();
  };

  const refreshUser = async () => {
    if (auth.isAuthenticated()) {
      await fetchUserProfile();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}