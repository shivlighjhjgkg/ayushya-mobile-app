const DEFAULT_SUGGESTION_LIMIT = 6;
const MAX_SUGGESTION_LIMIT = 10;
const AQI_SAMPLE_COUNT = 5;
const REQUEST_TIMEOUT_MS = 12000;

const cache = new Map();
const rateBuckets = new Map();

function normalizeQuery(value) {
  return String(value || '').trim();
}

function roundAqi(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function uniqueVariants(variants) {
  const seen = new Set();
  return variants.filter((variant) => {
    const key = String(variant || '').toLowerCase().trim();
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isIndiaResult(result) {
  const country = String(result.country || '').toLowerCase();
  return country.includes('india');
}

function toPhotonLabel(feature) {
  const name = feature?.properties?.name || '';
  const city = feature?.properties?.city || '';
  const state = feature?.properties?.state || '';
  const country = feature?.properties?.country || '';

  const parts = [name, city, state, country].map((part) => String(part).trim()).filter(Boolean);
  return parts.join(', ');
}

function hasCoords(item) {
  return typeof item?.latitude === 'number' && typeof item?.longitude === 'number';
}

function coordFromSuggestion(suggestion) {
  return {
    lat: suggestion.lat,
    lon: suggestion.lon,
    label: suggestion.label,
  };
}

function normalizeActivity(activity) {
  return ['jogging', 'cycling', 'walking'].includes(activity) ? activity : 'walking';
}

function toKmLabel(distanceKm) {
  return `${distanceKm.toFixed(1)} km`;
}

function toTimeLabel(minutes) {
  return `${minutes} min`;
}

function minutesForActivity(distanceKm, activity) {
  const speed = activity === 'cycling' ? 18 : activity === 'jogging' ? 8 : 5;
  const hours = distanceKm / speed;
  return Math.max(5, Math.round(hours * 60));
}

function samplePathPoints(path, sampleCount) {
  if (path.length <= sampleCount) {
    return path;
  }

  const result = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const ratio = i / (sampleCount - 1);
    const idx = Math.round(ratio * (path.length - 1));
    result.push(path[idx]);
  }

  return result;
}

function createCacheKey(prefix, parts) {
  return `${prefix}:${parts.map((part) => String(part)).join('|')}`;
}

function getCachedValue(key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  console.log(`[AQI cache] hit: ${key}`);
  return entry.value;
}

function setCachedValue(key, value, ttlMs) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

async function cacheResult(key, ttlMs, loader) {
  const existing = getCachedValue(key);
  if (existing !== null) {
    return existing;
  }

  const value = await loader();
  setCachedValue(key, value, ttlMs);
  return value;
}

function assertRateLimit(bucketKey, limit, windowMs) {
  const now = Date.now();
  const entry = rateBuckets.get(bucketKey);

  if (!entry || now - entry.windowStart >= windowMs) {
    rateBuckets.set(bucketKey, {
      windowStart: now,
      count: 1,
    });

    return;
  }

  if (entry.count >= limit) {
    const error = new Error('Too many AQI requests. Please wait a moment and try again.');
    error.status = 429;
    throw error;
  }

  entry.count += 1;
  rateBuckets.set(bucketKey, entry);
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPhotonSuggestions(query, limit) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${Math.max(1, Math.min(limit, MAX_SUGGESTION_LIMIT))}`;
  const data = await fetchJson(url);
  const features = Array.isArray(data?.features) ? data.features : [];

  const mapped = features
    .map((feature, index) => {
      const coords = feature?.geometry?.coordinates;
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
      };
    })
    .filter(Boolean);

  const indiaFirst = [
    ...mapped.filter((item) => item.label.toLowerCase().includes('india')),
    ...mapped.filter((item) => !item.label.toLowerCase().includes('india')),
  ];

  const dedup = new Set();
  return indiaFirst.filter((item) => {
    const key = `${item.label}_${item.lat.toFixed(5)}_${item.lon.toFixed(5)}`;
    if (dedup.has(key)) {
      return false;
    }

    dedup.add(key);
    return true;
  });
}

async function fetchGeocodeResults(query, count) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${Math.max(1, Math.min(count, MAX_SUGGESTION_LIMIT + 2))}&language=en&format=json`;
  const data = await fetchJson(url);
  return Array.isArray(data?.results) ? data.results : [];
}

async function fetchOpenMeteoSuggestions(query, limit) {
  const variants = uniqueVariants([query, `${query}, India`]);
  const allResults = (await Promise.all(variants.map((variant) => fetchGeocodeResults(variant, limit)))).flat();

  const indiaFirst = [
    ...allResults.filter(isIndiaResult),
    ...allResults.filter((result) => !isIndiaResult(result)),
  ];

  const dedup = new Set();
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
    .slice(0, limit);
}

async function geocodeLocation(query) {
  const trimmed = normalizeQuery(query);
  if (!trimmed) {
    throw new Error('Please enter a valid location');
  }

  const cacheKey = createCacheKey('aqi-geocode', [trimmed]);
  return cacheResult(cacheKey, 30 * 60 * 1000, async () => {
    try {
      const photon = await fetchPhotonSuggestions(trimmed, 1);
      if (photon.length > 0) {
        return coordFromSuggestion(photon[0]);
      }
    } catch (_error) {
      // Fall back to Open-Meteo.
    }

    const fallback = await fetchOpenMeteoSuggestions(trimmed, 1);
    if (fallback.length > 0) {
      return coordFromSuggestion(fallback[0]);
    }

    throw new Error(`Could not locate "${query}". Try choosing from suggestions.`);
  });
}

async function searchLocationSuggestions(query, limit = DEFAULT_SUGGESTION_LIMIT) {
  const trimmed = normalizeQuery(query);
  const normalizedLimit = Math.max(1, Math.min(Number(limit) || DEFAULT_SUGGESTION_LIMIT, MAX_SUGGESTION_LIMIT));

  if (trimmed.length < 2) {
    return { success: true, suggestions: [] };
  }

  const cacheKey = createCacheKey('aqi-suggestions', [trimmed, normalizedLimit]);
  return cacheResult(cacheKey, 10 * 60 * 1000, async () => {
    let suggestions = [];

    try {
      suggestions = await fetchPhotonSuggestions(trimmed, normalizedLimit);
    } catch (_error) {
      suggestions = [];
    }

    if (suggestions.length === 0) {
      suggestions = await fetchOpenMeteoSuggestions(trimmed, normalizedLimit);
    }

    return {
      success: true,
      suggestions: suggestions.slice(0, normalizedLimit),
    };
  });
}

async function fetchAqiAt(lat, lon) {
  const cacheKey = createCacheKey('aqi-point', [lat.toFixed(5), lon.toFixed(5)]);
  return cacheResult(cacheKey, 15 * 60 * 1000, async () => {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(5)}&longitude=${lon.toFixed(5)}&hourly=us_aqi&timezone=auto&forecast_days=1`;
    const data = await fetchJson(url);
    const values = Array.isArray(data?.hourly?.us_aqi) ? data.hourly.us_aqi : [];
    const firstValid = values.find((value) => typeof value === 'number');

    if (typeof firstValid !== 'number') {
      throw new Error('No AQI values available for selected point');
    }

    return roundAqi(firstValid);
  });
}

async function fetchOsrmRoutes(from, to) {
  const cacheKey = createCacheKey('aqi-osrm', [from.lat.toFixed(5), from.lon.toFixed(5), to.lat.toFixed(5), to.lon.toFixed(5)]);
  return cacheResult(cacheKey, 10 * 60 * 1000, async () => {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?alternatives=true&steps=false&overview=full&geometries=geojson`;
    const data = await fetchJson(url);
    const routes = Array.isArray(data?.routes) ? data.routes : [];

    return routes.filter((route) => Array.isArray(route.geometry?.coordinates) && route.geometry.coordinates.length > 1);
  });
}

async function buildRoute(id, name, route, from, to, activity) {
  const path = (route.geometry?.coordinates || []).map(([lon, lat]) => ({
    latitude: lat,
    longitude: lon,
  }));

  if (path.length < 2) {
    throw new Error('Route geometry is invalid');
  }

  const samples = samplePathPoints(path, AQI_SAMPLE_COUNT);
  const sampleLabels = samples.map((_, idx) => `Path sample ${idx + 1}`);
  const aqiValues = await Promise.all(samples.map((point) => fetchAqiAt(point.latitude, point.longitude)));
  const segments = aqiValues.map((aqi, idx) => ({ name: sampleLabels[idx], aqi }));
  const avgAqi = roundAqi(aqiValues.reduce((sum, value) => sum + value, 0) / aqiValues.length);
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

function normalizeCoordInput(input, fallbackLabel) {
  if (!input || typeof input.lat !== 'number' || typeof input.lon !== 'number') {
    return null;
  }

  return {
    lat: input.lat,
    lon: input.lon,
    label: input.label || fallbackLabel,
  };
}

async function getAqiRouteRecommendations(fromText, toText, activity, options = {}) {
  const normalizedActivity = normalizeActivity(activity);
  const cacheKey = createCacheKey('aqi-routes', [
    normalizeQuery(fromText),
    normalizeQuery(toText),
    normalizedActivity,
    JSON.stringify(options?.fromCoord || null),
    JSON.stringify(options?.toCoord || null),
  ]);

  return cacheResult(cacheKey, 10 * 60 * 1000, async () => {
    const from = normalizeCoordInput(options.fromCoord, fromText) || (await geocodeLocation(fromText));
    const to = normalizeCoordInput(options.toCoord, toText) || (await geocodeLocation(toText));

    const osrmRoutes = await fetchOsrmRoutes(from, to);
    if (osrmRoutes.length === 0) {
      throw new Error('No route found between selected locations');
    }

    const routes = await Promise.all(
      osrmRoutes.slice(0, 3).map((route, index) => buildRoute(`cleanest-${index + 1}`, `Route ${index + 1}`, route, from, to, normalizedActivity))
    );

    routes.sort((a, b) => a.avgAqi - b.avgAqi);

    return {
      success: true,
      routes,
    };
  });
}

module.exports = {
  searchLocationSuggestions,
  getAqiRouteRecommendations,
  assertRateLimit,
};