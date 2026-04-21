# Family Feature - Quick Setup & Testing Guide

## Prerequisites
- Backend server running
- MongoDB connected
- Frontend dev server running

## Step 1: Start the Backend

```bash
cd backend
npm start
```

Expected output:
```
✅ MongoDB connected successfully
📊 Database: ayushya
🚀 Server running on http://localhost:5000
```

## Step 2: Start the Frontend

```bash
cd ayushyaApp
npm start
```

## Step 3: Test the Feature

### Scenario 1: Create a Family

1. **Register/Login** with User A
2. **Go to Family tab** (👪) in the bottom navigation
3. **Tap "➕ Create Family"**
4. **Enter family name** (e.g., "Smith Family")
5. **Tap "Create"**
6. ✅ Should see success alert with 6-digit code
7. ✅ Family code should be displayed in the card
8. ✅ User A should appear as member with 'admin' role (👑)

### Scenario 2: Join Family

1. **Register/Login** with User B
2. **Go to Family tab** (👪)
3. **Tap "🔗 Join Family"**
4. **Enter the 6-digit code** from Scenario 1
5. **Tap "Join"**
6. ✅ Should see success alert
7. ✅ Both User A and User B should appear in the family members list

### Scenario 3: View Family Info in More Tab

1. **Switch to More tab** (⋯)
2. **Look at the "👪 Family" section**
3. ✅ Should see family members list (if user is in a family)
4. ✅ Each member shows:
   - Name
   - Email
   - Admin/Member badge
   - Dosha scores (if quiz completed)

### Scenario 4: Verify Database

1. **Check MongoDB** for `families` collection:
   ```bash
   use ayushya
   db.families.find()
   db.users.find({familyId: {$ne: null}})
   ```

2. ✅ Should see:
   - Family document with members array
   - Both users with familyId field set

## Expected Behavior

### ✅ Success Cases

| Action | Expected Result |
|--------|-----------------|
| Create family | 6-digit code generated, creator is admin |
| Join family with valid code | User added to family members |
| View family members | All members shown with Dosha data (if quiz done) |
| Second join attempt | Error: "User already belongs to a family" |
| View More tab | Family section shows current members |

### ❌ Error Cases

| Action | Expected Error |
|--------|-----------------|
| Join with invalid code | "Invalid family code" |
| Try to create 2 families | "User already belongs to a family" |
| Try to join while in family | "User already belongs to a family" |
| Backend down | "Cannot reach backend at http://localhost:5000" |

## Debugging

### If Family Section is Empty

1. Check backend console for errors
2. Verify MongoDB connection: `db.families.find()`
3. Check that `familyId` is set in users collection
4. Verify token is valid and being sent with requests

### If Family Code Shows as "NaN"

1. Check the `generateFamilyCode()` function in `backend/routes/family.js`
2. Ensure Math.random() is working correctly
3. Check browser console for JavaScript errors

### If "Cannot reach backend"

1. Verify backend is running: `http://localhost:5000/health`
2. Check API_BASE_URL in `ayushyaApp/utils/api.ts`
3. For mobile/emulator: might need to use `http://10.0.2.2:5000`

## Database Schema Verification

### Families Collection Structure
```javascript
{
  _id: ObjectId,
  familyName: "Smith Family",
  familyCode: "123456",
  createdBy: ObjectId,
  members: [
    {
      userId: ObjectId,
      role: "admin",
      joinedAt: ISODate
    },
    {
      userId: ObjectId,
      role: "member",
      joinedAt: ISODate
    }
  ],
  createdAt: ISODate
}
```

### Users Collection Update
```javascript
{
  _id: ObjectId,
  name: "User Name",
  email: "user@example.com",
  password_hash: "...",
  familyId: ObjectId, // NEW FIELD
  created_at: ISODate
}
```

## API Response Examples

### POST /api/family/create
```json
{
  "success": true,
  "message": "Family created successfully",
  "family": {
    "_id": "66c7f123...",
    "familyName": "Smith Family",
    "familyCode": "789456",
    "members": [
      {
        "userId": "66c7f456...",
        "role": "admin"
      }
    ]
  }
}
```

### GET /api/family/:userId
```json
{
  "success": true,
  "family": {
    "_id": "66c7f123...",
    "familyName": "Smith Family",
    "familyCode": "789456",
    "members": [
      {
        "userId": "66c7f456...",
        "name": "John",
        "email": "john@example.com",
        "role": "admin",
        "joinedAt": "2026-04-21T...",
        "doshaScores": {
          "vata": 60,
          "pitta": 25,
          "kapha": 15
        },
        "dominantDosha": "vata"
      }
    ]
  }
}
```

## Feature Checklist

- [x] Backend: Family model created
- [x] Backend: User schema updated with familyId
- [x] Backend: Create family endpoint
- [x] Backend: Join family endpoint
- [x] Backend: Get family members endpoint
- [x] Backend: CORS preflight handler
- [x] Frontend: Family screen created
- [x] Frontend: Create family form
- [x] Frontend: Join family form
- [x] Frontend: Family members list with Dosha display
- [x] Frontend: API wrappers created
- [x] Frontend: Database wrappers created
- [x] Frontend: Integration with More tab
- [x] Frontend: Navigation tab added
- [ ] **User Test**: Create family and verify code
- [ ] **User Test**: Join family with code
- [ ] **User Test**: Verify database entries
- [ ] **User Test**: View family in More tab
- [ ] **User Test**: Test error cases

## Notes

- Each user can only belong to ONE family
- Family codes are 6 digits (currently not checking DB uniqueness - add in production)
- Admin role is assigned to family creator
- Other members have 'member' role
- Dosha scores only show if member has completed quiz
- CORS preflight now properly handles PATCH and other methods
