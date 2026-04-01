// app/register.tsx
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { registerUser } from '../utils/database';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onSwitchToLogin }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('❌ Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('❌ Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('❌ Error', 'Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('❌ Error', 'Please enter a valid email');
      return;
    }

    setLoading(true);
    const result = await registerUser(email, password, name);
    setLoading(false);

    if (result.success) {
      Alert.alert('✅ Success', result.message + '\n\nNow please login with your credentials');
      onRegisterSuccess();
    } else {
      Alert.alert('❌ Registration Failed', result.message);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ayushya</Text>
          <Text style={styles.subtitle}>Create Your Account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#aaa"
            editable={!loading}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#aaa"
            editable={!loading}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor="#aaa"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.btnRegister, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnRegisterText}>
              {loading ? 'Creating Account...' : 'Register'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity onPress={onSwitchToLogin} disabled={loading}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Login</Text>
            </Text>
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
  container: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  btnRegister: {
    backgroundColor: '#2d6a4f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnRegisterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 16,
  },
  switchText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  switchLink: {
    color: '#2d6a4f',
    fontWeight: '600',
  },
});
