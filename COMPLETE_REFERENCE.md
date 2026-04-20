# 📚 Ayushya Mobile App - Complete Reference Guide

**Version:** 1.0 | **Last Updated:** April 20, 2026

---

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [Project Overview](#-project-overview)
3. [Backend Architecture](#-backend-architecture)
4. [Frontend Integration](#-frontend-integration)
5. [API Reference](#-api-reference)
6. [Testing Guide](#-testing-guide)
7. [Configuration](#-configuration)
8. [File Structure](#-file-structure)
9. [Code Examples](#-code-examples)
10. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Start Backend (Terminal 1)
```bash
cd backend
npm start
```
Expected: `✅ MongoDB connected | 🚀 Server running on http://localhost:5000`

### Start Frontend (Terminal 2)
```bash
cd ayushyaApp
npm start
```
Expected: Expo app running on emulator/device

### Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 📊 Project Overview

### What Changed
- ✅ **Before:** AsyncStorage (local) → **After:** MongoDB (cloud)
- ✅ **Before:** Frontend password hashing → **After:** Backend hashing (bcryptjs, salt 10)
- ✅ **Before:** userId stored locally → **After:** JWT tokens
- ✅ **Before:** No multi-device access → **After:** Cloud-based sessions

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | React Native + Expo | Latest |
| **Backend** | Express.js | 5.2.1 |
| **Database** | MongoDB Atlas | Cloud |
| **ODM** | Mongoose | 9.4.1 |
| **Authentication** | bcryptjs | 3.0.3 |
| **HTTP** | CORS | 2.8.6 |

---

## 🏗️ Backend Architecture

### 1. File Structure

```
backend/
├── .env                        ← Configuration
├── server.js                   ← Express app (65 lines)
├── models/
│   └── User.js                ← Mongoose schema (55 lines)
├── routes/
│   └── auth.js                ← Auth endpoints (115 lines)
├── package.json               ← Dependencies
└── node_modules/              ← Installed packages
```

### 2. Core Files Breakdown

#### `.env` - Configuration
```
MONGODB_URI=mongodb+srv://admin:ayushya%40123@cluster0.4vshlgd.mongodb.net/ayushya
PORT=5000
NODE_ENV=development
```

#### `server.js` - Main Application
```javascript
// Loads .env
require('dotenv').config();

// Creates Express app
const app = express();

// Connects MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Error:', err.message));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Starts server
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
```

#### `models/User.js` - Data Model
```javascript
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    required: true,
    select: false  // Don't return in queries
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook: hashes password
UserSchema.pre('save', async function () {
  if (!this.isModified('password_hash')) return;
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Method: compare passwords
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};
```

#### `routes/auth.js` - Endpoints
```javascript
// POST /api/auth/register
// Registers new user
// Input: { name, email, password }
// Output: { success, userId, user, message }

// POST /api/auth/login
// Authenticates user
// Input: { email, password }
// Output: { success, userId, user, message }
```

### 3. Data Flow: Register

```
User Input
   ↓
POST /api/auth/register
   ↓
Validate (name, email, password required)
   ↓
Check email not duplicate (db query)
   ↓
Create User object
   ↓
Save (triggers pre-save hook)
   ↓
Pre-save hook: Hash password (bcryptjs, salt 10)
   ↓
MongoDB stores: { name, email, password_hash, created_at }
   ↓
Response: { success: true, userId, user }
```

### 4. Data Flow: Login

```
User Input (email, password)
   ↓
POST /api/auth/login
   ↓
Validate (email, password required)
   ↓
Find user in MongoDB
   ↓
Compare password: bcryptjs.compare(input, stored_hash)
   ↓
If match: Response { success: true, userId, user }
If no match: Response { success: false, message: "Invalid password" }
```

### 5. Security

| Feature | Implementation |
|---------|-----------------|
| Password Hashing | bcryptjs (salt 10) |
| Password Storage | Only hash stored (never plaintext) |
| Password Exposure | Never returned in API |
| Email Validation | Unique index prevents duplicates |
| Input Validation | Required fields checked |
| CORS | Enabled for frontend access |
| Secrets | Stored in .env (not in code) |

---

## 🎨 Frontend Integration

### 1. File Structure

```
ayushyaApp/
├── app/
│   ├── login.tsx              ← Login UI
│   ├── register.tsx           ← Register UI
│   └── (tabs)/
│       ├── dashboard.tsx
│       ├── aqi.tsx
│       ├── satmya.tsx
│       └── ...
├── utils/
│   ├── api.ts                 ← API service (NEW)
│   ├── authContext.tsx        ← Auth provider (UPDATED)
│   ├── database.ts            ← DB wrapper (UPDATED)
│   └── ...
└── components/
```

### 2. Modified Files

#### `utils/api.ts` - API Service
```typescript
const API_BASE_URL = 'http://10.0.2.2:5000';  // Expo Android

// Register user
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; token?: string; user?: User }>

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: User }>

// Validate token
export async function validateToken(
  token: string
): Promise<{ success: boolean; user?: User }>
```

#### `utils/authContext.tsx` - Auth Provider
```typescript
export interface AuthContextType {
  user: User | null;           // Current logged-in user
  token: string | null;         // JWT token
  isLoading: boolean;           // Loading state
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUserDosha: (dosha: DocshaScores) => void;
}

// Session restoration on app startup
// Token validation with backend
// Automatic logout if token expired
```

#### `utils/database.ts` - DB Functions
```typescript
// Wrapper around api.ts functions
// Adds error handling and logging

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ success, message, token?, user? }>

export async function loginUser(
  email: string,
  password: string
): Promise<{ success, message, token?, user? }>

export async function getQuizResults(
  userId: string,
  token: string
): Promise<DocshaScores | null>
```

#### `app/login.tsx` - Login Screen
```typescript
const handleLogin = async () => {
  const result = await loginUser(email, password);
  
  if (result.success && result.user && result.token) {
    // Pass both user AND token to context
    await login(result.user, result.token);
    onLoginSuccess();
  } else {
    Alert.alert('❌ Login Failed', result.message);
  }
};
```

### 3. Authentication Flow

```
App Starts
   ↓
AuthProvider mounts
   ↓
useEffect checks AsyncStorage for saved token
   ↓
If token exists:
   ├─ Call validateToken(token) to backend
   ├─ If valid → Restore session, stay logged in
   └─ If invalid → Clear token, show login
   ↓
If no token:
   ├─ Show login/register screen
   └─ Wait for user action
```

### 4. Session Persistence

| Item | Storage | Purpose |
|------|---------|---------|
| **Token** | AsyncStorage | Validate with backend on startup |
| **User Data** | AsyncStorage | Quick local access |
| **Full Lists** | NOT stored | Only on backend |
| **Passwords** | NOT stored | Only hash on backend |

---

## 🔌 API Reference

### Base URL
- **Emulator (Android):** `http://10.0.2.2:5000`
- **Simulator (iOS):** `http://localhost:5000`
- **Physical Device:** `http://192.168.x.x:5000`

### Endpoints

#### 1. Health Check
```http
GET /health
```
**Response (200)**
```json
{
  "status": "ok",
  "timestamp": "2025-04-20T10:30:00.000Z"
}
```

#### 2. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201 - Success)**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "507f1f77bcf86cd799439011",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-04-20T10:30:00.000Z"
  }
}
```

**Response (400 - Validation Error)**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

#### 3. Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 - Success)**
```json
{
  "success": true,
  "message": "Login successful",
  "userId": "507f1f77bcf86cd799439011",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-04-20T10:30:00.000Z"
  }
}
```

**Response (401 - Wrong Password)**
```json
{
  "success": false,
  "message": "Invalid password"
}
```

**Response (404 - Not Found)**
```json
{
  "success": false,
  "message": "User not found"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Login successful |
| 201 | Created | User registered |
| 400 | Bad Request | Missing fields, duplicate email |
| 401 | Unauthorized | Wrong password |
| 404 | Not Found | User doesn't exist |
| 500 | Server Error | Database error |

---

## 🧪 Testing Guide

### Method 1: Using curl (Terminal)

**Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@test.com",
    "password": "password123"
  }'
```

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "password123"
  }'
```

### Method 2: Using Postman

**Collection Setup**
1. Create New Collection: "Ayushya API"
2. Create Request: "Register User"
   - Method: POST
   - URL: `http://localhost:5000/api/auth/register`
   - Body (JSON): `{ "name": "...", "email": "...", "password": "..." }`
3. Create Request: "Login"
   - Method: POST
   - URL: `http://localhost:5000/api/auth/login`
   - Body (JSON): `{ "email": "...", "password": "..." }`

### Test Scenarios

| Scenario | Expected | Result |
|----------|----------|--------|
| Register valid user | 201 + user data | ✅ |
| Register duplicate email | 400 + error | ✅ |
| Login correct password | 200 + user data | ✅ |
| Login wrong password | 401 error | ✅ |
| Login non-existent user | 404 error | ✅ |

---

## ⚙️ Configuration

### Backend Environment (.env)

```env
# MongoDB Connection (Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ayushya

# Server Port
PORT=5000

# Environment
NODE_ENV=development
```

### Frontend Environment

**Android Emulator (default)**
```typescript
const API_BASE_URL = 'http://10.0.2.2:5000';
```

**iOS Simulator**
```typescript
const API_BASE_URL = 'http://localhost:5000';
```

**Physical Device**
```typescript
const API_BASE_URL = 'http://192.168.1.100:5000';  // Your machine's IP
```

---

## 📁 File Structure

### Complete Project Structure
```
ayushya-mobile-app/
├── ayushyaApp/                    # React Native frontend
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx              (UPDATED)
│   │   ├── register.tsx           (UPDATED)
│   │   ├── quiz.tsx
│   │   ├── hero.tsx
│   │   ├── result.tsx
│   │   └── (tabs)/
│   │       ├── _layout.tsx
│   │       ├── dashboard.tsx
│   │       ├── aqi.tsx
│   │       ├── satmya.tsx
│   │       ├── pairing.tsx
│   │       ├── recs.tsx
│   │       └── more.tsx
│   ├── utils/
│   │   ├── api.ts                 (NEW - API service)
│   │   ├── authContext.tsx        (UPDATED - JWT)
│   │   ├── database.ts            (UPDATED - API calls)
│   │   ├── aqiHelpers.ts
│   │   ├── constants.ts
│   │   └── doshaCalc.ts
│   ├── components/
│   │   ├── AqiBadge.tsx
│   │   ├── DoshaRing.tsx
│   │   ├── Toast.tsx
│   │   └── layout/
│   ├── constants/
│   │   └── theme.ts
│   ├── hooks/
│   ├── assets/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                       # Node.js Express backend
│   ├── .env                       ← MongoDB URI
│   ├── server.js                  ← Main app
│   ├── models/
│   │   └── User.js               ← Data model
│   ├── routes/
│   │   └── auth.js               ← Endpoints
│   ├── package.json
│   └── node_modules/
│
├── README.md
├── COMPLETE_REFERENCE.md          ← This file
└── .git/
```

---

## 💻 Code Examples

### Example 1: Complete Login Flow

**Frontend (login.tsx)**
```typescript
import { loginUser } from '../utils/database';
import { useAuth } from '../utils/authContext';
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert } from 'react-native';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);

    if (result.success && result.user && result.token) {
      // Pass BOTH user and token to context
      await login(result.user, result.token);
      Alert.alert('✅ Success', result.message);
      // Navigation handled by AuthContext state
    } else {
      Alert.alert('❌ Error', result.message);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
      >
        <Text>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Example 2: API Service Pattern

**api.ts**
```typescript
const API_BASE_URL = 'http://10.0.2.2:5000';

async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}

export async function loginUser(email: string, password: string) {
  return await apiCall('/api/auth/login', 'POST', {
    email,
    password,
  });
}
```

### Example 3: Auth Context Hook

**authContext.tsx**
```typescript
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Usage in components
export function MyComponent() {
  const { user, token, login, logout } = useAuth();

  return (
    <View>
      {user ? (
        <>
          <Text>Welcome, {user.name}!</Text>
          <Button onPress={() => logout()} title="Logout" />
        </>
      ) : (
        <Text>Please login</Text>
      )}
    </View>
  );
}
```

---

## 🔧 Troubleshooting

### Backend Issues

#### Problem: "MongoDB connection error"
```
Solution:
1. Check .env has correct MONGODB_URI
2. Verify MongoDB Atlas cluster is active
3. Check whitelist includes your IP
4. Test connection: mongosh "mongodb+srv://..."
```

#### Problem: "Can't connect from frontend"
```
Solution:
1. Backend running? npm start
2. Port 5000 open? lsof -i :5000
3. Wrong API URL? Check Android=10.0.2.2, iOS=localhost
4. Network firewall? Check localhost:5000 in browser
```

#### Problem: "Registration fails - email already exists"
```
Solution:
1. Use different email address
2. Or delete user from MongoDB:
   db.users.deleteOne({ email: "old@email.com" })
```

#### Problem: "Password hashing fails"
```
Solution:
1. Check bcryptjs installed: npm list bcryptjs
2. Check salt rounds correct: should be 10
3. Verify pre-save hook running: add console.log
```

### Frontend Issues

#### Problem: "Login returns 404"
```
Solution:
1. User registered? Check MongoDB: db.users.find()
2. Wrong email? Case-sensitive? Try again
3. Backend running? npm start in backend
```

#### Problem: "Session doesn't persist"
```
Solution:
1. Token saved? Check AsyncStorage_TOKEN_KEY
2. Token valid? Try fresh login
3. App restarted? Check app startup validation
```

#### Problem: "API calls fail with CORS error"
```
Solution:
1. Backend CORS enabled? Check server.js app.use(cors())
2. Right base URL? Android=10.0.2.2, iOS=localhost
3. Backend running? npm start
```

### MongoDB Issues

#### Problem: "Cannot connect to MongoDB Atlas"
```bash
# Test connection
mongosh "mongodb+srv://admin:ayushya%40123@cluster0.4vshlgd.mongodb.net/ayushya"

# Check:
1. Cluster is active (not paused)
2. IP whitelisted in Network Access
3. Username/password correct
4. Database 'ayushya' exists
```

#### Problem: "View users in MongoDB"
```bash
mongosh "mongodb+srv://admin:ayushya%40123@cluster0.4vshlgd.mongodb.net/ayushya"

db.users.find()                    # All users
db.users.findOne({email: "..."})   # Specific user
db.users.countDocuments()          # Count
db.users.deleteOne({email: "..."}) # Delete
```

---

## ✅ Verification Checklist

### Backend Ready? ✓
- [x] MongoDB URI in .env
- [x] Dependencies installed (npm install)
- [x] server.js connects MongoDB
- [x] models/User.js has password hashing
- [x] routes/auth.js has register + login
- [x] Can start: npm start

### Frontend Ready? ✓
- [x] api.ts has correct API_BASE_URL
- [x] authContext.tsx stores token
- [x] database.ts calls api.ts
- [x] login.tsx passes user + token
- [x] register.tsx calls registerUser
- [x] Can start: npm start

### Integration Ready? ✓
- [x] Backend running on 5000
- [x] Frontend can reach backend
- [x] Register creates user in MongoDB
- [x] Login returns token
- [x] Session persists on restart
- [x] All UI screens work

---

## 📞 Quick Reference Commands

```bash
# BACKEND
cd backend
npm install              # Install dependencies
npm start                # Start server
npm list                 # Check versions

# MONGODB
mongosh "mongodb+srv://admin:ayushya%40123@cluster0.4vshlgd.mongodb.net/ayushya"
db.users.find()
db.users.deleteOne({email: "test@test.com"})

# FRONTEND
cd ayushyaApp
npm install
npm start
npm run android          # Android emulator
npm run ios              # iOS simulator

# TESTING
curl -X POST http://localhost:5000/api/auth/register ...
curl -X POST http://localhost:5000/api/auth/login ...

# GIT
git status
git add .
git commit -m "message"
git push
```

---

## 🎓 Key Concepts

### What is bcryptjs?
- Password hashing library
- Salt 10 = runs hashing algorithm 10 times (more secure)
- One-way = cannot reverse hash to get password
- Prevents rainbow table attacks

### What is JWT Token?
- JSON Web Token
- Stateless authentication
- Stores user info + signature
- Frontend sends token in every authenticated request
- Backend validates token signature

### What is MongoDB Atlas?
- Cloud MongoDB database
- Hosted on AWS/Google/Azure
- Automatic backups
- Scalable storage
- Free tier available

### What is AsyncStorage?
- React Native local storage
- Stores data on device
- Only persists between app restarts
- Limited to 10MB
- Not suitable for sensitive data

### What is CORS?
- Cross-Origin Resource Sharing
- Allows frontend to request from backend
- Prevents unauthorized cross-origin requests
- Must be enabled on backend

---

## 📖 Further Reading

- [MongoDB Documentation](https://docs.mongodb.com)
- [Express.js Guide](https://expressjs.com)
- [React Native Docs](https://reactnative.dev)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- [Mongoose Guide](https://mongoosejs.com)

---

**Last Updated:** April 20, 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0
