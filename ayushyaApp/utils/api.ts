// utils/api.ts
// API Service for MongoDB Backend Communication
import { NativeModules, Platform } from 'react-native';

// Environment detection for Android Studio / React Native runtime.
const isReactNative = typeof window !== 'undefined' && window.navigator.product === 'ReactNative';

function extractDevHostIp(): string | null {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
    if (typeof scriptURL === 'string' && scriptURL.length > 0) {
      // Example: http://192.168.1.23:8081/index.bundle?platform=android
      const match = scriptURL.match(/(?:http|https):\/\/([^/:]+)/i);
      return match?.[1] || null;
    }

    return null;
  } catch {
    return null;
  }
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (!value || seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function buildApiBaseCandidates(): string[] {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const devHostIp = extractDevHostIp();

  const emulatorCandidates = ['http://10.0.2.2:5000', 'http://127.0.0.1:5000', 'http://localhost:5000'];
  const deviceCandidates = [devHostIp ? `http://${devHostIp}:5000` : '', 'http://10.0.2.2:5000', 'http://127.0.0.1:5000'];

  const mobileCandidates = Platform.OS === 'android'
    ? [envUrl || '', ...deviceCandidates, ...emulatorCandidates]
    : [envUrl || '', devHostIp ? `http://${devHostIp}:5000` : '', 'http://localhost:5000'];

  const webCandidates = [envUrl || '', 'http://localhost:5000'];

  return uniqueStrings(isReactNative ? mobileCandidates : webCandidates);
}

const API_BASE_CANDIDATES = buildApiBaseCandidates();
let API_BASE_URL = API_BASE_CANDIDATES[0] || 'http://localhost:5000';

console.log('🌐 Environment Check:');
console.log('  Platform:', isReactNative ? 'React Native Mobile' : 'Web Browser');
console.log('  🔗 API_BASE_URL:', API_BASE_URL);
console.log('  🧭 API_BASE_CANDIDATES:', API_BASE_CANDIDATES);

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

  const preferred = [API_BASE_URL, ...API_BASE_CANDIDATES.filter((c) => c !== API_BASE_URL)];
  console.log(`📤 Request Body:`, body);

  try {
    let lastNetworkError: any = null;

    for (const baseUrl of preferred) {
      const fullUrl = `${baseUrl}${endpoint}`;
      console.log(`📡 API Call: ${method} ${fullUrl}`);

      // Create an abort controller with 10 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(fullUrl, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`📥 Response Status (${baseUrl}): ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`❌ API Error [${response.status}]:`, errorData);
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        // Success: keep the working base URL for next calls.
        API_BASE_URL = baseUrl;
        const data = await response.json();
        console.log(`✅ Response Data:`, data);
        return data;
      } catch (error: any) {
        clearTimeout(timeoutId);

        // Abort/network errors should try next candidate; logical HTTP errors should fail fast.
        const isAbort = error?.name === 'AbortError';
        const isNetwork = error instanceof TypeError && error.message === 'Failed to fetch';

        if (isAbort || isNetwork) {
          lastNetworkError = error;
          continue;
        }

        throw error;
      }
    }

    if (lastNetworkError?.name === 'AbortError') {
      console.error(`❌ API Timeout [${method} ${endpoint}]: Request took too long`);
      throw new Error('Request timeout - server not responding');
    }

    console.error(`❌ Cannot reach backend using candidates:`, preferred);
    throw new Error(
      `Cannot reach backend. Tried: ${preferred.join(', ')}. ` +
      `If using a physical Android device, set EXPO_PUBLIC_API_URL to your PC LAN IP (e.g. http://192.168.x.x:5000).`
    );
  } catch (error: any) {
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

export interface MealSummary {
  mealsLoggedToday: number;
  topFoodToday: string | null;
  topFoodGoodCount: number;
  totalGoodMealsToday: number;
  date: string;
}

export interface AqiSegment {
  name: string;
  aqi: number;
}

export interface AqiPoint {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface AqiCoordInput {
  lat: number;
  lon: number;
  label?: string;
}

export interface AqiRoute {
  id: string;
  name: string;
  dist: string;
  time: string;
  avgAqi: number;
  maxAqi: number;
  segments: AqiSegment[];
  from: AqiPoint;
  to: AqiPoint;
  via: AqiPoint;
  path: AqiPoint[];
}

export interface LocationSuggestion {
  id: string;
  label: string;
  lat: number;
  lon: number;
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

/**
 * Get today's meal feedback summary
 */
export async function getTodayMealSummary(
  userId: string,
  token: string
): Promise<{ success: boolean; summary?: MealSummary; message?: string }> {
  try {
    const response = await apiCall<{ success: boolean; summary?: MealSummary; message?: string }>(
      `/api/meal-feedback/${userId}/summary`,
      'GET',
      undefined,
      token
    );

    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch meal summary',
    };
  }
}

/**
 * Search location suggestions while user types source/destination.
 */
export async function searchLocationSuggestions(
  query: string,
  limit = 6
): Promise<{ success: boolean; suggestions?: LocationSuggestion[]; message?: string }> {
  try {
    return await apiCall<{ success: boolean; suggestions?: LocationSuggestion[]; message?: string }>(
      `/api/aqi/suggestions?q=${encodeURIComponent(query)}&limit=${Math.max(1, Math.min(limit, 10))}`,
      'GET'
    );
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch location suggestions',
    };
  }
}

/**
 * Build AQI-ranked route suggestions from source and destination text.
 */
export async function getAqiRouteRecommendations(
  fromText: string,
  toText: string,
  activity: 'jogging' | 'cycling' | 'walking',
  options?: {
    fromCoord?: AqiCoordInput;
    toCoord?: AqiCoordInput;
  }
): Promise<{ success: boolean; routes?: AqiRoute[]; message?: string }> {
  try {
    return await apiCall<{ success: boolean; routes?: AqiRoute[]; message?: string }>(
      '/api/aqi/routes',
      'POST',
      {
        fromText,
        toText,
        activity,
        options,
      }
    );
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch AQI routes',
    };
  }
}
