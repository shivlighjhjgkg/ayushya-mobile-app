// app/(tabs)/more.tsx
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FAMILY } from '../../utils/constants';
import { useAuth } from '../../utils/authContext';
import { getAllUsers } from '../../utils/database';

interface Dosha {
  vata: number;
  pitta: number;
  kapha: number;
}

interface MoreProps {
  dosha: Dosha;
  onLogout: () => void;
}

export default function More({ dosha: _dosha, onLogout }: MoreProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    console.log('Logout button pressed');
    // Direct logout without alert
    logout().then(() => {
      console.log('User logged out successfully');
    }).catch((error) => {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    });
  };

  const handleViewDatabase = async () => {
    try {
      const users = await getAllUsers();
      const dbContent = users
        .map((u) => `📧 ${u.email}\n   Name: ${u.name}\n   ID: ${u._id}`)
        .join('\n\n');
      Alert.alert(
        '📊 Database Users',
        dbContent || 'No users registered yet',
        [{ text: 'Close' }]
      );
    } catch (_error) {
      Alert.alert('Error', 'Failed to load database');
    }
  };
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>More</Text>
        <Text style={styles.pageSub}>Family, clinics, and your full Ayurvedic profile</Text>
      </View>

      {/* Family */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Family</Text>
        {FAMILY.map((m, i) => (
          <View key={i} style={styles.familyItem}>
            <Text style={styles.famAvatar}>{m.emoji}</Text>
            <View style={styles.famInfo}>
              <Text style={styles.famName}>{m.name}</Text>
              <Text style={styles.famDosha}>{m.dosha}</Text>
            </View>
            <View style={[styles.famStatus, m.ok ? styles.famOk : styles.famWarn]}>
              <Text style={[styles.famStatusText, m.ok ? styles.famOkText : styles.famWarnText]}>
                {m.ok ? 'On track' : 'Needs review'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Profile */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Profile</Text>
        {[
          ['Prakriti', 'Vata Dominant', ''],
          ['Vikriti', 'Vata Spiked', 'alert'],
          ['Agni', 'Low', 'warn'],
          ['Season (Ritu)', 'Shishira', ''],
          ['Region (Desha)', 'Bengaluru', ''],
          ['Satmya', 'Ghee, Rice, Dal', 'normal'],
        ].map(([label, value, type], i) => (
          <View key={i} style={styles.profileRow}>
            <Text style={styles.profileLabel}>{label}</Text>
            <Text style={[styles.profileValue, type === 'alert' ? styles.valAlert : type === 'warn' ? styles.valWarn : type === 'normal' ? styles.valNormal : {}]}>
              {value}
            </Text>
          </View>
        ))}
      </View>

      {/* Practitioners */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Find a Practitioner</Text>
        <TouchableOpacity style={styles.clinicCard} onPress={() => Alert.alert('Redirecting to Google Maps clinic search...')}>
          <Text style={styles.clinicIcon}>🏥</Text>
          <View style={styles.clinicInfo}>
            <Text style={styles.clinicName}>Nearby Ayurvedic Clinics</Text>
            <Text style={styles.clinicDet}>Bengaluru · Updated Jan 2026</Text>
          </View>
          <Text style={styles.clinicArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clinicCard} onPress={() => Alert.alert('Dr. Praveen Hegde — 9481843366')}>
          <Text style={styles.clinicIcon}>👨‍⚕️</Text>
          <View style={styles.clinicInfo}>
            <Text style={styles.clinicName}>Dr. Praveen Hegde</Text>
            <Text style={styles.clinicDet}>Ayurvedic Consultation · 9481843366</Text>
          </View>
          <Text style={styles.clinicArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Account */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.accountInfo}>
          <Text style={styles.accountLabel}>Logged in as</Text>
          <Text style={styles.accountName}>{user?.name}</Text>
          <Text style={styles.accountEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Text style={styles.btnLogoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Database */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🐛 Debug</Text>
        <TouchableOpacity style={styles.btnDebug} onPress={handleViewDatabase}>
          <Text style={styles.btnDebugText}>View All Users in Database</Text>
        </TouchableOpacity>
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  familyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  famAvatar: { fontSize: 28 },
  famInfo: { flex: 1 },
  famName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  famDosha: { fontSize: 12, color: '#888', marginTop: 2 },
  famStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  famOk: { backgroundColor: '#e8f5ee' },
  famWarn: { backgroundColor: '#fff8e1' },
  famStatusText: { fontSize: 11, fontWeight: '600' },
  famOkText: { color: '#2d6a4f' },
  famWarnText: { color: '#b7790f' },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  profileLabel: { fontSize: 13, color: '#888' },
  profileValue: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  valAlert: { color: '#c0392b', backgroundColor: '#fdecea', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  valWarn: { color: '#b7790f', backgroundColor: '#fff8e1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  valNormal: { color: '#2d6a4f', backgroundColor: '#e8f5ee', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  clinicCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  clinicIcon: { fontSize: 24 },
  clinicInfo: { flex: 1 },
  clinicName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  clinicDet: { fontSize: 12, color: '#888', marginTop: 2 },
  clinicArrow: { fontSize: 20, color: '#ccc' },
  accountInfo: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  accountLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  accountName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  accountEmail: { fontSize: 13, color: '#666', marginTop: 4 },
  btnLogout: { backgroundColor: '#fdecea', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f5ccc7' },
  btnLogoutText: { fontSize: 14, fontWeight: '600', color: '#c0392b' },
  btnDebug: { backgroundColor: '#f3e5f5', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e1bee7' },
  btnDebugText: { fontSize: 13, fontWeight: '600', color: '#6a1b9a' },
});