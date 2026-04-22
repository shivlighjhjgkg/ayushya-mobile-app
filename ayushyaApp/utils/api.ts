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

type Coord = { lat: number; lon: number; label: string };
type GeocodeResult = {
  id?: string | number;
  name?: string;
  admin1?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

type GeocodeResultWithCoords = GeocodeResult & {
  latitude: number;
  longitude: number;
};

type PhotonFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry?: {
    coordinates?: [number, number][];
  };
};

function hasCoords(item: GeocodeResult): item is GeocodeResultWithCoords {
  return typeof item.latitude === 'number' && typeof item.longitude === 'number';
}

function uniqueVariants(variants: string[]): string[] {
  const seen = new Set<string>();
  return variants.filter((v) => {
    const key = v.toLowerCase().trim();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isIndiaResult(result: GeocodeResult): boolean {
  const country = String(result.country || '').toLowerCase();
  return country.includes('india');
}

function toPhotonLabel(feature: PhotonFeature): string {
  const name = feature.properties?.name || '';
  const city = feature.properties?.city || '';
  const state = feature.properties?.state || '';
  const country = feature.properties?.country || '';

  const parts = [name, city, state, country].map((p) => p.trim()).filter(Boolean);
  return parts.join(', ');
}

function coordFromSuggestion(suggestion: LocationSuggestion): Coord {
  return {
    lat: suggestion.lat,
    lon: suggestion.lon,
    label: suggestion.label,
  };
}

async function fetchPhotonSuggestions(query: string, limit: number): Promise<LocationSuggestion[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${Math.max(1, Math.min(limit, 10))}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Photon lookup failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const features: PhotonFeature[] = Array.isArray(data?.features) ? data.features : [];

  const mapped = features
    .map((feature, index) => {
      const coords = feature.geometry?.coordinates;
      if (!coords || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
        return null;
      }

      const label = toPhotonLabel(feature);
      if (!label) {
        return null;
      }

      return {
        id: `${label}_${index}_${coords[1]}_${coords[0]}`,
        label,
        lat: coords[1],
        lon: coords[0],
      } as LocationSuggestion;
    })
    .filter((item): item is LocationSuggestion => !!item);

  const indiaFirst = [
    ...mapped.filter((item) => item.label.toLowerCase().includes('india')),
    ...mapped.filter((item) => !item.label.toLowerCase().includes('india')),
  ];

  const dedup = new Set<string>();
  return indiaFirst.filter((item) => {
    const key = `${item.label}_${item.lat.toFixed(5)}_${item.lon.toFixed(5)}`;
    if (dedup.has(key)) {
      return false;
    }
    dedup.add(key);
    return true;
  });
}

async function fetchGeocodeResults(query: string, count: number): Promise<GeocodeResult[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${Math.max(1, Math.min(count, 12))}&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo geocoding failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
}

async function fetchOpenMeteoSuggestions(query: string, limit: number): Promise<LocationSuggestion[]> {
  const variants = uniqueVariants([query, `${query}, India`]);
  const allResults = (
    await Promise.all(variants.map((variant) => fetchGeocodeResults(variant, Math.max(1, Math.min(limit, 10)))))
  ).flat();

  const indiaFirst = [
    ...allResults.filter(isIndiaResult),
    ...allResults.filter((r) => !isIndiaResult(r)),
  ];

  const dedup = new Set<string>();
  return indiaFirst
    .filter(hasCoords)
    .map((item) => {
      const city = item.name || '';
      const admin = item.admin1 ? `, ${item.admin1}` : '';
      const country = item.country ? `, ${item.country}` : '';
      return {
        id: String(item.id || `${city}_${item.latitude}_${item.longitude}`),
        label: `${city}${admin}${country}`,
        lat: item.latitude,
        lon: item.longitude,
      };
    })
    .filter((item) => {
      const key = `${item.label}_${item.lat.toFixed(5)}_${item.lon.toFixed(5)}`;
      if (dedup.has(key)) {
        return false;
      }
      dedup.add(key);
      return true;
    })
    .slice(0, Math.max(1, Math.min(limit, 10)));
}

async function geocodeLocation(query: string): Promise<Coord> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error('Please enter a valid location');
  }

  try {
    const photon = await fetchPhotonSuggestions(trimmed, 1);
    if (photon.length > 0) {
      return coordFromSuggestion(photon[0]);
    }
  } catch {
    // Fall through to open-meteo geocoder fallback.
  }

  const fallback = await fetchOpenMeteoSuggestions(trimmed, 1);
  if (fallback.length > 0) {
    return coordFromSuggestion(fallback[0]);
  }

  throw new Error(`Could not locate "${query}". Try choosing from suggestions.`);
}

/**
 * Search location suggestions while user types source/destination.
 */
export async function searchLocationSuggestions(
  query: string,
  limit = 6
): Promise<{ success: boolean; suggestions?: LocationSuggestion[]; message?: string }> {
  try {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { success: true, suggestions: [] };
    }

    let suggestions: LocationSuggestion[] = [];

    try {
      suggestions = await fetchPhotonSuggestions(trimmed, limit);
    } catch {
      suggestions = [];
    }

    if (suggestions.length === 0) {
      suggestions = await fetchOpenMeteoSuggestions(trimmed, limit);
    }

    return {
      success: true,
      suggestions: suggestions.slice(0, Math.max(1, Math.min(limit, 10))),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch location suggestions',
    };
  }
}

function roundAqi(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value));
}

async function fetchAqiAt(lat: number, lon: number): Promise<number> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(5)}&longitude=${lon.toFixed(5)}&hourly=us_aqi&timezone=auto&forecast_days=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`AQI fetch failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const values: unknown[] = data?.hourly?.us_aqi || [];
  const firstValid = values.find((value) => typeof value === 'number');

  if (typeof firstValid !== 'number') {
    throw new Error('No AQI values available for selected point');
  }

  return roundAqi(firstValid);
}

function minutesForActivity(distanceKm: number, activity: 'jogging' | 'cycling' | 'walking'): number {
  const speed = activity === 'cycling' ? 18 : activity === 'jogging' ? 8 : 5;
  const hours = distanceKm / speed;
  return Math.max(5, Math.round(hours * 60));
}

function toKmLabel(distanceKm: number): string {
  return `${distanceKm.toFixed(1)} km`;
}

function toTimeLabel(minutes: number): string {
  return `${minutes} min`;
}

function samplePathPoints(path: { latitude: number; longitude: number }[], sampleCount: number): { latitude: number; longitude: number }[] {
  if (path.length <= sampleCount) {
    return path;
  }

  const result: { latitude: number; longitude: number }[] = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const ratio = i / (sampleCount - 1);
    const idx = Math.round(ratio * (path.length - 1));
    result.push(path[idx]);
  }

  return result;
}

async function fetchOsrmRoutes(from: Coord, to: Coord): Promise<OsrmRoute[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?alternatives=true&steps=false&overview=full&geometries=geojson`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OSRM route lookup failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const routes: OsrmRoute[] = Array.isArray(data?.routes) ? data.routes : [];

  return routes.filter((route) => Array.isArray(route.geometry?.coordinates) && route.geometry!.coordinates!.length > 1);
}

async function buildRoute(
  id: string,
  name: string,
  route: OsrmRoute,
  from: Coord,
  to: Coord,
  activity: 'jogging' | 'cycling' | 'walking'
): Promise<AqiRoute> {
  const path = (route.geometry?.coordinates || []).map(([lon, lat]) => ({
    latitude: lat,
    longitude: lon,
  }));

  if (path.length < 2) {
    throw new Error('Route geometry is invalid');
  }

  const samples = samplePathPoints(path, 5);
  const sampleLabels = samples.map((_, idx) => `Path sample ${idx + 1}`);

  const aqiValues = await Promise.all(samples.map((pt) => fetchAqiAt(pt.latitude, pt.longitude)));
  const segments = aqiValues.map((aqi, i) => ({ name: sampleLabels[i], aqi }));
  const avgAqi = roundAqi(aqiValues.reduce((sum, n) => sum + n, 0) / aqiValues.length);
  const maxAqi = Math.max(...aqiValues);

  const totalDistanceKm = (route.distance || 0) / 1000;
  const totalMinutes = minutesForActivity(totalDistanceKm, activity);
  const midPoint = path[Math.floor(path.length / 2)];

  return {
    id,
    name,
    dist: toKmLabel(totalDistanceKm),
    time: toTimeLabel(totalMinutes),
    avgAqi,
    maxAqi,
    segments,
    from: { latitude: from.lat, longitude: from.lon, label: from.label },
    to: { latitude: to.lat, longitude: to.lon, label: to.label },
    via: { latitude: midPoint.latitude, longitude: midPoint.longitude, label: 'Route midpoint' },
    path,
  };
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
    const from = options?.fromCoord
      ? { lat: options.fromCoord.lat, lon: options.fromCoord.lon, label: options.fromCoord.label || fromText }
      : await geocodeLocation(fromText);

    const to = options?.toCoord
      ? { lat: options.toCoord.lat, lon: options.toCoord.lon, label: options.toCoord.label || toText }
      : await geocodeLocation(toText);

    const osrmRoutes = await fetchOsrmRoutes(from, to);
    if (osrmRoutes.length === 0) {
      throw new Error('No route found between selected locations');
    }

    const routes = await Promise.all(
      osrmRoutes.slice(0, 3).map((route, idx) => buildRoute(`cleanest-${idx + 1}`, `Route ${idx + 1}`, route, from, to, activity))
    );

    routes.sort((a, b) => a.avgAqi - b.avgAqi);

    return {
      success: true,
      routes,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch AQI routes',
    };
  }
}
