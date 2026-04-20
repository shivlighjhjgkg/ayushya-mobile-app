// utils/authContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateToken } from './api';

export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  dosha?: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  quizCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserDosha: (dosha: { vata: number; pitta: number; kapha: number }) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);

        if (savedToken) {
          // Validate token with backend
          const { success, user: apiUser } = await validateToken(savedToken);

          if (success && apiUser) {
            setToken(savedToken);
            setUser({
              _id: apiUser._id,
              email: apiUser.email,
              name: apiUser.name,
              createdAt: apiUser.createdAt,
            });
            console.log('✅ Session restored:', apiUser.email);
          } else {
            // Token invalid or expired, clear stored data
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
            console.log('⚠️ Token validation failed, session cleared');
          }
        }
      } catch (error) {
        console.error('❌ Auth restore error:', error);
        // Clear potentially corrupted data
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);

    // Persist to AsyncStorage for session recovery
    await AsyncStorage.setItem(TOKEN_KEY, authToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    console.log('✅ User logged in:', userData.email);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);

    // Clear stored session
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    console.log('✅ User logged out');
  };

  const updateUserDosha = (dosha: { vata: number; pitta: number; kapha: number }) => {
    if (user) {
      setUser({ ...user, dosha, quizCompleted: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUserDosha }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
