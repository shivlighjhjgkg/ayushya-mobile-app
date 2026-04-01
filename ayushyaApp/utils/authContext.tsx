// utils/authContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserById } from './database';

export interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedUserId = await AsyncStorage.getItem('userId');
        if (savedUserId) {
          const dbUser = await getUserById(parseInt(savedUserId));
          if (dbUser) {
            setUser({
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
            });
          }
        }
      } catch (error) {
        console.error('Auth restore error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    await AsyncStorage.setItem('userId', userData.id.toString());
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
