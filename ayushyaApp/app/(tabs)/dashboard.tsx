// app/(tabs)/dashboard.tsx
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DoshaRing from '../../components/DoshaRing';
import { RISK_FLAGS } from '../../utils/constants';

interface Dosha {
  vata: number;
  pitta: number;
  kapha: number;
}

interface DashboardProps {
  dosha: Dosha;
  onNav: (tab: string) => void;
}

export default function Dashboard({ dosha, onNav }: DashboardProps) {

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Dashboard</Text>
        <Text style={styles.pageSub}>Your daily Ayurvedic overview — Shishira · Bengaluru</Text>
      </View>

      {/* Dosha Card */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>Your Dosha</Text>
          <TouchableOpacity onPress={() => onNav('more')}>
            <Text style={styles.action}>Details →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.doshaMini}>
          <View style={styles.ringWrap}>
            <DoshaRing vata={dosha.vata} pitta={dosha.pitta} kapha={dosha.kapha} size={80} stroke={14} />
            <View style={styles.ringCenter}>
              <Text style={{ fontSize: 18 }}>💨</Text>
            </View>
          </View>
          <View style={styles.bars}>
            {([['Vata', '#e8763a', dosha.vata], ['Pitta', '#f0b930', dosha.pitta], ['Kapha', '#4a9b5f', dosha.kapha]] as [string, string, number][]).map(([n, c, v]) => (
              <View style={styles.barRow} key={n}>
                <Text style={styles.barLabel}>{n}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${v}%` as any, backgroundColor: c }]} />
                </View>
                <Text style={styles.barPct}>{v}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Lifestyle Flags */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lifestyle Flags</Text>
        {RISK_FLAGS.map((f, i) => (
          <View style={styles.flagRow} key={i}>
            <Text style={styles.flagIcon}>{f.icon}</Text>
            <View style={styles.flagBody}>
              <Text style={styles.flagTitle}>{f.title}</Text>
              <Text style={styles.flagDesc}>{f.desc}</Text>
              <View style={[styles.flagTag, f.sev === 'ok' ? styles.tagOk : f.sev === 'warn' ? styles.tagWarn : styles.tagAlert]}>
                <Text style={styles.flagTagText}>
                  {f.sev === 'ok' ? 'All good' : f.sev === 'warn' ? 'Watch this' : 'Action needed'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Access */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Access</Text>
        <View style={styles.quickActions}>
          {([['🛒', 'Grocery List', 'recs'], ['🍲', 'Meal Plan', 'recs'], ['🥗', 'Food Pairs', 'pairing'], ['🌬️', 'AQI Routes', 'aqi'], ['📝', 'Log Meal', 'satmya']] as [string, string, string][]).map(([ic, label, nav]) => (
            <TouchableOpacity key={label} style={styles.quickCard} onPress={() => onNav(nav)}>
              <Text style={styles.quickIcon}>{ic}</Text>
              <Text style={styles.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  action: { fontSize: 13, color: '#4a9b5f', fontWeight: '600' },
  doshaMini: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ringWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute' },
  bars: { flex: 1, gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 40, fontSize: 12, color: '#555' },
  barTrack: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barPct: { width: 32, fontSize: 12, color: '#555', textAlign: 'right' },
  flagRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  flagIcon: { fontSize: 22 },
  flagBody: { flex: 1 },
  flagTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  flagDesc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 6 },
  flagTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  flagTagText: { fontSize: 11, fontWeight: '600' },
  tagOk: { backgroundColor: '#e8f5ee' },
  tagWarn: { backgroundColor: '#fff8e1' },
  tagAlert: { backgroundColor: '#fdecea' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { alignItems: 'center', backgroundColor: '#f5f9f5', borderRadius: 12, padding: 12, minWidth: 72 },
  quickIcon: { fontSize: 22, marginBottom: 4 },
  quickLabel: { fontSize: 11, color: '#444', textAlign: 'center' },
});