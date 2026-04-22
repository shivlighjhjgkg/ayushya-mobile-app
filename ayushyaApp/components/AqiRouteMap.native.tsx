import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
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

export default function AqiRouteMap({ route, region, fromLabel, toLabel }: AqiRouteMapProps) {
  return (
    <MapView style={styles.map} initialRegion={region} region={region} mapType="none">
      <UrlTile
        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
      />
      <Polyline
        coordinates={route.path}
        strokeWidth={5}
        strokeColor={route.avgAqi <= 50 ? '#3f9a5e' : route.avgAqi <= 100 ? '#d7a52a' : '#d56b32'}
      />
      <Marker coordinate={route.from} title="Start" description={route.from.label || fromLabel} />
      <Marker coordinate={route.via} title="Waypoint" description={route.via.label || 'Route detour'} pinColor="#4a72d8" />
      <Marker coordinate={route.to} title="Destination" description={route.to.label || toLabel} pinColor="#e05c4f" />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: 220, borderRadius: 12 },
});
