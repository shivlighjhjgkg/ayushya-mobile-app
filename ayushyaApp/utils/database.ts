// utils/database.ts
// Database functions using MongoDB backend via API

import { registerUser as apiRegisterUser, loginUser as apiLoginUser, getUserProfile, saveQuizResults as apiSaveQuizResults, getHealthProfile, updateHealthProfile as apiUpdateHealthProfile } from './api';

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

// ==================== INITIALIZATION ====================

/**
 * Initialize database (validation check)
 * With backend, this just verifies API connectivity
 */
export async function initDatabase(): Promise<void> {
  try {
    console.log('✅ Database initialized - using MongoDB backend');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// ==================== AUTH OPERATIONS ====================

/**
 * Register user via API
 * Password is hashed on the backend
 */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
  try {
    const result = await apiRegisterUser(email, password, name);
    
    if (result.success) {
      console.log('✅ User registered successfully:', email);
    } else {
      console.error('❌ Registration error:', result.message);
    }
    
    return {
      success: result.success,
      message: result.message,
      token: result.token,
      user: result.user,
    };
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    return {
      success: false,
      message: `Registration failed: ${error?.message || 'Unknown error'}`,
    };
  }
}

/**
 * Login user via API
 * Returns JWT token for authenticated requests
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; message: string; token?: string }> {
  try {
    const result = await apiLoginUser(email, password);
    
    if (result.success && result.user) {
      const user: User = {
        _id: result.user._id,
        email: result.user.email,
        name: result.user.name,
        createdAt: new Date().toISOString(),
      };
      
      console.log('✅ Login successful:', email);
      return {
        success: true,
        user,
        message: 'Login successful!',
        token: result.token,
      };
    } else {
      return {
        success: false,
        message: result.message || 'Login failed',
      };
    }
  } catch (error: any) {
    console.error('❌ Login error:', error);
    return {
      success: false,
      message: error.message || 'Login failed',
    };
  }
}

// ==================== USER OPERATIONS ====================

/**
 * Get user by ID via API
 * Requires authentication token
 */
export async function getUserById(userId: string, token: string): Promise<User | null> {
  try {
    const result = await getUserProfile(userId, token);
    
    if (result.success && result.user) {
      return {
        _id: result.user._id,
        email: result.user.email,
        name: result.user.name,
        createdAt: result.user.createdAt,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Get all users (not recommended for frontend - use for admin dashboard only)
 */
export async function getAllUsers(): Promise<User[]> {
  console.warn('⚠️ getAllUsers() is not recommended - this would require admin endpoint');
  return [];
}

// ==================== QUIZ/DOSHA OPERATIONS ====================

/**
 * Save quiz results to user's health profile via API
 * Creates or updates the dosha scores in MongoDB
 */
export async function saveQuizResults(
  userId: string,
  dosha: { vata: number; pitta: number; kapha: number },
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('\n🔍 ==== SAVE QUIZ RESULTS ====');
    console.log('📊 User ID:', userId);
    console.log('📈 Dosha Scores:', dosha);
    console.log('🔑 Token:', token ? `Present (${token.substring(0, 30)}...)` : 'MISSING!');
    
    const result = await apiSaveQuizResults(userId, dosha, token);
    
    console.log('📤 API Response:', result);
    
    if (result.success) {
      console.log('✅ Quiz results saved for user:', userId);
    } else {
      console.error('❌ Error saving quiz results:', result.message);
    }
    
    console.log('🔍 ==== END SAVE QUIZ RESULTS ====\n');
    
    return {
      success: result.success,
      message: result.message || 'Quiz results saved!',
    };
  } catch (error: any) {
    console.error('❌ Error saving quiz results:', error);
    console.error('📋 Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return {
      success: false,
      message: error.message || 'Failed to save quiz results',
    };
  }
}

/**
 * Get user's health profile (includes dosha scores)
 */
export async function getQuizResults(
  userId: string,
  token: string
): Promise<{ vata: number; pitta: number; kapha: number } | null> {
  try {
    const result = await getHealthProfile(userId, token);
    
    if (result.success && result.profile) {
      return result.profile.doshaScores;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return null;
  }
}

/**
 * Update health profile with additional health information
 */
export async function updateHealthProfile(
  userId: string,
  data: {
    allergens?: string[];
    dateOfBirth?: string;
    age?: number;
    bmi?: number;
    dietaryPreference?: 'vegetarian' | 'non-vegetarian';
    desha?: string;
    season?: string;
  },
  token?: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📝 Updating health profile:', userId);
    const result = await apiUpdateHealthProfile(userId, data, token || '');
    
    if (result.success) {
      console.log('✅ Health profile updated');
    } else {
      console.error('❌ Error updating profile:', result.message);
    }
    
    return {
      success: result.success,
      message: result.message || 'Profile updated!',
    };
  } catch (error: any) {
    console.error('❌ Error updating health profile:', error);
    return {
      success: false,
      message: error.message || 'Failed to update profile',
    };
  }
}
