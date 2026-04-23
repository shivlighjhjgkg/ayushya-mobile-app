// app/(tabs)/recs.tsx
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { GROCERY_ITEMS } from '../../utils/groceryItems';
import { getCurrentWeeklyGroceryList, getCurrentWeeklyMealPlan, getRecommendedWeeklyGroceryList, saveWeeklyGroceryList } from '../../utils/database';
import { useAuth } from '../../utils/authContext';
import { MealChoice, WeeklyMealPlanDay } from '../../utils/api';

export default function Recs() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<'grocery' | 'meals'>('grocery');
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingList, setSavingList] = useState(false);
  const [mealDays, setMealDays] = useState<WeeklyMealPlanDay[]>([]);
  const [mealPlanLoading, setMealPlanLoading] = useState(false);
  const [mealPlanError, setMealPlanError] = useState<string | null>(null);
  const [openMealSections, setOpenMealSections] = useState<Record<string, boolean>>({});
  const [recommendedItems, setRecommendedItems] = useState<string[]>([]);
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
  const [addingRecommended, setAddingRecommended] = useState(false);
  const [exportingText, setExportingText] = useState(false);

  const filteredGroceries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return GROCERY_ITEMS.reduce((acc, item, index) => {
      if (!query || item.toLowerCase().includes(query)) {
        acc.push({ item, index });
      }
      return acc;
    }, [] as { item: string; index: number }[]);
  }, [searchQuery]);

  const groceryIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    GROCERY_ITEMS.forEach((item, index) => {
      map.set(item.toLowerCase(), index);
    });
    return map;
  }, []);

  useEffect(() => {
    const loadSavedGroceryList = async () => {
      if (!user || !token) {
        return;
      }

      const response = await getCurrentWeeklyGroceryList(user._id, token);

      if (!response.success || response.items.length === 0) {
        return;
      }

      const selectedSet = new Set(response.items.map((item) => item.toLowerCase()));
      const initialChecked: Record<number, boolean> = {};

      GROCERY_ITEMS.forEach((item, index) => {
        if (selectedSet.has(item.toLowerCase())) {
          initialChecked[index] = true;
        }
      });

      setChecked(initialChecked);
    };

    loadSavedGroceryList();
  }, [user, token]);

  useEffect(() => {
    const loadMealPlan = async () => {
      if (tab !== 'meals' || !user || !token) {
        return;
      }

      setMealPlanLoading(true);
      setMealPlanError(null);

      const response = await getCurrentWeeklyMealPlan(user._id, token);

      if (!response.success || !response.plan) {
        setMealPlanLoading(false);
        setMealPlanError(response.message || 'Could not generate meal plan yet.');
        return;
      }

      setMealDays(response.plan.days || []);
      setMealPlanLoading(false);
    };

    loadMealPlan();
  }, [tab, user, token]);

  const regenerateMealPlan = async () => {
    if (!user || !token) {
      Alert.alert('Login required', 'Please login to generate meal plan.');
      return;
    }

    setMealPlanLoading(true);
    setMealPlanError(null);

    const response = await getCurrentWeeklyMealPlan(user._id, token, true);

    if (!response.success || !response.plan) {
      setMealPlanLoading(false);
      setMealPlanError(response.message || 'Could not regenerate meal plan.');
      return;
    }

    setMealDays(response.plan.days || []);
    setMealPlanLoading(false);
  };

  const renderDish = (label: string, meal: MealChoice) => {
    const matched = meal.matchedIngredients || [];
    const unmatched = meal.unmatchedIngredients || [];

    return (
      <View style={styles.mealSlot}>
        <Text style={styles.mealSlotLabel}>{label}</Text>
        <Text style={styles.mealSlotText}>{meal.name}</Text>
        <View style={styles.ingredientRow}>
          {matched.slice(0, 4).map((ingredient, idx) => (
            <View key={`m-${idx}-${ingredient}`} style={styles.ingredientChipGood}>
              <Text style={styles.ingredientChipGoodText}>{ingredient}</Text>
            </View>
          ))}
          {unmatched.slice(0, 3).map((ingredient, idx) => (
            <View key={`u-${idx}-${ingredient}`} style={styles.ingredientChipBad}>
              <Text style={styles.ingredientChipBadText}>{ingredient}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const sectionKey = (dayIndex: number, section: 'breakfast' | 'lunch' | 'dinner' | 'extras') => `${dayIndex}-${section}`;

  const toggleMealSection = (dayIndex: number, section: 'breakfast' | 'lunch' | 'dinner' | 'extras') => {
    const key = sectionKey(dayIndex, section);
    setOpenMealSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderMealSectionCard = (
    dayIndex: number,
    section: 'breakfast' | 'lunch' | 'dinner' | 'extras',
    title: string,
    dishes: { label: string; meal: MealChoice }[]
  ) => {
    const key = sectionKey(dayIndex, section);
    const isOpen = !!openMealSections[key];

    return (
      <View style={styles.mealSectionCard}>
        <TouchableOpacity style={styles.mealSectionHeader} onPress={() => toggleMealSection(dayIndex, section)}>
          <Text style={styles.mealSectionTitle}>{title}</Text>
          <Text style={styles.mealSectionArrow}>{isOpen ? '↑' : '›'}</Text>
        </TouchableOpacity>
        {isOpen && <View style={styles.mealSectionBody}>{dishes.map((dish) => renderDish(dish.label, dish.meal))}</View>}
      </View>
    );
  };

  const handleSaveGroceryList = async () => {
    if (!user || !token) {
      Alert.alert('Login required', 'Please login to save your grocery list.');
      return;
    }

    const selectedItems = GROCERY_ITEMS.filter((_, index) => checked[index]);

    if (selectedItems.length === 0) {
      Alert.alert('Nothing selected', 'Select at least one ingredient before saving.');
      return;
    }

    setSavingList(true);
    const response = await saveWeeklyGroceryList(user._id, selectedItems, token);
    setSavingList(false);

    if (!response.success) {
      Alert.alert('Save failed', response.message || 'Could not save grocery list.');
      return;
    }

    Alert.alert('Saved', 'Your grocery list for this week is saved.');
  };

  const handleGenerateRecommendedList = async () => {
    if (!user || !token) {
      Alert.alert('Login required', 'Please login to generate your recommended grocery list.');
      return;
    }

    setGeneratingRecommendations(true);
    const response = await getRecommendedWeeklyGroceryList(user._id, token);
    setGeneratingRecommendations(false);

    if (!response.success) {
      Alert.alert('Generation failed', response.message || 'Could not generate recommended grocery list.');
      return;
    }

    setRecommendedItems(response.items || []);
  };

  const handleAddRecommendedToCart = async () => {
    if (!user || !token) {
      Alert.alert('Login required', 'Please login to add recommended items.');
      return;
    }

    if (recommendedItems.length === 0) {
      Alert.alert('No recommendations', 'Generate a recommended grocery list first.');
      return;
    }

    const nextChecked: Record<number, boolean> = { ...checked };

    for (const item of recommendedItems) {
      const index = groceryIndexMap.get(item.toLowerCase());
      if (index !== undefined) {
        nextChecked[index] = true;
      }
    }

    const selectedItems = GROCERY_ITEMS.filter((_, index) => nextChecked[index]);

    setAddingRecommended(true);
    const response = await saveWeeklyGroceryList(user._id, selectedItems, token);
    setAddingRecommended(false);

    if (!response.success) {
      Alert.alert('Save failed', response.message || 'Could not add recommended items to cart.');
      return;
    }

    setChecked(nextChecked);
    Alert.alert('Added', 'Recommended items were added to cart and saved for this week.');
  };

  const mealChoiceText = (meal: MealChoice) => {
    const matched = meal.matchedIngredients || [];
    const unmatched = meal.unmatchedIngredients || [];

    return [
      meal.name,
      matched.length > 0 ? `Good match: ${matched.join(', ')}` : 'Good match: none',
      unmatched.length > 0 ? `Avoid/less ideal: ${unmatched.join(', ')}` : 'Avoid/less ideal: none',
    ];
  };

  const ensureMealPlan = async () => {
    if (mealDays.length > 0 || !user || !token) {
      return mealDays;
    }

    const response = await getCurrentWeeklyMealPlan(user._id, token);
    return response.success && response.plan ? response.plan.days || [] : [];
  };

  const buildWeeklyRecommendationText = (groceryItems: string[], weeklyMeals: WeeklyMealPlanDay[], generatedAt: string) => {
    const lines: string[] = [];

    lines.push('Ayushya Weekly Recommendations');
    lines.push(`Generated on: ${generatedAt}`);
    lines.push('');
    lines.push('Grocery List');
    lines.push('-------------');
    if (groceryItems.length > 0) {
      groceryItems.forEach((item, index) => {
        lines.push(`${index + 1}. ${item}`);
      });
    } else {
      lines.push('No saved grocery items found.');
    }

    if (recommendedItems.length > 0) {
      lines.push('');
      lines.push('Recommended Grocery Items');
      lines.push('--------------------------');
      recommendedItems.forEach((item, index) => {
        lines.push(`${index + 1}. ${item}`);
      });
    }

    lines.push('');
    lines.push('Weekly Meal Plan');
    lines.push('----------------');

    if (weeklyMeals.length === 0) {
      lines.push('No weekly meal plan was available to export.');
    } else {
      weeklyMeals.forEach((day) => {
        lines.push(`\n${day.day}`);
        lines.push(`Breakfast: ${mealChoiceText(day.breakfast).join(' | ')}`);
        lines.push(`Lunch Main: ${mealChoiceText(day.lunchMain).join(' | ')}`);
        lines.push(`Lunch Side: ${mealChoiceText(day.lunchSide).join(' | ')}`);
        lines.push(`Dinner Main: ${mealChoiceText(day.dinnerMain).join(' | ')}`);
        lines.push(`Dinner Side: ${mealChoiceText(day.dinnerSide).join(' | ')}`);
        lines.push(`Appetizer: ${mealChoiceText(day.appetizer).join(' | ')}`);
        lines.push(`Dessert: ${mealChoiceText(day.dessert).join(' | ')}`);
      });
    }

    return lines.join('\n');
  };

  const downloadTextFileWeb = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportText = async () => {
    if (!user || !token) {
      Alert.alert('Login required', 'Please login to export your weekly recommendation.');
      return;
    }

    setExportingText(true);

    try {
      const groceryItems = GROCERY_ITEMS.filter((_, index) => checked[index]);
      const weeklyMeals = await ensureMealPlan();
      const text = buildWeeklyRecommendationText(groceryItems, weeklyMeals, new Date().toLocaleString());
      const filename = `ayushya-weekly-recommendations-${Date.now()}.txt`;

      if (Platform.OS === 'web') {
        downloadTextFileWeb(text, filename);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: 'Weekly Recommendations TXT',
          });
        } else {
          Alert.alert('TXT created', `Saved at ${fileUri}`);
        }
      }
    } catch (error: any) {
      Alert.alert('Export failed', error?.message || 'Could not create the PDF.');
    } finally {
      setExportingText(false);
    }
  };

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

      <View style={styles.exportRow}>
        <TouchableOpacity
          style={[styles.exportBtn, exportingText && styles.saveCartBtnDisabled]}
          onPress={handleExportText}
          disabled={exportingText}
        >
          <Text style={styles.exportBtnText}>{exportingText ? 'Exporting...' : 'TXT export: weekly plan + grocery list'}</Text>
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

          <TouchableOpacity
            style={[styles.saveCartBtn, savingList && styles.saveCartBtnDisabled]}
            onPress={handleSaveGroceryList}
            disabled={savingList}
          >
            <Text style={styles.saveCartText}>{savingList ? 'Saving...' : '🛒 Save this week'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, generatingRecommendations && styles.saveCartBtnDisabled]}
            onPress={handleGenerateRecommendedList}
            disabled={generatingRecommendations}
          >
            <Text style={styles.secondaryBtnText}>{generatingRecommendations ? 'Generating...' : '✨ Generate Grocery List'}</Text>
          </TouchableOpacity>

          {recommendedItems.length > 0 && (
            <View style={styles.recommendedCard}>
              <Text style={styles.recommendedTitle}>Recommended Grocery List</Text>
              <View style={styles.recommendedListWrap}>
                {recommendedItems.map((item, idx) => (
                  <Text key={`${item}-${idx}`} style={styles.recommendedItemText}>• {item}</Text>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveCartBtn, addingRecommended && styles.saveCartBtnDisabled]}
                onPress={handleAddRecommendedToCart}
                disabled={addingRecommended}
              >
                <Text style={styles.saveCartText}>{addingRecommended ? 'Adding...' : '🛒 Add Recommended to Cart'}</Text>
              </TouchableOpacity>
            </View>
          )}

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
          <TouchableOpacity
            style={[styles.saveCartBtn, mealPlanLoading && styles.saveCartBtnDisabled]}
            onPress={regenerateMealPlan}
            disabled={mealPlanLoading}
          >
            <Text style={styles.saveCartText}>{mealPlanLoading ? 'Generating...' : '🔄 Regenerate plan'}</Text>
          </TouchableOpacity>

          {!!mealPlanError && <Text style={styles.mealPlanError}>{mealPlanError}</Text>}

          {mealDays.map((m, i: number) => (
            <View key={i} style={styles.mealDay}>
              <TouchableOpacity style={styles.mealDayHdr} onPress={() => setOpenDay(openDay === i ? null : i)}>
                <Text style={styles.mealDayName}>{m.day}</Text>
                <Text style={styles.mealDayArrow}>{openDay === i ? '↑' : '›'}</Text>
              </TouchableOpacity>
              {openDay === i && (
                <View style={styles.mealDayBody}>
                  {renderMealSectionCard(i, 'breakfast', 'Breakfast', [
                    { label: 'Breakfast', meal: m.breakfast },
                  ])}
                  {renderMealSectionCard(i, 'lunch', 'Lunch', [
                    { label: 'Lunch Main', meal: m.lunchMain },
                    { label: 'Lunch Side', meal: m.lunchSide },
                  ])}
                  {renderMealSectionCard(i, 'dinner', 'Dinner', [
                    { label: 'Dinner Main', meal: m.dinnerMain },
                    { label: 'Dinner Side', meal: m.dinnerSide },
                  ])}
                  {renderMealSectionCard(i, 'extras', 'Extras', [
                    { label: 'Appetizer', meal: m.appetizer },
                    { label: 'Dessert', meal: m.dessert },
                  ])}
                </View>
              )}
            </View>
          ))}

          {!mealPlanLoading && mealDays.length === 0 && !mealPlanError && (
            <Text style={styles.mealPlanHint}>No meal plan generated yet. Save grocery items and open this tab again.</Text>
          )}
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
  exportRow: { gap: 10, marginBottom: 14 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', marginBottom: 8 },
  searchMeta: { fontSize: 12, color: '#666', marginBottom: 12 },
  saveCartBtn: { alignSelf: 'flex-start', backgroundColor: '#4a9b5f', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  saveCartBtnDisabled: { opacity: 0.6 },
  saveCartText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  exportBtn: { alignSelf: 'stretch', backgroundColor: '#eaf4ee', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#cfe3d4' },
  exportBtnText: { color: '#2d6a4f', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  secondaryBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', borderColor: '#4a9b5f', borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  secondaryBtnText: { color: '#2d6a4f', fontWeight: '700', fontSize: 12 },
  recommendedCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e8f5ee' },
  recommendedTitle: { fontSize: 13, fontWeight: '700', color: '#2d6a4f', marginBottom: 8 },
  recommendedListWrap: { gap: 4, marginBottom: 10 },
  recommendedItemText: { fontSize: 12, color: '#333' },
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
  mealSectionCard: { borderWidth: 1, borderColor: '#e9efe9', borderRadius: 12, backgroundColor: '#fbfdfb', overflow: 'hidden' },
  mealSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  mealSectionTitle: { fontSize: 13, fontWeight: '700', color: '#2d6a4f' },
  mealSectionArrow: { fontSize: 16, color: '#87a08c' },
  mealSectionBody: { borderTopWidth: 1, borderTopColor: '#edf3ed', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  mealSlot: { gap: 2 },
  mealSlotLabel: { fontSize: 11, fontWeight: '700', color: '#4a9b5f', textTransform: 'uppercase', letterSpacing: 0.5 },
  mealSlotText: { fontSize: 14, color: '#333' },
  ingredientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  ingredientChipGood: { backgroundColor: '#e8f5ee', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  ingredientChipGoodText: { color: '#2d6a4f', fontSize: 10, fontWeight: '600' },
  ingredientChipBad: { backgroundColor: '#fdecea', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  ingredientChipBadText: { color: '#b64c2f', fontSize: 10, fontWeight: '600' },
  mealPlanError: { color: '#b64c2f', fontSize: 13, marginBottom: 8 },
  mealPlanHint: { color: '#666', fontSize: 13 },
  mealTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  mealTag: { backgroundColor: '#f0f7f2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  mealTagText: { fontSize: 11, color: '#2d6a4f', fontWeight: '600' },
});