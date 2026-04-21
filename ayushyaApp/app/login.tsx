// app/login.tsx
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { loginUser, needsQuiz } from '../utils/database';
import { useAuth } from '../utils/authContext';

interface LoginProps {
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
}

export default function Login({ onLoginSuccess, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    console.log('🔘 Login button clicked');
    if (!email.trim() || !password.trim()) {
      console.log('❌ Email or password empty');
      Alert.alert('❌ Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await loginUser(email, password);
    
    if (result.success && result.user && result.token) {
      console.log('🎉 Login successful, checking quiz status...');
      
      // Check if user needs to take quiz
      const quizNeeded = await needsQuiz(result.user._id, result.token);
      
      // Set quizCompleted based on whether quiz is needed
      result.user.quizCompleted = !quizNeeded;
      
      await login(result.user, result.token);
      Alert.alert('✅ Success', result.message);
      onLoginSuccess();
    } else {
      console.log('❌ Login failed:', result.message);
      Alert.alert('❌ Login Failed', result.message);
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ayushya</Text>
          <Text style={styles.subtitle}>Welcome Back</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#aaa"
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

          <TouchableOpacity
            style={[styles.btnLogin, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnLoginText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity onPress={onSwitchToRegister} disabled={loading}>
            <Text style={styles.switchText}>
              Don&apos;t have an account? <Text style={styles.switchLink}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Demo Credentials</Text>
          <Text style={styles.demoText}>Email: test@example.com</Text>
          <Text style={styles.demoText}>Password: password123</Text>
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
  btnLogin: {
    backgroundColor: '#2d6a4f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnLoginText: {
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
  demo: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2d6a4f',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d6a4f',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
});
