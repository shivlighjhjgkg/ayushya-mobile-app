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

const BENGALURU_LOCALITY_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  koramangala: { lat: 12.9352, lon: 77.6245, label: 'Koramangala, Bengaluru' },
  indiranagar: { lat: 12.9784, lon: 77.6408, label: 'Indiranagar, Bengaluru' },
  whitefield: { lat: 12.9698, lon: 77.7499, label: 'Whitefield, Bengaluru' },
  marathahalli: { lat: 12.9569, lon: 77.7011, label: 'Marathahalli, Bengaluru' },
  jayanagar: { lat: 12.9250, lon: 77.5938, label: 'Jayanagar, Bengaluru' },
  yelahanka: { lat: 13.1005, lon: 77.5963, label: 'Yelahanka, Bengaluru' },
  malleshwaram: { lat: 13.0034, lon: 77.5706, label: 'Malleshwaram, Bengaluru' },
  electroniccity: { lat: 12.8456, lon: 77.6603, label: 'Electronic City, Bengaluru' },
};

const LOCALITY_ALIASES: Record<string, string> = {
  kormangala: 'koramangala',
  koramgala: 'koramangala',
  indranagar: 'indiranagar',
  malleswaram: 'malleshwaram',
  ecity: 'electroniccity',
  electroniccityphase1: 'electroniccity',
  electroniccityphase2: 'electroniccity',
};

function haversineKm(a: Coord, b: Coord): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function hasCoords(item: GeocodeResult): item is GeocodeResultWithCoords {
  return typeof item.latitude === 'number' && typeof item.longitude === 'number';
}

function normalizeLocalityKey(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveBengaluruLocalityFallback(query: string): Coord | null {
  const key = normalizeLocalityKey(query);
  const aliasedKey = LOCALITY_ALIASES[key] || key;
  const exact = BENGALURU_LOCALITY_COORDS[aliasedKey];

  if (exact) {
    return {
      lat: exact.lat,
      lon: exact.lon,
      label: exact.label,
    };
  }

  return null;
}

async function fetchFirstGeocodeResult(query: string): Promise<Coord | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const first = data?.results?.[0];

  if (!first || typeof first.latitude !== 'number' || typeof first.longitude !== 'number') {
    return null;
  }

  return {
    lat: first.latitude,
    lon: first.longitude,
    label: first.name || query,
  };
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

async function fetchGeocodeResults(query: string, count: number): Promise<GeocodeResult[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${Math.max(1, Math.min(count, 12))}&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Location lookup failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
}

async function geocodeLocation(query: string): Promise<Coord> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error('Please enter a valid location');
  }

  const variants = uniqueVariants([trimmed, `${trimmed}, India`]);

  for (const variant of variants) {
    const result = await fetchFirstGeocodeResult(variant);
    if (result) {
      return result;
    }
  }

  // Last-resort typo handling for common Bengaluru locality misspellings.
  const fallback = resolveBengaluruLocalityFallback(trimmed);
  if (fallback) {
    return fallback;
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

    const variants = uniqueVariants([trimmed, `${trimmed}, India`]);
    const allResults = (
      await Promise.all(variants.map((variant) => fetchGeocodeResults(variant, Math.max(1, Math.min(limit, 10)))))
    ).flat();

    const indiaFirst = [
      ...allResults.filter(isIndiaResult),
      ...allResults.filter((r) => !isIndiaResult(r)),
    ];

    const seenIds = new Set<string>();
    const suggestions = indiaFirst
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
        if (seenIds.has(key)) {
          return false;
        }
        seenIds.add(key);
        return true;
      });

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

function midpoint(a: Coord, b: Coord): Coord {
  return {
    lat: (a.lat + b.lat) / 2,
    lon: (a.lon + b.lon) / 2,
    label: `${a.label} to ${b.label}`,
  };
}

function offsetWaypoint(from: Coord, to: Coord, direction: 1 | -1): Coord {
  const mid = midpoint(from, to);
  const dLat = to.lat - from.lat;
  const dLon = to.lon - from.lon;
  const magnitude = Math.sqrt(dLat * dLat + dLon * dLon) || 0.01;
  const normLat = -dLon / magnitude;
  const normLon = dLat / magnitude;
  const offsetScale = magnitude * 0.2;

  return {
    lat: mid.lat + normLat * offsetScale * direction,
    lon: mid.lon + normLon * offsetScale * direction,
    label: direction > 0 ? 'North arc' : 'South arc',
  };
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

async function buildRoute(
  id: string,
  name: string,
  from: Coord,
  via: Coord,
  to: Coord,
  activity: 'jogging' | 'cycling' | 'walking'
): Promise<AqiRoute> {
  const segmentPoints = [midpoint(from, via), via, midpoint(via, to)];
  const segmentNames = [
    `${from.label} -> Midpoint`,
    `Around ${via.label}`,
    `Midpoint -> ${to.label}`,
  ];

  const aqiValues = await Promise.all(segmentPoints.map((pt) => fetchAqiAt(pt.lat, pt.lon)));
  const segments = aqiValues.map((aqi, i) => ({ name: segmentNames[i], aqi }));
  const avgAqi = roundAqi(aqiValues.reduce((sum, n) => sum + n, 0) / aqiValues.length);
  const maxAqi = Math.max(...aqiValues);

  const totalDistance = haversineKm(from, via) + haversineKm(via, to);
  const totalMinutes = minutesForActivity(totalDistance, activity);

  return {
    id,
    name,
    dist: toKmLabel(totalDistance),
    time: toTimeLabel(totalMinutes),
    avgAqi,
    maxAqi,
    segments,
    from: { latitude: from.lat, longitude: from.lon, label: from.label },
    to: { latitude: to.lat, longitude: to.lon, label: to.label },
    via: { latitude: via.lat, longitude: via.lon, label: via.label },
    path: [
      { latitude: from.lat, longitude: from.lon, label: from.label },
      { latitude: via.lat, longitude: via.lon, label: via.label },
      { latitude: to.lat, longitude: to.lon, label: to.label },
    ],
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

    const arcNorth = offsetWaypoint(from, to, 1);
    const arcSouth = offsetWaypoint(from, to, -1);
    const center = midpoint(from, to);

    const routes = await Promise.all([
      buildRoute('cleanest-1', 'Central corridor', from, center, to, activity),
      buildRoute('cleanest-2', 'North detour', from, arcNorth, to, activity),
      buildRoute('cleanest-3', 'South detour', from, arcSouth, to, activity),
    ]);

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
