// utils/database.ts
import * as bcrypt from 'bcryptjs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  createdAt: string;
  dosha?: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  quizCompleted?: boolean;
}

// Initialize database
export async function initDatabase() {
  try {
    // Initialize users if doesn't exist
    const existingUsers = await AsyncStorage.getItem('users_db');
    if (!existingUsers) {
      await AsyncStorage.setItem('users_db', JSON.stringify([]));
    }
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Get all users from storage
async function getAllUsersFromStorage(): Promise<User[]> {
  try {
    const data = await AsyncStorage.getItem('users_db');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save all users to storage
async function saveUsersToStorage(users: User[]): Promise<void> {
  try {
    await AsyncStorage.setItem('users_db', JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

// Register user
export async function registerUser(email: string, password: string, name: string): Promise<{ success: boolean; message: string }> {
  try {
    const hashedPassword = await hashPassword(password);
    const users = await getAllUsersFromStorage();

    if (users.some((u) => u.email === email)) {
      return { success: false, message: 'Email already registered' };
    }

    const newUser: User = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await saveUsersToStorage(users);
    console.log('✅ User registered successfully:', email);
    return { success: true, message: 'Registration successful!' };
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    return { success: false, message: `Registration failed: ${error?.message || 'Unknown error'}` };
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; message: string }> {
  try {
    const users = await getAllUsersFromStorage();
    const user = users.find((u) => u.email === email);

    if (!user) {
      return { success: false, message: 'Email not found' };
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password' };
    }

    return { success: true, user, message: 'Login successful!' };
  } catch {
    return { success: false, message: 'Login failed' };
  }
}

// Get user by ID
export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await getAllUsersFromStorage();
    return users.find((u) => u.id === id) || null;
  } catch {
    return null;
  }
}

// Get all users (for debugging)
export async function getAllUsers(): Promise<User[]> {
  try {
    return getAllUsersFromStorage();
  } catch {
    return [];
  }
}

// Save quiz results to user's database
export async function saveQuizResults(
  userId: number,
  dosha: { vata: number; pitta: number; kapha: number }
): Promise<{ success: boolean; message: string }> {
  try {
    const users = await getAllUsersFromStorage();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    users[userIndex].dosha = dosha;
    users[userIndex].quizCompleted = true;

    await saveUsersToStorage(users);
    return { success: true, message: 'Quiz results saved!' };
  } catch {
    return { success: false, message: 'Failed to save quiz results' };
  }
}
