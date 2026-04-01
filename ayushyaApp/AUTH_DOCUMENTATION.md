## 🔐 Authentication Documentation

### Overview
The Ayushya app now includes **user authentication** with:
- ✅ User registration & login
- ✅ Password hashing with bcryptjs (10-salt rounds)
- ✅ SQLite local database storage
- ✅ Persistent authentication (remembers logged-in users)
- ✅ Logout functionality
- ✅ Email validation

---

## 🛠 Technology Stack

| Component | Package | Version |
|-----------|---------|---------|
| **Local Database** | expo-sqlite | Latest |
| **Password Hashing** | bcryptjs | Latest |
| **Persistent Storage** | @react-native-async-storage/async-storage | Latest |
| **State Management** | React Context API | Built-in |

---

## 📱 Features

### Registration
- Full name, email, password
- Email validation (must be valid format)
- Password validation (min 6 characters)
- Password confirmation
- Prevents duplicate email registration
- Auto-redirects to login on success

### Login
- Email & password
- Password hash comparison
- Session persistence (user stays logged in after app restart)
- Demo credentials provided on login screen

### Logout
- Available in "More" tab (⋯)
- Shows user profile (name + email)
- Confirmation dialog before logout
- Clears all session data

---

## 🗄 Database Structure

**Table: `users`**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,        -- hashed with bcryptjs
  name TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

The database file (`ayushya.db`) is stored locally on the device using `expo-sqlite`.

---

## 🧪 Test Credentials

**Demo Account:**
- Email: `test@example.com`
- Password: `password123`

(Email & password fields auto-fill on login screen as hint)

---

## 🔄 App Flow

```
App Start
  ↓
1. Initialize SQLite Database
  ↓
2. Check if user is logged in (AsyncStorage)
  ↓
  ├─ YES → Show Hero Screen
  └─ NO  → Show Login Screen
    ├─ New user? → Register Screen
    └─ Existing user? → Login Screen
  ↓
3. After Login → Hero → Quiz → Result → Dashboard
  ↓
4. From Dashboard → 6 tabs (including "More" with Logout)
```

---

## 📂 File Structure

```
app/
  ├─ login.tsx              # Login screen
  ├─ register.tsx           # Registration screen
  ├─ index.tsx              # Main app (auth flow)
  ├─ _layout.tsx            # Root layout with AuthProvider
  └─ (tabs)/
      └─ more.tsx           # Logout button added here

utils/
  ├─ database.ts            # SQLite functions (init, register, login, hash)
  ├─ authContext.ts         # React Context for auth state
  └─ (existing files)

scripts/
  └─ seed-database.js       # Reference file for test users
```

---

## 🔒 Security Features

✅ **Password Hashing**
- Uses bcryptjs with 10-salt rounds
- Passwords never stored in plain text
- Before/after hashing: comparison is timing-safe

✅ **Data Validation**
- Email format validation
- Password length validation
- Empty field checks

✅ **Session Management**
- User ID stored in AsyncStorage (not passwords)
- Auto-restores session on app restart
- Logout clears all session data

❌ **Not Implemented (Backend Required)**
- Password reset/recovery
- Email verification
- Multi-device sessions
- Rate limiting on login attempts
- Account lockout after failed attempts

---

## 📝 Usage Examples

### Register a New User
```
1. Open app
2. Tap "Register" link on login screen
3. Fill in name, email, password
4. Tap "Register"
5. Auto-redirects to login
6. Login with credentials
```

### Login
```
1. Open app
2. Enter email & password
3. Tap "Login"
4. Auto-redirects to Hero screen
5. Complete quiz → access Dashboard
```

### Logout
```
1. Tap "More" tab (⋯)
2. Scroll to "Account" section
3. Tap "🚪 Logout"
4. Confirm in dialog
5. Returns to login screen
```

---

## 🔧 Integration Notes

### For Backend Integration Later
When you add a backend server:
1. Replace `loginUser()` & `registerUser()` with API calls
2. JWT tokens can replace AsyncStorage `userId`
3. Keep local SQLite as cache (optional)
4. Update password hashing to be server-side

### Current Limitations
- Passwords hashed locally (less secure than server)
- No email verification
- No password reset
- No account recovery
- All user data stored locally

---

## 📊 Test Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| First app launch | Shows login screen |
| Register with existing email | Error: "Email already registered" |
| Register with invalid email | Error: "Please enter a valid email" |
| Register with short password | Error: "Password must be at least 6 characters" |
| Login with wrong password | Error: "Invalid password" |
| Login with non-existent email | Error: "Email not found" |
| Successful login | Redirects to Hero screen |
| Logout | Returns to login, clears session |
| App restart (logged in) | Auto-logs in, shows Hero screen |
| App restart (logged out) | Shows login screen |

---

## 🐛 Debugging

**Check if database is initialized:**
```javascript
// In database.ts
getAllUsers()  // Returns all registered users
```

**Check logged-in user:**
```javascript
// In authContext.ts
const { user } = useAuth();
console.log(user);  // { id, email, name }
```

**Clear all data (reset app):**
```bash
npm run reset-project
# OR delete node_modules + .expo and reinstall
```

---

## 🚀 Next Steps

1. **Test thoroughly** with the demo credentials
2. **Try registering** a few test accounts
3. **Test logout** and session persistence
4. **When ready for backend**, replace database calls with API endpoints
5. **Add password reset** flow (email-based or phone-based)
6. **Implement email verification** (send confirmation link)
7. **Add 2FA** (optional, for security)

---

## ❓ FAQs

**Q: Where is the database stored?**
A: In the device's app documents directory via `expo-sqlite`. Location varies by platform.

**Q: Can users see their password?**
A: No, passwords are hashed with bcryptjs and never retrievable.

**Q: What if user forgets password?**
A: Currently no recovery. Plan: Add email-based reset flow.

**Q: Can multiple users login on same device?**
A: No, only one session at a time. AsyncStorage stores 1 user ID.

**Q: Is SQLite secure?**
A: SQLite itself is not encrypted. For sensitive data, use `expo-secure-store` instead.

**Q: Can I export user data?**
A: Currently no export. Plan: Add backup/export feature.

---

For questions or issues, check the database.ts and authContext.ts files! 🚀
