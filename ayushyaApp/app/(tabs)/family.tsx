import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '../../utils/authContext';
import { createFamily, joinFamily, getFamily } from '../../utils/database';
import { Family } from '../../utils/api';

export default function FamilyScreen() {
  const { user, token } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Load family on component mount
  useEffect(() => {
    if (user && token) {
      loadFamily();
    }
  }, [user, token]);

  const loadFamily = async () => {
    if (!user || !token) return;

    try {
      setLoading(true);
      const result = await getFamily(user._id, token);

      if (result.success && result.family) {
        setFamily(result.family);
      } else {
        setFamily(null);
      }
    } catch (error) {
      console.error('Error loading family:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('Error', 'Please enter a family name');
      return;
    }

    if (!user || !token) return;

    try {
      setLoading(true);
      const result = await createFamily(user._id, familyName, token);

      if (result.success && result.family) {
        setFamily(result.family);
        setShowCreateForm(false);
        setFamilyName('');
        Alert.alert('Success', `Family created! Share this code: ${result.family.familyCode}`);
      } else {
        Alert.alert('Error', result.message || 'Failed to create family');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create family');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!familyCode.trim()) {
      Alert.alert('Error', 'Please enter a family code');
      return;
    }

    if (!user || !token) return;

    try {
      setLoading(true);
      const result = await joinFamily(user._id, familyCode, token);

      if (result.success && result.family) {
        setFamily(result.family);
        setShowJoinForm(false);
        setFamilyCode('');
        Alert.alert('Success', `Joined family: ${result.family.familyName}`);
      } else {
        Alert.alert('Error', result.message || 'Failed to join family');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join family');
    } finally {
      setLoading(false);
    }
  };

  const getDoshaColor = (dosha?: string) => {
    switch (dosha) {
      case 'vata':
        return '#e8763a';
      case 'pitta':
        return '#f0b930';
      case 'kapha':
        return '#4a9b5f';
      default:
        return '#ccc';
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>👪 Family</Text>
        <Text style={styles.pageSub}>Connect with your loved ones</Text>
      </View>

      {family ? (
        // Family exists - show members
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{family.familyName}</Text>
          <Text style={styles.familyCode}>Code: {family.familyCode}</Text>

          <Text style={styles.membersTitle}>Members ({family.members.length})</Text>

          {family.members.map((member, idx) => (
            <View key={idx} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <View
                    style={[
                      styles.roleBadge,
                      member.role === 'admin' ? styles.adminBadge : styles.memberBadge,
                    ]}
                  >
                    <Text style={styles.roleBadgeText}>{member.role === 'admin' ? '👑' : '👤'}</Text>
                  </View>
                </View>
                <Text style={styles.memberEmail}>{member.email}</Text>

                {member.doshaScores ? (
                  <View style={styles.doshaRow}>
                    {[
                      { name: 'Vata', value: member.doshaScores.vata, color: '#e8763a' },
                      { name: 'Pitta', value: member.doshaScores.pitta, color: '#f0b930' },
                      { name: 'Kapha', value: member.doshaScores.kapha, color: '#4a9b5f' },
                    ].map((d) => (
                      <View key={d.name} style={styles.doshaItem}>
                        <Text style={styles.doshaLabel}>{d.name}</Text>
                        <View style={styles.doshaBar}>
                          <View
                            style={[
                              styles.doshaFill,
                              { width: `${d.value}%`, backgroundColor: d.color },
                            ]}
                          />
                        </View>
                        <Text style={styles.doshaValue}>{d.value}%</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noDosha}>Quiz not completed</Text>
                )}

                {member.dominantDosha && (
                  <View
                    style={[
                      styles.dominantDoshaBadge,
                      { backgroundColor: getDoshaColor(member.dominantDosha) },
                    ]}
                  >
                    <Text style={styles.dominantDoshaText}>
                      {member.dominantDosha?.toUpperCase()} Prakriti
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              Alert.alert('Family Code', `Share this code with family members:\n\n${family.familyCode}`);
            }}
          >
            <Text style={styles.secondaryButtonText}>📋 Copy Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // No family - show create/join options
        <View>
          {!showCreateForm && !showJoinForm && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Join or Create a Family</Text>
              <Text style={styles.subtitle}>
                Share your Dosha profile with family and friends
              </Text>

              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 16 }]}
                onPress={() => setShowCreateForm(true)}
              >
                <Text style={styles.primaryButtonText}>➕ Create Family</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { marginTop: 12 }]}
                onPress={() => setShowJoinForm(true)}
              >
                <Text style={styles.secondaryButtonText}>🔗 Join Family</Text>
              </TouchableOpacity>
            </View>
          )}

          {showCreateForm && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create a Family</Text>

              <TextInput
                style={styles.input}
                placeholder="Family name (e.g., The Smiths)"
                placeholderTextColor="#999"
                value={familyName}
                onChangeText={setFamilyName}
                editable={!loading}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1 }]}
                  onPress={handleCreateFamily}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? '⏳ Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, { flex: 1, marginLeft: 12 }]}
                  onPress={() => {
                    setShowCreateForm(false);
                    setFamilyName('');
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showJoinForm && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Join a Family</Text>

              <TextInput
                style={styles.input}
                placeholder="Family code (6 digits)"
                placeholderTextColor="#999"
                value={familyCode}
                onChangeText={setFamilyCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1 }]}
                  onPress={handleJoinFamily}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? '⏳ Joining...' : 'Join'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, { flex: 1, marginLeft: 12 }]}
                  onPress={() => {
                    setShowJoinForm(false);
                    setFamilyCode('');
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f9f5' },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  pageHeader: { marginBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  pageSub: { fontSize: 13, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  familyCode: { fontSize: 12, color: '#999', marginBottom: 16, fontFamily: 'monospace' },
  membersTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginTop: 12, marginBottom: 8 },
  memberCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a9b5f',
  },
  memberInfo: { flex: 1 },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  memberEmail: { fontSize: 12, color: '#888', marginBottom: 8 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  adminBadge: { backgroundColor: '#fff3cd' },
  memberBadge: { backgroundColor: '#e8f5ee' },
  roleBadgeText: { fontSize: 12, fontWeight: '600' },
  doshaRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  doshaItem: { flex: 1 },
  doshaLabel: { fontSize: 10, color: '#666', marginBottom: 2 },
  doshaBar: { height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden', marginBottom: 2 },
  doshaFill: { height: '100%' },
  doshaValue: { fontSize: 10, color: '#555', fontWeight: '600' },
  noDosha: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  dominantDoshaBadge: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dominantDoshaText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  buttonRow: { flexDirection: 'row', gap: 8 },
  primaryButton: {
    backgroundColor: '#4a9b5f',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4a9b5f',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: '#4a9b5f' },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
});
