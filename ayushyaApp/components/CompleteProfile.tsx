import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, CheckBox } from 'react-native';
import { useAuth } from '../utils/authContext';
import { updateHealthProfile } from '../utils/database';

interface CompleteProfileProps {
  onDone: () => void;
  user?: { _id: string };
  token?: string;
}

const ALLERGEN_OPTIONS = [
  'Gluten',
  'Dairy',
  'Nuts',
  'Shellfish',
  'Eggs',
  'Soy',
  'Sesame',
  'Fish',
];

export default function CompleteProfile({ onDone, user: propUser, token: propToken }: CompleteProfileProps) {
  const authContext = useAuth();
  const user = propUser || authContext.user;
  const token = propToken || authContext.token;
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set());
  const [age, setAge] = useState('');
  const [bmi, setBmi] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState<'vegetarian' | 'non-vegetarian' | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleAllergen = (allergen: string) => {
    const newSet = new Set(selectedAllergens);
    if (newSet.has(allergen)) {
      newSet.delete(allergen);
    } else {
      newSet.add(allergen);
    }
    setSelectedAllergens(newSet);
  };

  const handleSave = async () => {
    if (!user || !token) {
      console.error('❌ Missing user or token');
      Alert.alert('Error', 'User authentication failed. Please login again.');
      return;
    }

    setLoading(true);
    console.log('💾 Updating health profile for user:', user._id);
    console.log('🔐 Token available:', !!token);

    const result = await updateHealthProfile(user._id, {
      allergens: Array.from(selectedAllergens),
      age: age ? parseInt(age) : undefined,
      bmi: bmi ? parseFloat(bmi) : undefined,
      dietaryPreference: dietaryPreference || undefined,
    }, token);

    setLoading(false);

    if (result.success) {
      console.log('\u2705 Profile updated successfully');
      Alert.alert('✅ Success', 'Profile completed successfully!');
      onDone();
    } else {
      console.error('\u274c Profile update failed:', result.message);
      Alert.alert('❌ Error', result.message);
    }
  };

  const handleSkip = () => {
    console.log('\u23e9 Skipping profile completion');
    Alert.alert(
      'Skip Profile Completion?',
      'You can add this information later',
      [
        { text: 'Cancel', onPress: () => console.log('\u274c Skip cancelled') },
        {
          text: 'Skip',
          onPress: onDone,
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Add some additional health information</Text>
        </View>

        {/* Allergens Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Known Allergens</Text>
          <Text style={styles.sectionDescription}>Select any allergens you're aware of</Text>
          <View style={styles.allergensGrid}>
            {ALLERGEN_OPTIONS.map((allergen) => (
              <TouchableOpacity
                key={allergen}
                style={[
                  styles.allergenChip,
                  selectedAllergens.has(allergen) && styles.allergenChipSelected,
                ]}
                onPress={() => toggleAllergen(allergen)}
              >
                <Text
                  style={[
                    styles.allergenChipText,
                    selectedAllergens.has(allergen) && styles.allergenChipTextSelected,
                  ]}
                >
                  {selectedAllergens.has(allergen) ? '✓ ' : ''}{allergen}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dietary Preference Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preference</Text>
          <Text style={styles.sectionDescription}>Choose your preferred diet type</Text>
          <View style={styles.dietaryOptions}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                dietaryPreference === 'vegetarian' && styles.optionButtonSelected,
              ]}
              onPress={() => setDietaryPreference('vegetarian')}
            >
              <View style={[styles.radioCircle, dietaryPreference === 'vegetarian' && styles.radioCircleSelected]}>
                {dietaryPreference === 'vegetarian' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>Vegetarian</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                dietaryPreference === 'non-vegetarian' && styles.optionButtonSelected,
              ]}
              onPress={() => setDietaryPreference('non-vegetarian')}
            >
              <View style={[styles.radioCircle, dietaryPreference === 'non-vegetarian' && styles.radioCircleSelected]}>
                {dietaryPreference === 'non-vegetarian' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>Non-Vegetarian</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Age Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age</Text>
          <Text style={styles.sectionDescription}>Optional - helps personalize recommendations</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholderTextColor="#aaa"
          />
        </View>

        {/* BMI Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BMI</Text>
          <Text style={styles.sectionDescription}>Optional - your Body Mass Index</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your BMI"
            value={bmi}
            onChangeText={setBmi}
            keyboardType="decimal-pad"
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.btnSave, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.btnSaveText}>
              {loading ? 'Saving...' : 'Save & Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSkip}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.btnSkipText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f9f5',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d6a4f',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  allergensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  allergenChipSelected: {
    backgroundColor: '#2d6a4f',
    borderColor: '#2d6a4f',
  },
  allergenChipText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  allergenChipTextSelected: {
    color: '#fff',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  buttonGroup: {
    marginTop: 20,
    gap: 12,
  },
  btnSave: {
    backgroundColor: '#2d6a4f',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSkip: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btnSkipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  dietaryOptions: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    backgroundColor: '#f0f7f3',
    borderColor: '#2d6a4f',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#2d6a4f',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2d6a4f',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
