// app/(tabs)/pairing.tsx
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFoodPairsForDosha } from '../../utils/foodPairing';

interface PairingProps {
  dosha?: {
    vata: number;
    pitta: number;
    kapha: number;
  };
}

export default function Pairing({ dosha }: PairingProps) {
  const { pairs, state } = useMemo(() => getFoodPairsForDosha(dosha), [dosha]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Food Pairing</Text>
        <Text style={styles.pageSub}>What works together — and what to avoid</Text>
        <Text style={styles.stateText}>
          Active dosha state: Vata {state.vata} | Pitta {state.pitta} | Kapha {state.kapha}
        </Text>
      </View>
      <View style={styles.grid}>
        {pairs.map((p, i) => (
          <View key={i} style={styles.pairCard}>
            <View style={[styles.pairBadge, p.good ? styles.badgeGood : styles.badgeBad]}>
              <Text style={[styles.pairBadgeText, p.good ? styles.badgeGoodText : styles.badgeBadText]}>
                {p.good ? '✓ Great Pair' : '✕ Avoid Together'}
              </Text>
            </View>
            <View style={styles.pairFoods}>
              <Text style={styles.pairFood}>{p.a}</Text>
              <Text style={styles.pairOp}>{p.good ? '+' : '✕'}</Text>
              <Text style={styles.pairFood}>{p.b}</Text>
            </View>
            <Text style={styles.pairWhy}>{p.why}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f9f5' },
  scroll: { padding: 16, paddingBottom: 32 },
  pageHeader: { marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  pageSub: { fontSize: 13, color: '#888', marginTop: 4 },
  stateText: { fontSize: 12, color: '#5c6b63', marginTop: 8, fontWeight: '600' },
  grid: { gap: 12 },
  pairCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  pairBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  badgeGood: { backgroundColor: '#e8f5ee' },
  badgeBad: { backgroundColor: '#fdecea' },
  pairBadgeText: { fontSize: 12, fontWeight: '700' },
  badgeGoodText: { color: '#2d6a4f' },
  badgeBadText: { color: '#c0392b' },
  pairFoods: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  pairFood: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  pairOp: { fontSize: 18, color: '#aaa', fontWeight: '700' },
  pairWhy: { fontSize: 13, color: '#666', lineHeight: 18 },
});