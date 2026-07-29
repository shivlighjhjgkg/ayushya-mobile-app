import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import type { AqiRoute } from '../utils/api';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface AqiRouteMapProps {
  route: AqiRoute;
  region: Region;
  fromLabel: string;
  toLabel: string;
}

export default function AqiRouteMap({ route, fromLabel, toLabel }: AqiRouteMapProps) {
  const points = route.path && route.path.length >= 2
    ? route.path
    : [route.from, route.via, route.to].filter(Boolean);

  const mapWidth = 340;
  const mapHeight = 200;
  const pad = 18;

  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.0001);
  const lonSpan = Math.max(maxLon - minLon, 0.0001);

  const projectPoint = (latitude: number, longitude: number) => {
    const x = pad + ((longitude - minLon) / lonSpan) * (mapWidth - pad * 2);
    const y = mapHeight - pad - ((latitude - minLat) / latSpan) * (mapHeight - pad * 2);
    return { x, y };
  };

  const polylinePoints = points
    .map((point) => {
      const projected = projectPoint(point.latitude, point.longitude);
      return `${projected.x},${projected.y}`;
    })
    .join(' ');

  const startPoint = projectPoint(route.from.latitude, route.from.longitude);
  const viaPoint = projectPoint(route.via.latitude, route.via.longitude);
  const endPoint = projectPoint(route.to.latitude, route.to.longitude);

  const routeColor = route.avgAqi <= 50 ? '#3f9a5e' : route.avgAqi <= 100 ? '#d7a52a' : '#d56b32';

  return (
    <View style={styles.placeholder}>
      <Text style={styles.title}>Walk preview</Text>
      <Text style={styles.sub}>This is the actual path geometry returned for the selected walk.</Text>

      <View style={styles.mapWrap}>
        <Svg width="100%" height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
          <Line x1="18" y1="18" x2="18" y2="182" stroke="#d8e0d8" strokeWidth="1" />
          <Line x1="18" y1="182" x2="322" y2="182" stroke="#d8e0d8" strokeWidth="1" />
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={routeColor}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Circle cx={startPoint.x} cy={startPoint.y} r="5" fill="#2f855a" />
          <Circle cx={viaPoint.x} cy={viaPoint.y} r="4" fill="#4a72d8" />
          <Circle cx={endPoint.x} cy={endPoint.y} r="5" fill="#c05621" />
        </Svg>
      </View>

      <View style={styles.legendRow}>
        <Text style={styles.coords}>Start: {route.from.label || fromLabel}</Text>
        <Text style={styles.coords}>Via: {route.via.label || 'Route waypoint'}</Text>
        <Text style={styles.coords}>End: {route.to.label || toLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#f4f7f4',
    borderWidth: 1,
    borderColor: '#e2e9e2',
    padding: 12,
  },
  title: { fontSize: 13, fontWeight: '700', color: '#34423b' },
  sub: { fontSize: 12, color: '#607167', marginTop: 4, marginBottom: 8 },
  mapWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dfe7df',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  legendRow: { gap: 2 },
  coords: { fontSize: 12, color: '#42524a' },
});
