# Health Profile System - Flow Changes

## Overview
This document describes the updated quiz and personalization flow for the Ayushya app. The system ensures quiz appears only once, allowing users to complete personalization details anytime.

## Key Features
- ✅ Quiz appears **only once** after initial login
- ✅ Health profile data stored in MongoDB `health_profiles` collection
- ✅ Personalization details (age, BMI, dietary preference, allergens) editable anytime
- ✅ User deletion cascades to health profile deletion

---

## Updated User Flow

### 1. User Login
```
Login (email/password)
   ↓
Backend validates credentials
   ↓
Check /api/health/profile/:userId
   ├─ Profile exists → Skip quiz, go to dashboard
   └─ Profile NOT found → User needs to take quiz
   ↓
[Application decides: Quiz OR Dashboard]
```

### 2. Quiz Flow (First Time)
```
User clicks "Take Quiz"
   ↓
Complete quiz questions
   ↓
POST /api/health/profile
   ├─ userId
   ├─ doshaScores {vata, pitta, kapha}
   ├─ dominantDosha
   └─ quizCompleted: true
   ↓
[Quiz results saved to health_profiles collection]
   ↓
Show "Complete Your Profile" form (optional)
   ├─ Allergens (checkboxes)
   ├─ Age (input)
   ├─ BMI (input)
   └─ Dietary Preference (veg/non-veg)
   ↓
PATCH /api/health/profile/:userId
   └─ Update optional fields
   ↓
Navigate to Dashboard
```

### 3. Returning User (Quiz Already Completed)
```
User logs in
   ↓
Check /api/health/profile/:userId
   ├─ Profile exists & quizCompleted=true
   └─ Go directly to Dashboard (skip quiz)
   ↓
Dashboard loads with dosha data
```

### 4. Edit Profile Anytime
```
User navigates to "More" → "Edit Profile"
   ↓
PATCH /api/health/profile/:userId
   └─ Update any fields: age, bmi, dietaryPreference, allergens
   ↓
Profile saved, dashboard refreshed
```

### 5. Delete User Account
```
User clicks "Delete Account"
   ↓
DELETE /api/auth/user/:userId
   ├─ Delete from users collection
   ├─ Delete from health_profiles collection (cascade)
   └─ All data removed
   ↓
Redirect to login
```

---

## MongoDB Collections

### Users Collection
```
{
  _id: ObjectId,
  name: String,
  email: String,
  password_hash: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Health Profiles Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  doshaScores: {
    vata: Number,
    pitta: Number,
    kapha: Number
  },
  dominantDosha: String (enum: vata | pitta | kapha),
  quizCompleted: Boolean (default: true),
  allergens: [String],
  age: Number,
  bmi: Number,
  dietaryPreference: String (vegetarian | non-vegetarian),
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### 1. GET /api/health/profile/:userId
**Purpose:** Check if user has completed quiz

**Request:**
```bash
GET /api/health/profile/USER_ID
Header: Authorization: Bearer TOKEN
```

**Response (Profile exists):**
```json
{
  "success": true,
  "profile": {
    "_id": "profile_id",
    "userId": "user_id",
    "doshaScores": { "vata": 30, "pitta": 40, "kapha": 30 },
    "dominantDosha": "pitta",
    "quizCompleted": true,
    "allergens": ["Gluten", "Dairy"],
    "age": 28,
    "bmi": 24.5,
    "dietaryPreference": "vegetarian"
  },
  "needsQuiz": false
}
```

**Response (Profile NOT found):**
```json
{
  "success": false,
  "message": "Health profile not found - user needs to take quiz",
  "needsQuiz": true
}
```

---

### 2. POST /api/health/profile
**Purpose:** Save quiz results (creates new health profile)

**Request:**
```bash
POST /api/health/profile
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "userId": "user_id",
  "doshaScores": { "vata": 30, "pitta": 40, "kapha": 30 },
  "dominantDosha": "pitta",
  "quizCompleted": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz results saved successfully",
  "profile": {
    "_id": "profile_id",
    "userId": "user_id",
    "doshaScores": { "vata": 30, "pitta": 40, "kapha": 30 },
    "dominantDosha": "pitta",
    "quizCompleted": true
  }
}
```

---

### 3. PATCH /api/health/profile/:userId
**Purpose:** Update personalization details (age, BMI, dietary preference, allergens)

**Request:**
```bash
PATCH /api/health/profile/USER_ID
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "age": 28,
  "bmi": 24.5,
  "dietaryPreference": "vegetarian",
  "allergens": ["Gluten", "Dairy"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Health profile updated successfully",
  "profile": {
    "_id": "profile_id",
    "userId": "user_id",
    "allergens": ["Gluten", "Dairy"],
    "age": 28,
    "bmi": 24.5,
    "dietaryPreference": "vegetarian"
  }
}
```

---

### 4. DELETE /api/auth/user/:userId
**Purpose:** Delete user account and cascade delete health profile

**Request:**
```bash
DELETE /api/auth/user/USER_ID
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "User account and profile deleted successfully"
}
```

---

## Frontend Functions

### Login Flow
```typescript
// Step 1: Login
const result = await loginUser(email, password);

// Step 2: Check if quiz needed
const quizNeeded = await needsQuiz(userId, token);

// Step 3: Set user.quizCompleted based on quiz status
result.user.quizCompleted = !quizNeeded;

// Step 4: Login to auth context
await login(result.user, result.token);
```

### Quiz Flow
```typescript
// Save quiz results
const result = await saveQuizResults(userId, doshaScores, token);

// Show profile completion form if needed
if (result.success) {
  setShowProfile(true); // CompleteProfile component
}
```

### Update Profile
```typescript
// Update personalization details
const result = await updateHealthProfile(userId, {
  age: 28,
  bmi: 24.5,
  dietaryPreference: 'vegetarian',
  allergens: ['Gluten', 'Dairy']
}, token);
```

---

## Backend Middleware

### Express JSON Parsing
```javascript
// server.js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

---

## Database Initialization

MongoDB collection `health_profiles` is created automatically by Mongoose schema with:
- Unique index on `userId` (one profile per user)
- Timestamps (createdAt, updatedAt)
- Required fields: userId, doshaScores, dominantDosha

---

## UI Behavior (No Changes)

The UI layout remains **unchanged**:
- Login screen (same)
- Hero/Quiz screens (same)
- Result screen with "Complete Profile" form (same)
- Dashboard (same)

**Only the logic changes:**
- After login, check quiz status before showing quiz
- Save quiz results to `health_profiles` collection
- Allow editing profile details anytime via settings

---

## Error Handling

### Quiz Check Fails
If `GET /api/health/profile/:userId` fails:
- Assume user needs to take quiz (safe default)
- User can retry or skip

### Quiz Save Fails
If `POST /api/health/profile` fails:
- Show error alert
- User can retry without losing quiz answers

### Profile Update Fails
If `PATCH /api/health/profile/:userId` fails:
- Show error alert
- User can retry

---

## Testing Checklist

- [ ] New user can login, take quiz, save results
- [ ] Returning user skips quiz on login
- [ ] Quiz results appear in MongoDB `health_profiles` collection
- [ ] User can update profile details anytime
- [ ] Deleting user also deletes health profile
- [ ] Backend endpoints respond with correct status codes (200, 201, 404, 500)
- [ ] All API calls include proper Authorization header
- [ ] Console logs show request/response flow

