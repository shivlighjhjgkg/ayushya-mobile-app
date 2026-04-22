import { StyleSheet, Text, View } from 'react-native';
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
  return (
    <View style={styles.placeholder}>
      <Text style={styles.title}>Map preview is available on Android/iOS builds.</Text>
      <Text style={styles.sub}>Web currently shows route details and AQI breakdown only.</Text>
      <Text style={styles.coords}>Start: {route.from.label || fromLabel}</Text>
      <Text style={styles.coords}>Via: {route.via.label || 'Route waypoint'}</Text>
      <Text style={styles.coords}>End: {route.to.label || toLabel}</Text>
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
  coords: { fontSize: 12, color: '#42524a', marginBottom: 2 },
});
