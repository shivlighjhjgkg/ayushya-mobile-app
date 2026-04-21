// app/result.tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import DoshaRing from '../components/DoshaRing';
import CompleteProfile from '../components/CompleteProfile';
import { DOSHA_INFO, getDominantDosha } from '../utils/doshaCalc';
import { useAuth } from '../utils/authContext';
import { saveQuizResults } from '../utils/database';

interface Dosha {
  vata: number;
  pitta: number;
  kapha: number;
}

interface ResultProps {
  dosha: Dosha;
  onContinue: () => void;
}

export default function Result({ dosha, onContinue }: ResultProps) {
  const { user, updateUserDosha, token } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const dom = getDominantDosha(dosha);
  const info = DOSHA_INFO[dom];

  // Debug logging on mount
  useEffect(() => {
    console.log('🔍 Result Component Mounted');
    console.log('👤 User:', user ? `${user.name} (${user._id})` : 'No user');
    console.log('🔑 Token:', token ? `Present (${token.substring(0, 20)}...)` : 'No token');
    console.log('📊 Dosha:', dosha);
  }, [user, token, dosha]);

  const handleContinue = async () => {
    if (!user || !token) {
      console.error('❌ Missing user or token for quiz save');
      Alert.alert('Error', 'Not authenticated. Please login again.');
      return;
    }

    setLoading(true);
    console.log('💾 Saving quiz results for user:', user._id);
    console.log('📊 Dosha scores:', dosha);
    console.log('🔐 Token available:', !!token);
    
    // Save quiz results to database
    const result = await saveQuizResults(user._id, dosha, token);
    console.log('📤 Quiz save response:', result);
    setLoading(false);

    if (result.success) {
      console.log('✅ Quiz saved successfully');
      // Don't update user context yet - wait until profile form completes
      // This keeps the form visible instead of skipping to dashboard
      setShowProfile(true);
    } else {
      console.error('❌ Quiz save failed:', result.message);
      Alert.alert('Error', result.message);
    }
  };

  // If showing profile completion form
  if (showProfile && user && token) {
    return <CompleteProfile onDone={onContinue} user={user} token={token} dosha={dosha} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Your Dosha Profile</Text>

        <View style={styles.ringWrap}>
          <DoshaRing vata={dosha.vata} pitta={dosha.pitta} kapha={dosha.kapha} size={200} stroke={24} />
          <View style={styles.ringCenter}>
            <Text style={styles.ringEmoji}>{info.emoji}</Text>
            <Text style={styles.ringLabel}>{dom} Dominant</Text>
          </View>
        </View>

        <View style={styles.bars}>
          {([['Vata', '#e8763a', dosha.vata], ['Pitta', '#f0b930', dosha.pitta], ['Kapha', '#4a9b5f', dosha.kapha]] as [string, string, number][]).map(([n, c, v]) => (
            <View style={styles.barRow} key={n}>
              <Text style={styles.barName}>{n}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${v}%` as any, backgroundColor: c }]} />
              </View>
              <Text style={styles.barPct}>{v}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Insight</Text>
          <Text style={styles.cardText}>{info.text}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.btn, loading && { opacity: 0.6 }]} 
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </Text>
        </TouchableOpacity>
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
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  ringWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringEmoji: {
    fontSize: 28,
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  bars: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barName: {
    width: 45,
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barPct: {
    width: 36,
    fontSize: 13,
    color: '#555',
    textAlign: 'right',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  btn: {
    backgroundColor: '#4a9b5f',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});