// utils/api.ts
// API Service for MongoDB Backend Communication

// Environment detection - Better logic for web vs mobile
let API_BASE_URL = 'http://localhost:5000'; // Default to web

// Check if we're in React Native (mobile)
if (typeof window !== 'undefined' && window.navigator.product === 'ReactNative') {
  API_BASE_URL = 'http://10.0.2.2:5000'; // Android emulator
}

// Override with env var if set
if (process.env.EXPO_PUBLIC_API_URL) {
  API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
}

console.log('🌐 Environment Check:');
console.log('  Platform:', typeof window !== 'undefined' && window.navigator.product === 'ReactNative' ? 'React Native Mobile' : 'Web Browser');
console.log('  🔗 API_BASE_URL:', API_BASE_URL);

// ==================== CONNECTIVITY TEST ====================
/**
 * Test if backend is reachable
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    console.log(`🧪 Testing backend connection to: ${API_BASE_URL}/health`);
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Backend is reachable:', data);
    return true;
  } catch (error: any) {
    console.error('❌ Backend connection failed:', error.message);
    console.error('   Make sure backend is running at http://localhost:5000');
    console.error('   Command: cd backend && npm start');
    return false;
  }
}

// API_BASE_URL options:
// - Web Browser: http://localhost:5000
// - Android Emulator: http://10.0.2.2:5000
// - iOS Simulator: http://localhost:5000
// - Physical Device: http://192.168.x.x:5000

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    created_at?: string;
  };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface HealthProfile {
  userId: string;
  doshaScores: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  dominantDosha: 'vata' | 'pitta' | 'kapha';
  quizCompleted: boolean;
  allergens?: string[];
  dateOfBirth?: string;
  age?: number;
  bmi?: number;
  dietaryPreference?: 'vegetarian' | 'non-vegetarian';
  desha?: string;
  season?: string;
}

// Helper function for API calls with error handling
async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`📡 API Call: ${method} ${fullUrl}`);
  console.log(`📤 Request Body:`, body);

  try {
    // Create an abort controller with 10 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`📥 Response Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ API Error [${response.status}]:`, errorData);
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Response Data:`, data);
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`❌ API Timeout [${method} ${endpoint}]: Request took too long`);
      throw new Error('Request timeout - server not responding');
    }
    
    // Network error - backend not reachable
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error(`❌ Cannot reach backend at: ${API_BASE_URL}`);
      console.error('   Possible causes:');
      console.error('   1. Backend not running (npm start in backend folder)');
      console.error('   2. Wrong API_BASE_URL:', API_BASE_URL);
      console.error('   3. Network/firewall blocking connection');
      throw new Error(`Cannot reach backend at ${API_BASE_URL}. Make sure backend is running: cd backend && npm start`);
    }
    
    console.error(`❌ API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
}

// ==================== AUTH ENDPOINTS ====================

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
  try {
    const response = await apiCall<AuthResponse>('/api/auth/register', 'POST', {
      email,
      password,
      name,
    });

    return {
      success: response.success,
      message: response.message,
      token: response.token,
      user: response.user,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Registration failed',
    };
  }
}

/**
 * Login user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
  try {
    const response = await apiCall<AuthResponse>('/api/auth/login', 'POST', {
      email,
      password,
    });

    return {
      success: response.success,
      message: response.message,
      token: response.token,
      user: response.user,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Login failed',
    };
  }
}

/**
 * Validate token and get current user
 */
export async function validateToken(token: string): Promise<{ success: boolean; user?: User }> {
  try {
    const response = await apiCall<{ success: boolean; user?: User }>(
      '/api/auth/me',
      'GET',
      undefined,
      token
    );

    return response;
  } catch {
    return { success: false };
  }
}

/**
 * Logout user (optional - mainly for frontend cleanup)
 */
export async function logoutUser(token: string): Promise<void> {
  try {
    await apiCall('/api/auth/logout', 'POST', {}, token);
  } catch {
    console.error('Logout error');
  }
}

// ==================== USER PROFILE ENDPOINTS ====================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string, token: string): Promise<{ success: boolean; user?: User }> {
  try {
    const response = await apiCall<{ success: boolean; user?: User }>(
      `/users/${userId}`,
      'GET',
      undefined,
      token
    );

    return response;
  } catch {
    return {
      success: false,
    };
  }
}

// ==================== HEALTH PROFILE / QUIZ ENDPOINTS ====================

/**
 * Save quiz results (dosha scores) to health profile
 */
export async function saveQuizResults(
  userId: string,
  doshaScores: { vata: number; pitta: number; kapha: number },
  token: string
): Promise<{ success: boolean; message: string; profile?: HealthProfile }> {
  try {
    console.log('\n� POST /api/health/profile');
    
    // Calculate dominant dosha
    const dominantDosha = (
      Object.entries(doshaScores).reduce((prev, current) =>
        current[1] > prev[1] ? current : prev
      ) as [string, number]
    )[0] as 'vata' | 'pitta' | 'kapha';

    const payload = {
      userId,
      doshaScores,
      dominantDosha,
      quizCompleted: true,
    };
    
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    const response = await apiCall<{ success: boolean; message: string; profile?: HealthProfile }>(
      '/api/health/profile',
      'POST',
      payload,
      token
    );
    
    return response;
  } catch (error: any) {
    console.error('\n❌ API saveQuizResults FAILED!');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      message: error.message || 'Failed to save quiz results',
    };
  }
}

/**
 * Get user's health profile
 */
export async function getHealthProfile(
  userId: string,
  token: string
): Promise<{ success: boolean; profile?: any; needsQuiz?: boolean }> {
  try {
    console.log('\n📖 GET /api/health/profile/:userId');
    const response = await apiCall<{ success: boolean; profile?: any; needsQuiz?: boolean }>(
      `/api/health/profile/${userId}`,
      'GET',
      undefined,
      token
    );

    return response;
  } catch (error: any) {
    console.error('❌ Error fetching health profile:', error.message);
    return {
      success: false,
      needsQuiz: true,
    };
  }
}

/**
 * Update health profile
 */
export async function updateHealthProfile(
  userId: string,
  data: Partial<HealthProfile>,
  token: string
): Promise<{ success: boolean; message: string; profile?: HealthProfile }> {
  try {
    console.log('\n📝 PATCH /api/health/profile/:userId');
    const response = await apiCall<{ success: boolean; message: string; profile?: HealthProfile }>(
      `/api/health/profile/${userId}`,
      'PATCH',
      data,
      token
    );

    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update health profile',
    };
  }
}

// ==================== FAMILY ENDPOINTS ====================

export interface FamilyMember {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
  doshaScores?: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  dominantDosha?: string;
}

export interface Family {
  _id: string;
  familyName: string;
  familyCode: string;
  createdBy: string;
  members: FamilyMember[];
  createdAt: string;
}

export interface GroceryList {
  _id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  items: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MealChoice {
  name: string;
  course: string;
  digestibility?: string;
  dietary?: string;
  region?: string;
  season?: string;
  doshaImpact?: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  url?: string;
  matchedIngredients: string[];
  unmatchedIngredients: string[];
}

export interface WeeklyMealPlanDay {
  day: string;
  breakfast: MealChoice;
  lunchMain: MealChoice;
  lunchSide: MealChoice;
  dinnerMain: MealChoice;
  dinnerSide: MealChoice;
  appetizer: MealChoice;
  dessert: MealChoice;
}

export interface WeeklyMealPlan {
  _id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  days: WeeklyMealPlanDay[];
}

export interface MealFeedbackLog {
  _id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  mealName: string;
  feedback: 'good' | 'neutral' | 'bad';
  loggedAt: string;
}

/**
 * Create a new family
 */
export async function createFamily(
  userId: string,
  familyName: string,
  token: string
): Promise<{ success: boolean; message: string; family?: Family }> {
  try {
    console.log('\n👨‍👩‍👧‍👦 POST /api/family/create');
    const response = await apiCall<{ success: boolean; message: string; family?: Family }>(
      '/api/family/create',
      'POST',
      { userId, familyName },
      token
    );

    return response;
  } catch (error: any) {
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
    console.log('\n👨‍👩‍👧 POST /api/family/join');
    const response = await apiCall<{ success: boolean; message: string; family?: Family }>(
      '/api/family/join',
      'POST',
      { userId, familyCode },
      token
    );

    return response;
  } catch (error: any) {
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
    console.log('\n👪 GET /api/family/:userId');
    const response = await apiCall<{ success: boolean; family?: Family | null }>(
      `/api/family/${userId}`,
      'GET',
      undefined,
      token
    );

    return response;
  } catch {
    return {
      success: false,
    };
  }
}

// ==================== GROCERY LIST ENDPOINTS ====================

/**
 * Save current week's grocery list for a user
 */
export async function saveWeeklyGroceryList(
  userId: string,
  items: string[],
  token: string
): Promise<{ success: boolean; message: string; groceryList?: GroceryList }> {
  try {
    const response = await apiCall<{ success: boolean; message: string; groceryList?: GroceryList }>(
      `/api/grocery-lists/${userId}`,
      'POST',
      { items },
      token
    );

    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to save grocery list',
    };
  }
}

/**
 * Get current week's grocery list for a user
 */
export async function getCurrentWeeklyGroceryList(
  userId: string,
  token: string
): Promise<{ success: boolean; groceryList?: GroceryList | null; message?: string }> {
  try {
    const response = await apiCall<{ success: boolean; groceryList?: GroceryList | null; message?: string }>(
      `/api/grocery-lists/${userId}/current`,
      'GET',
      undefined,
      token
    );

    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch grocery list',
    };
  }
}

/**
 * Generate profile-based recommended grocery list
 */
export async function getRecommendedWeeklyGroceryList(
  userId: string,
  token: string
): Promise<{ success: boolean; items?: string[]; message?: string }> {
  try {
    const response = await apiCall<{ success: boolean; items?: string[]; message?: string }>(
      `/api/grocery-lists/${userId}/recommended`,
      'GET',
      undefined,
      token
    );

    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to generate recommended grocery list',
    };
  }
}

/**
 * Get current week's generated meal plan for a user
 */
export async function getCurrentWeeklyMealPlan(
  userId: string,
  token: string,
  refresh = false
): Promise<{ success: boolean; plan?: WeeklyMealPlan; source?: string; message?: string }> {
  try {
    const response = await apiCall<{ success: boolean; plan?: WeeklyMealPlan; source?: string; message?: string }>(
      `/api/meal-plans/${userId}/current-week${refresh ? '?refresh=true' : ''}`,
      'GET',
      undefined,
      token
    );

    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch weekly meal plan',
    };
  }
}

/**
 * Save meal feedback log
 */
export async function saveMealFeedbackLog(
  userId: string,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  mealName: string,
  feedback: 'good' | 'neutral' | 'bad',
  token: string
): Promise<{ success: boolean; message: string; log?: MealFeedbackLog }> {
  try {
    const response = await apiCall<{ success: boolean; message: string; log?: MealFeedbackLog }>(
      `/api/meal-feedback/${userId}`,
      'POST',
      { mealType, mealName, feedback },
      token
    );

    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to save meal feedback',
    };
  }
}

/**
 * Get recent meal feedback logs
 */
export async function getRecentMealFeedbackLogs(
  userId: string,
  token: string,
  limit = 4
): Promise<{ success: boolean; logs?: MealFeedbackLog[]; message?: string }> {
  try {
    const response = await apiCall<{ success: boolean; logs?: MealFeedbackLog[]; message?: string }>(
      `/api/meal-feedback/${userId}/recent?limit=${limit}`,
      'GET',
      undefined,
      token
    );

    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch recent logs',
    };
  }
}
