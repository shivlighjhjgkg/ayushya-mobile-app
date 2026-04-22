import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../utils/authContext';
import { updateHealthProfile } from '../utils/database';
import { getHealthProfile } from '../utils/api';

interface ProfileData {
  age?: number;
  bmi?: number;
  dietaryPreference?: 'vegetarian' | 'non-vegetarian';
  allergens?: string[];
  desha?: string;
  region?: string;
  season?: string;
}

interface OptionItem {
  label: string;
  value: string;
}

const ALLERGEN_OPTIONS = ['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Eggs', 'Soy', 'Sesame', 'Fish'];

const REGION_OPTIONS: OptionItem[] = [
  { label: 'North India', value: 'north' },
  { label: 'East India', value: 'east' },
  { label: 'West India', value: 'west' },
  { label: 'South India', value: 'south' },
  { label: 'Global', value: 'global' },
];

const SEASON_OPTIONS: OptionItem[] = [
  { label: 'Summer', value: 'summer' },
  { label: 'Winter', value: 'winter' },
];

function getLabel(options: OptionItem[], value?: string | null) {
  return options.find((option) => option.value === value)?.label || '-';
}

interface SelectionModalProps {
  visible: boolean;
  title: string;
  options: OptionItem[];
  mode: 'single' | 'multi';
  selectedValues: string[];
  onClose: () => void;
  onConfirm: (values: string[]) => void;
}

function SelectionModal({ visible, title, options, mode, selectedValues, onClose, onConfirm }: SelectionModalProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedValues);

  useEffect(() => {
    if (visible) {
      setLocalSelection(selectedValues);
    }
  }, [visible, selectedValues]);

  const toggleValue = (value: string) => {
    if (mode === 'single') {
      onConfirm([value]);
      return;
    }

    setLocalSelection((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const confirmMulti = () => {
    onConfirm(localSelection);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isSelected = localSelection.includes(item.value);

              return (
                <TouchableOpacity
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                  onPress={() => toggleValue(item.value)}
                >
                  <View style={[styles.modalRadio, isSelected && styles.modalRadioSelected]}>
                    {isSelected ? <Text style={styles.modalRadioText}>✓</Text> : null}
                  </View>
                  <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalSecondaryBtn} onPress={onClose}>
              <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            {mode === 'multi' ? (
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={confirmMulti}>
                <Text style={styles.modalPrimaryBtnText}>Apply</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function Profile() {
  const { user, token } = useAuth();

  const [age, setAge] = useState('');
  const [bmi, setBmi] = useState('');
  const [diet, setDiet] = useState<'vegetarian' | 'non-vegetarian' | null>(null);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePicker, setActivePicker] = useState<'allergens' | 'region' | 'season' | null>(null);

  const regionLabel = useMemo(() => getLabel(REGION_OPTIONS, selectedRegion), [selectedRegion]);
  const seasonLabel = useMemo(() => getLabel(SEASON_OPTIONS, selectedSeason), [selectedSeason]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !token) {
        return;
      }

      const res = await getHealthProfile(user._id, token);
      if (res.profile) {
        const profile = res.profile as ProfileData;
        setAge(profile.age?.toString() || '');
        setBmi(profile.bmi?.toString() || '');
        setDiet(profile.dietaryPreference || null);
        setSelectedAllergens((profile.allergens || []).filter((allergen) => ALLERGEN_OPTIONS.includes(allergen)));
        setSelectedRegion((profile.desha || profile.region || null) as string | null);
        setSelectedSeason((profile.season || null) as string | null);
      }
    };

    loadProfile();
  }, [user, token]);

  const handleSave = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'Please log in again.');
      return;
    }

    setLoading(true);
    const result = await updateHealthProfile(
      user._id,
      {
        bmi: bmi ? parseFloat(bmi) : undefined,
        dietaryPreference: diet || undefined,
        allergens: selectedAllergens,
        desha: selectedRegion || undefined,
        season: selectedSeason || undefined,
      },
      token
    );
    setLoading(false);

    if (result.success) {
      Alert.alert('Saved', 'Personalisation updated successfully.');
      return;
    }

    Alert.alert('Error', result.message || 'Could not save personalisation.');
  };

  const handleDietToggle = (value: 'vegetarian' | 'non-vegetarian') => {
    setDiet(value);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Personalisation</Text>
          <Text style={styles.subtitle}>Update the values used for meal and grocery recommendations</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age</Text>
          <Text style={styles.sectionDescription}>Read only</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyValue}>{age || '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BMI</Text>
          <Text style={styles.sectionDescription}>Enter your current BMI</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 22.5"
            value={bmi}
            onChangeText={(text) => {
              const filtered = text.replace(/[^0-9.]/g, '');
              const parts = filtered.split('.');
              if (parts.length > 2) {
                setBmi(`${parts[0]}.${parts[1]}`);
              } else {
                setBmi(filtered);
              }
            }}
            keyboardType="decimal-pad"
            placeholderTextColor="#aaa"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preference</Text>
          <Text style={styles.sectionDescription}>Choose one fixed option</Text>
          <View style={styles.choiceRow}>
            <TouchableOpacity
              style={[styles.choicePill, diet === 'vegetarian' && styles.choicePillSelected]}
              onPress={() => handleDietToggle('vegetarian')}
            >
              <Text style={[styles.choicePillText, diet === 'vegetarian' && styles.choicePillTextSelected]}>
                Vegetarian
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choicePill, diet === 'non-vegetarian' && styles.choicePillSelected]}
              onPress={() => handleDietToggle('non-vegetarian')}
            >
              <Text style={[styles.choicePillText, diet === 'non-vegetarian' && styles.choicePillTextSelected]}>
                Non-Vegetarian
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desha / Region</Text>
          <Text style={styles.sectionDescription}>Use the region that matches your current location</Text>
          <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setActivePicker('region')}>
            <Text style={styles.dropdownTriggerText}>{regionLabel}</Text>
            <Text style={styles.dropdownChevron}>⌄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Season / Ritu</Text>
          <Text style={styles.sectionDescription}>Choose the current season</Text>
          <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setActivePicker('season')}>
            <Text style={styles.dropdownTriggerText}>{seasonLabel}</Text>
            <Text style={styles.dropdownChevron}>⌄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergens</Text>
          <Text style={styles.sectionDescription}>Select all that apply</Text>
          <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setActivePicker('allergens')}>
            <Text style={styles.dropdownTriggerText}>
              {selectedAllergens.length > 0 ? selectedAllergens.join(', ') : 'Select allergens'}
            </Text>
            <Text style={styles.dropdownChevron}>⌄</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save changes'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <SelectionModal
        visible={activePicker === 'allergens'}
        title="Select Allergens"
        options={ALLERGEN_OPTIONS.map((allergen) => ({ label: allergen, value: allergen }))}
        mode="multi"
        selectedValues={selectedAllergens}
        onClose={() => setActivePicker(null)}
        onConfirm={(values) => {
          setSelectedAllergens(values);
          setActivePicker(null);
        }}
      />

      <SelectionModal
        visible={activePicker === 'region'}
        title="Select Region"
        options={REGION_OPTIONS}
        mode="single"
        selectedValues={selectedRegion ? [selectedRegion] : []}
        onClose={() => setActivePicker(null)}
        onConfirm={(values) => {
          setSelectedRegion(values[0] || null);
          setActivePicker(null);
        }}
      />

      <SelectionModal
        visible={activePicker === 'season'}
        title="Select Season"
        options={SEASON_OPTIONS}
        mode="single"
        selectedValues={selectedSeason ? [selectedSeason] : []}
        onClose={() => setActivePicker(null)}
        onConfirm={(values) => {
          setSelectedSeason(values[0] || null);
          setActivePicker(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f9f5' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', lineHeight: 20 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  sectionDescription: { fontSize: 12, color: '#777', marginBottom: 10 },
  input: { borderRadius: 10, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff', color: '#333' },
  readOnlyField: { borderRadius: 10, borderWidth: 1, borderColor: '#e1e7e1', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f8faf8' },
  readOnlyValue: { fontSize: 14, color: '#333' },
  choiceRow: { flexDirection: 'row', gap: 10 },
  choicePill: { flex: 1, borderRadius: 999, borderWidth: 1.5, borderColor: '#d7e4d9', paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  choicePillSelected: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  choicePillText: { fontSize: 13, color: '#355', fontWeight: '600' },
  choicePillTextSelected: { color: '#fff' },
  dropdownTrigger: { borderRadius: 10, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownTriggerText: { fontSize: 14, color: '#333', flex: 1, paddingRight: 12 },
  dropdownChevron: { fontSize: 18, color: '#667' },
  saveBtn: { marginTop: 8, backgroundColor: '#2d6a4f', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, maxHeight: '75%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 14 },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, marginBottom: 8, backgroundColor: '#f7f9f7' },
  modalOptionSelected: { backgroundColor: '#eaf4ee' },
  modalRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#b8c7bc', alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: '#fff' },
  modalRadioSelected: { borderColor: '#2d6a4f', backgroundColor: '#2d6a4f' },
  modalRadioText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  modalOptionText: { fontSize: 14, color: '#333', fontWeight: '600' },
  modalOptionTextSelected: { color: '#2d6a4f' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalSecondaryBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d7e4d9', backgroundColor: '#fff' },
  modalSecondaryBtnText: { color: '#355', fontWeight: '700' },
  modalPrimaryBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#2d6a4f' },
  modalPrimaryBtnText: { color: '#fff', fontWeight: '700' },
});
