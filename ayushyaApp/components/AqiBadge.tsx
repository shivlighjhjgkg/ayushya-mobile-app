// components/AqiBadge.tsx
import { StyleSheet, Text, View } from 'react-native';
import { getAqiClass, getAqiLabel } from '../utils/aqiHelpers';

interface AqiBadgeProps {
  val: number;
}

const colorMap: Record<string, string> = {
  good: '#4a9b5f',
  moderate: '#f0b930',
  poor: '#e8763a',
};

export default function AqiBadge({ val }: AqiBadgeProps) {
  const cls = getAqiClass(val);
  const label = getAqiLabel(val);
  const color = colorMap[cls] ?? '#888';

  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>
        Air {val}{' '}
        <Text style={styles.sub}>({label})</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  sub: {
    fontSize: 10,
    opacity: 0.7,
    fontWeight: '400',
  },
});