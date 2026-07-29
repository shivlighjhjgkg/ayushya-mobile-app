// app/(tabs)/aqi.tsx
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AqiBadge from '../../components/AqiBadge';
import AqiRouteMap from '../../components/AqiRouteMap';
import { getSegmentClass } from '../../utils/aqiHelpers';
import {
  getAqiRouteRecommendations,
  searchLocationSuggestions,
  type AqiRoute,
  type LocationSuggestion,
} from '../../utils/api';

const segColor: Record<string, string> = { g: '#4a9b5f', m: '#f0b930', p: '#e8763a' };

function getRouteRegion(route: AqiRoute) {
  const points = route.path && route.path.length > 0 ? route.path : [route.from, route.via, route.to];
  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLon + maxLon) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
    longitudeDelta: Math.max((maxLon - minLon) * 1.6, 0.02),
  };
}

function getSegmentDisplayName(route: AqiRoute, segmentName: string, index: number) {
  const trimmed = String(segmentName || '').trim();

  if (trimmed && !/^path sample\s*\d*$/i.test(trimmed)) {
    return trimmed;
  }

  const point = route.path[index] || route.path[route.path.length - 1] || route.to;
  if (!point) {
    return `Waypoint ${index + 1}`;
  }

  return `Waypoint ${index + 1} (${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)})`;
}

export default function AQI() {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [activity, setActivity] = useState<string>('jogging');
  const [results, setResults] = useState<AqiRoute[] | null>(null);
  const [openRoute, setOpenRoute] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fromSuggestions, setFromSuggestions] = useState<LocationSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<LocationSuggestion[]>([]);
  const [fromSelected, setFromSelected] = useState<LocationSuggestion | null>(null);
  const [toSelected, setToSelected] = useState<LocationSuggestion | null>(null);
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (activeInput !== 'from') {
        return;
      }

      const response = await searchLocationSuggestions(from, 5);
      setFromSuggestions(response.success && response.suggestions ? response.suggestions : []);
    }, 300);

    return () => clearTimeout(handle);
  }, [from, activeInput]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (activeInput !== 'to') {
        return;
      }

      const response = await searchLocationSuggestions(to, 5);
      setToSuggestions(response.success && response.suggestions ? response.suggestions : []);
    }, 300);

    return () => clearTimeout(handle);
  }, [to, activeInput]);

  const selectFromSuggestion = (suggestion: LocationSuggestion) => {
    setFrom(suggestion.label);
    setFromSelected(suggestion);
    setFromSuggestions([]);
    setActiveInput(null);
  };

  const selectToSuggestion = (suggestion: LocationSuggestion) => {
    setTo(suggestion.label);
    setToSelected(suggestion);
    setToSuggestions([]);
    setActiveInput(null);
  };

  const search = async () => {
    if (!from || !to) return;

    setIsLoading(true);
    setErrorMsg(null);

    const response = await getAqiRouteRecommendations(
      from,
      to,
      activity as 'jogging' | 'cycling' | 'walking',
      {
        fromCoord: fromSelected && fromSelected.label === from
          ? { lat: fromSelected.lat, lon: fromSelected.lon, label: fromSelected.label }
          : undefined,
        toCoord: toSelected && toSelected.label === to
          ? { lat: toSelected.lat, lon: toSelected.lon, label: toSelected.label }
          : undefined,
      }
    );

    if (response.success && response.routes) {
      setResults(response.routes);
      setOpenRoute(null);
    } else {
      setResults(null);
      setErrorMsg(response.message || 'Could not fetch AQI route data right now.');
    }

    setIsLoading(false);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>AQI Route Planner</Text>
        <Text style={styles.pageSub}>Find the cleanest air route for your jog or ride anywhere in India</Text>
      </View>

      {/* Form Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Plan Your Route</Text>
        <Text style={styles.cardSub}>Enter your start and destination points. We will find route options with better air quality.</Text>

        <Text style={styles.inputLabel}>Starting Point</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputPin}>📍</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Koramangala, Bengaluru"
            value={from}
            onFocus={() => setActiveInput('from')}
            onChangeText={(value) => {
              setFrom(value);
              setFromSelected(null);
              setActiveInput('from');
            }}
            placeholderTextColor="#aaa"
          />
        </View>
        {activeInput === 'from' && fromSuggestions.length > 0 && (
          <View style={styles.suggestionsWrap}>
            {fromSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionRow}
                onPress={() => selectFromSuggestion(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.inputLabel}>Destination</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputPin}>🏁</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Indiranagar, Bengaluru"
            value={to}
            onFocus={() => setActiveInput('to')}
            onChangeText={(value) => {
              setTo(value);
              setToSelected(null);
              setActiveInput('to');
            }}
            placeholderTextColor="#aaa"
          />
        </View>
        {activeInput === 'to' && toSuggestions.length > 0 && (
          <View style={styles.suggestionsWrap}>
            {toSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionRow}
                onPress={() => selectToSuggestion(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.activityLabel}>Activity Type</Text>
        <View style={styles.activityRow}>
          {([['jogging', '🏃', 'Jogging'], ['cycling', '🚴', 'Cycling'], ['walking', '🚶', 'Walking']] as [string, string, string][]).map(([k, ic, lb]) => (
            <TouchableOpacity
              key={k}
              style={[styles.activityBtn, activity === k && styles.activityBtnActive]}
              onPress={() => setActivity(k)}
            >
              <Text style={styles.activityIcon}>{ic}</Text>
              <Text style={[styles.activityLabel2, activity === k && styles.activityLabelActive]}>{lb}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.findBtn, (!from || !to || isLoading) && { opacity: 0.4 }]}
          onPress={() => {
            setActiveInput(null);
            setFromSuggestions([]);
            setToSuggestions([]);
            search();
          }}
          disabled={!from || !to || isLoading}
        >
          <Text style={styles.findBtnText}>{isLoading ? 'Finding Routes...' : 'Find Best Routes'}</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {errorMsg ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 34, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.emptyTitle}>Could not fetch live AQI</Text>
          <Text style={styles.emptySub}>{errorMsg}</Text>
        </View>
      ) : !results ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🌬️</Text>
          <Text style={styles.emptyTitle}>Enter your route details</Text>
          <Text style={styles.emptySub}>Results will appear here with live AQI breakdown per segment</Text>
        </View>
      ) : (
        <View>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}><Text style={{ fontWeight: '700', color: '#1a1a1a' }}>{results.length}</Text> routes found</Text>
            <Text style={styles.resultsSorted}>Sorted by best AQI</Text>
          </View>
          {results.map((r, i) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.routeCard, i === 0 && styles.routeCardBest]}
              onPress={() => setOpenRoute(openRoute === i ? null : i)}
            >
              <View style={styles.routeHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeName}>{r.name}</Text>
                  <View style={styles.routeMeta}>
                    <Text style={styles.routeMetaItem}>📏 <Text style={{ fontWeight: '700' }}>{r.dist}</Text></Text>
                    <Text style={styles.routeMetaItem}>⏱ <Text style={{ fontWeight: '700' }}>{r.time}</Text></Text>
                  </View>
                </View>
                <AqiBadge val={r.avgAqi} />
              </View>

              {openRoute === i && (
                <View style={styles.segments}>
                  <AqiRouteMap
                    route={r}
                    region={getRouteRegion(r)}
                    fromLabel={from}
                    toLabel={to}
                  />
                  <Text style={styles.segmentsLabel}>Segment Breakdown</Text>
                  {r.segments.map((s, j) => (
                    <View style={styles.segmentRow} key={j}>
                      <Text style={styles.segmentName}>{getSegmentDisplayName(r, s.name, j)}</Text>
                      <Text style={[styles.segmentAqi, { color: segColor[getSegmentClass(s.aqi)] }]}>AQI {s.aqi}</Text>
                    </View>
                  ))}
                  <View style={styles.peakRow}>
                    <Text style={styles.peakText}>
                      Peak AQI on this route: <Text style={{ color: r.maxAqi > 50 ? '#c07a20' : '#4a9b5f', fontWeight: '700' }}>{r.maxAqi}</Text>
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f9f5' },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  pageHeader: { marginBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  pageSub: { fontSize: 13, color: '#888', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#888', marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, marginBottom: 14, backgroundColor: '#fafafa' },
  inputPin: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, height: 44, fontSize: 14, color: '#333' },
  suggestionsWrap: { marginTop: -8, marginBottom: 10, borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden' },
  suggestionRow: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  suggestionText: { fontSize: 13, color: '#333' },
  activityLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  activityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  activityBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  activityBtnActive: { borderColor: '#4a9b5f', backgroundColor: '#f0f7f2' },
  activityIcon: { fontSize: 20, marginBottom: 4 },
  activityLabel2: { fontSize: 12, color: '#666' },
  activityLabelActive: { color: '#2d6a4f', fontWeight: '600' },
  findBtn: { backgroundColor: '#4a9b5f', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  findBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyState: { backgroundColor: '#fff', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 15, color: '#888', fontWeight: '500' },
  emptySub: { fontSize: 13, color: '#aaa', marginTop: 4, textAlign: 'center' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resultsCount: { fontSize: 13, color: '#888' },
  resultsSorted: { fontSize: 11, color: '#aaa' },
  routeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  routeCardBest: { borderWidth: 1.5, borderColor: '#4a9b5f' },
  routeHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  routeMeta: { flexDirection: 'row', gap: 12 },
  routeMetaItem: { fontSize: 13, color: '#666' },
  segments: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  segmentsLabel: { fontSize: 11, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  segmentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  segmentName: { fontSize: 13, color: '#555' },
  segmentAqi: { fontSize: 13, fontWeight: '600' },
  peakRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  peakText: { fontSize: 12, color: '#888' },
});