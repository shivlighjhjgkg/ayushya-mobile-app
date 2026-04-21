// app/(tabs)/recs.tsx
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WEEKLY_MEALS } from '../../utils/constants';
import { GROCERY_ITEMS } from '../../utils/groceryItems';

export default function Recs() {
  const [tab, setTab] = useState<'grocery' | 'meals'>('grocery');
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroceries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return GROCERY_ITEMS.reduce((acc, item, index) => {
      if (!query || item.toLowerCase().includes(query)) {
        acc.push({ item, index });
      }
      return acc;
    }, [] as { item: string; index: number }[]);
  }, [searchQuery]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Weekly Recommendations</Text>
        <Text style={styles.pageSub}>Personalised for Vata · Shishira · Bengaluru · your satmya</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'grocery' && styles.tabBtnActive]} onPress={() => setTab('grocery')}>
          <Text style={[styles.tabBtnText, tab === 'grocery' && styles.tabBtnTextActive]}>🛒 Grocery List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'meals' && styles.tabBtnActive]} onPress={() => setTab('meals')}>
          <Text style={[styles.tabBtnText, tab === 'meals' && styles.tabBtnTextActive]}>🍲 Meal Plan</Text>
        </TouchableOpacity>
      </View>

      {tab === 'grocery' && (
        <View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search grocery items..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Text style={styles.searchMeta}>
            Showing {filteredGroceries.length} of {GROCERY_ITEMS.length} items
          </Text>

          <View style={styles.groceryGrid}>
            {filteredGroceries.map(({ item, index }) => (
            <TouchableOpacity
              key={`${index}-${item}`}
              style={[styles.groceryItem, checked[index] && styles.groceryItemChecked]}
              onPress={() => setChecked((p) => ({ ...p, [index]: !p[index] }))}
            >
              <View style={[styles.gCheck, checked[index] && styles.gCheckDone]}>
                <Text style={styles.gCheckText}>{checked[index] ? '✓' : ''}</Text>
              </View>
              <Text style={[styles.gName, checked[index] && styles.gNameChecked]}>{item}</Text>
            </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {tab === 'meals' && (
        <View style={styles.mealList}>
          {WEEKLY_MEALS.map((m, i: number) => (
            <View key={i} style={styles.mealDay}>
              <TouchableOpacity style={styles.mealDayHdr} onPress={() => setOpenDay(openDay === i ? null : i)}>
                <Text style={styles.mealDayName}>{m.day}</Text>
                <Text style={styles.mealDayArrow}>{openDay === i ? '↑' : '›'}</Text>
              </TouchableOpacity>
              {openDay === i && (
                <View style={styles.mealDayBody}>
                  <View style={styles.mealSlot}>
                    <Text style={styles.mealSlotLabel}>Lunch</Text>
                    <Text style={styles.mealSlotText}>{m.lunch}</Text>
                  </View>
                  <View style={styles.mealSlot}>
                    <Text style={styles.mealSlotLabel}>Dinner</Text>
                    <Text style={styles.mealSlotText}>{m.dinner}</Text>
                  </View>
                  <View style={styles.mealTags}>
                    {m.tags.map((t: string, j: number) => (
                      <View key={j} style={styles.mealTag}>
                        <Text style={styles.mealTagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f9f5' },
  scroll: { padding: 16, paddingBottom: 32 },
  pageHeader: { marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  pageSub: { fontSize: 13, color: '#888', marginTop: 4 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0' },
  tabBtnActive: { backgroundColor: '#4a9b5f', borderColor: '#4a9b5f' },
  tabBtnText: { fontSize: 14, color: '#666', fontWeight: '600' },
  tabBtnTextActive: { color: '#fff' },
  searchInput: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', marginBottom: 8 },
  searchMeta: { fontSize: 12, color: '#666', marginBottom: 12 },
  groceryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  groceryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, gap: 8, borderWidth: 1.5, borderColor: '#e0e0e0', minWidth: '45%' },
  groceryItemChecked: { backgroundColor: '#f0f7f2', borderColor: '#4a9b5f' },
  gCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  gCheckDone: { backgroundColor: '#4a9b5f', borderColor: '#4a9b5f' },
  gCheckText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  gName: { fontSize: 13, color: '#333' },
  gNameChecked: { textDecorationLine: 'line-through', color: '#999' },
  mealList: { gap: 10 },
  mealDay: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  mealDayHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  mealDayName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  mealDayArrow: { fontSize: 18, color: '#aaa' },
  mealDayBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  mealSlot: { gap: 2 },
  mealSlotLabel: { fontSize: 11, fontWeight: '700', color: '#4a9b5f', textTransform: 'uppercase', letterSpacing: 0.5 },
  mealSlotText: { fontSize: 14, color: '#333' },
  mealTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  mealTag: { backgroundColor: '#f0f7f2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  mealTagText: { fontSize: 11, color: '#2d6a4f', fontWeight: '600' },
});