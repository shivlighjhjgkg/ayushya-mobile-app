// app/(tabs)/satmya.tsx
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from '../../components/Toast';
import { LOG_HISTORY } from '../../utils/constants';

type FeedbackType = 'good' | 'neutral' | 'bad';
type MealType = 'breakfast' | 'lunch' | 'dinner';

interface LogEntry {
  meal: string;
  food: string;
  fb: FeedbackType;
}

const fbIcon: Record<FeedbackType, string> = { good: '😊', neutral: '😐', bad: '😕' };

export default function Satmya() {
  const [meal, setMeal] = useState<MealType>('breakfast');
  const [food, setFood] = useState<string>('');
  const [fb, setFb] = useState<FeedbackType | null>(null);
  const [toast, setToast] = useState<boolean>(false);
  const [history, setHistory] = useState<LogEntry[]>(LOG_HISTORY as LogEntry[]);

  const submit = () => {
    if (!food || !fb) return;
    setHistory((h) => [{ meal: meal.charAt(0).toUpperCase() + meal.slice(1), food, fb }, ...h]);
    setFood('');
    setFb(null);
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  };

  return (
    <View style={{ flex: 1 }}>
      <Toast msg="Logged! Your satmya profile has been updated." show={toast} />
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Daily Log</Text>
          <Text style={styles.pageSub}>Track what you eat — build your personal satmya over time</Text>
        </View>

        {/* Meal Tabs */}
        <View style={styles.mealTabs}>
          {([['breakfast', '🌅', 'Breakfast'], ['lunch', '☀️', 'Lunch'], ['dinner', '🌙', 'Dinner']] as [MealType, string, string][]).map(([k, ic, lb]) => (
            <TouchableOpacity key={k} style={[styles.mealTab, meal === k && styles.mealTabActive]} onPress={() => setMeal(k)}>
              <Text style={styles.mealTabIcon}>{ic}</Text>
              <Text style={[styles.mealTabLabel, meal === k && styles.mealTabLabelActive]}>{lb}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Log Form */}
        <View style={styles.card}>
          <Text style={styles.formLabel}>What did you eat?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ghee rice, banana, dal…"
            value={food}
            onChangeText={setFood}
            placeholderTextColor="#aaa"
          />
          <Text style={styles.formLabel}>How did it feel?</Text>
          <View style={styles.fbRow}>
            {([['good', '😊', 'Felt good'], ['neutral', '😐', 'Neutral'], ['bad', '😕', "Didn't suit"]] as [FeedbackType, string, string][]).map(([k, ic, lb]) => (
              <TouchableOpacity
                key={k}
                style={[styles.fbBtn, fb === k && (k === 'good' ? styles.fbGood : k === 'neutral' ? styles.fbNeutral : styles.fbBad)]}
                onPress={() => setFb(k)}
              >
                <Text style={styles.fbIcon}>{ic}</Text>
                <Text style={styles.fbLabel}>{lb}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, (!food || !fb) && { opacity: 0.4 }]}
            disabled={!food || !fb}
            onPress={submit}
          >
            <Text style={styles.saveBtnText}>Save Log</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        <View style={styles.historyWrap}>
          <Text style={styles.historyTitle}>Recent Logs</Text>
          {history.map((h, i) => (
            <View key={i} style={styles.histItem}>
              <View style={styles.histLeft}>
                <Text style={styles.histMeal}>{h.meal}</Text>
                <Text style={styles.histFood}>{h.food}</Text>
              </View>
              <Text style={styles.histFb}>{fbIcon[h.fb]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f9f5' },
  scroll: { padding: 16, paddingBottom: 32 },
  pageHeader: { marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  pageSub: { fontSize: 13, color: '#888', marginTop: 4 },
  mealTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mealTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0' },
  mealTabActive: { backgroundColor: '#4a9b5f', borderColor: '#4a9b5f' },
  mealTabIcon: { fontSize: 18, marginBottom: 2 },
  mealTabLabel: { fontSize: 12, color: '#666' },
  mealTabLabelActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#333', marginBottom: 16, backgroundColor: '#fafafa' },
  fbRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  fbBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  fbGood: { borderColor: '#4a9b5f', backgroundColor: '#f0f7f2' },
  fbNeutral: { borderColor: '#f0b930', backgroundColor: '#fffbf0' },
  fbBad: { borderColor: '#e8763a', backgroundColor: '#fff5f0' },
  fbIcon: { fontSize: 20, marginBottom: 2 },
  fbLabel: { fontSize: 11, color: '#666' },
  saveBtn: { backgroundColor: '#4a9b5f', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  historyWrap: { gap: 8 },
  historyTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  histItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  histLeft: { gap: 2 },
  histMeal: { fontSize: 11, fontWeight: '700', color: '#4a9b5f', textTransform: 'uppercase', letterSpacing: 0.5 },
  histFood: { fontSize: 14, color: '#333' },
  histFb: { fontSize: 22 },
});