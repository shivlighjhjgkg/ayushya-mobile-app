// utils/database.ts
// Database functions using MongoDB backend via API

import { registerUser as apiRegisterUser, loginUser as apiLoginUser, getUserProfile, saveQuizResults as apiSaveQuizResults, getHealthProfile, updateHealthProfile as apiUpdateHealthProfile, createFamily as apiCreateFamily, joinFamily as apiJoinFamily, getFamily as apiGetFamily, type Family } from './api';

export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt?: string;
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
    console.log('\n🔍 ==== SAVE QUIZ RESULTS (DATABASE WRAPPER) ====');
    console.log('📊 User ID:', userId);
    console.log('📈 Dosha Scores:', dosha);
    console.log('🔑 Token:', token ? `Present (${token.substring(0, 30)}...)` : 'MISSING!');
    
    // Call the imported API function
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
 * Check if user needs to take quiz
 * Returns true if profile doesn't exist or quiz not completed
 */
export async function needsQuiz(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    console.log('\n🔍 Checking if user needs quiz:', userId);
    const result = await getHealthProfile(userId, token);
    
    // If fetch failed or profile doesn't exist, user needs quiz
    if (!result.success || result.needsQuiz) {
      console.log('✅ User NEEDS TO TAKE QUIZ');
      return true;
    }

    // If profile exists and quiz is completed, skip quiz
    if (result.profile && result.profile.quizCompleted) {
      console.log('✅ User ALREADY COMPLETED QUIZ - skip to dashboard');
      return false;
    }

    console.log('✅ User NEEDS TO TAKE QUIZ (not completed)');
    return true;
  } catch (error) {
    console.error('Error checking quiz status:', error);
    // If error, assume user needs to take quiz (safer assumption)
    return true;
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
    console.log('📦 Data being sent to API:', JSON.stringify(data, null, 2));
    const result = await apiUpdateHealthProfile(userId, data, token || '');

    // Return the full API result so callers can inspect profile and errors
    if (result) {
      console.log('📤 API updateHealthProfile response:', result);
      return {
        success: !!result.success,
        message: result.message || (result.success ? 'Profile updated!' : 'Failed to update profile'),
      } as { success: boolean; message: string };
    }

    console.error('❌ No response from updateHealthProfile API');
    return { success: false, message: 'No response from server' };
  } catch (error: any) {
    console.error('❌ Error updating health profile:', error);
    return {
      success: false,
      message: error.message || 'Failed to update profile',
    };
  }
}

// ==================== FAMILY OPERATIONS ====================

/**
 * Create a new family
 */
export async function createFamily(
  userId: string,
  familyName: string,
  token: string
): Promise<{ success: boolean; message: string; family?: Family }> {
  try {
    console.log('\n👨‍👩‍👧‍👦 Creating family:', familyName);
    const result = await apiCreateFamily(userId, familyName, token);
    
    if (result.success) {
      console.log('✅ Family created:', familyName);
    } else {
      console.error('❌ Error creating family:', result.message);
    }
    
    return {
      success: result.success,
      message: result.message,
      family: result.family,
    };
  } catch (error: any) {
    console.error('❌ Error creating family:', error);
    return {
      success: false,
      message: error.message || 'Failed to create family',
    };
  }
}

/**
 * Join a family using code
 */
export async function joinFamily(
  userId: string,
  familyCode: string,
  token: string
): Promise<{ success: boolean; message: string; family?: Family }> {
  try {
    console.log('\n👨‍👩‍👧 Joining family with code:', familyCode);
    const result = await apiJoinFamily(userId, familyCode, token);
    
    if (result.success) {
      console.log('✅ Joined family successfully');
    } else {
      console.error('❌ Error joining family:', result.message);
    }
    
    return {
      success: result.success,
      message: result.message,
      family: result.family,
    };
  } catch (error: any) {
    console.error('❌ Error joining family:', error);
    return {
      success: false,
      message: error.message || 'Failed to join family',
    };
  }
}

/**
 * Get family members for a user
 */
export async function getFamily(
  userId: string,
  token: string
): Promise<{ success: boolean; family?: Family | null }> {
  try {
    console.log('\n👪 Fetching family for user:', userId);
    const result = await apiGetFamily(userId, token);
    
    if (result.success) {
      console.log('✅ Family fetched successfully');
    }
    
    return {
      success: result.success,
      family: result.family,
    };
  } catch (error: any) {
    console.error('❌ Error fetching family:', error);
    return {
      success: false,
    };
  }
}
