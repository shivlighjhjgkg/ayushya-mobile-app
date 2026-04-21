# Family Group Feature - Implementation Guide

## Overview
The Family Group feature allows users to create or join a family group, share their Dosha profiles, and view family members' health information all in one place.

## Key Features
- **Create Family**: User can create a new family and get a unique 6-digit code
- **Join Family**: Other users can join using the family code
- **One Family Per User**: Each user can only belong to ONE family
- **View Members**: See all family members with their Dosha scores
- **Admin System**: Creator is admin, others are members
- **Cascading**: Family data is stored in MongoDB and linked to users

## Backend Implementation

### Database Models

#### Family Collection (`families`)
```javascript
{
  _id: ObjectId,
  familyName: String,
  familyCode: String (unique, 6 digits),
  createdBy: ObjectId (ref: User),
  members: [
    {
      userId: ObjectId (ref: User),
      role: "admin" | "member",
      joinedAt: Date
    }
  ],
  createdAt: Date
}
```

#### User Schema Update
Added field:
```javascript
familyId: ObjectId (ref: Family, default: null)
```

### API Endpoints

#### 1. Create Family
**POST** `/api/family/create`
```json
Request Body:
{
  "userId": "user_id",
  "familyName": "The Smiths"
}

Response (Success):
{
  "success": true,
  "message": "Family created successfully",
  "family": {
    "_id": "family_id",
    "familyName": "The Smiths",
    "familyCode": "123456",
    "members": [...]
  }
}

Response (Error):
{
  "success": false,
  "message": "User already belongs to a family"
}
```

#### 2. Join Family
**POST** `/api/family/join`
```json
Request Body:
{
  "userId": "user_id",
  "familyCode": "123456"
}

Response (Success):
{
  "success": true,
  "message": "Joined family successfully",
  "family": {...}
}

Response (Error):
{
  "success": false,
  "message": "Invalid family code" | "User already belongs to a family"
}
```

#### 3. Get Family Members
**GET** `/api/family/:userId`
```json
Response (Success):
{
  "success": true,
  "family": {
    "_id": "family_id",
    "familyName": "The Smiths",
    "familyCode": "123456",
    "members": [
      {
        "userId": "user_id_1",
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
      },
      ...
    ]
  }
}

Response (No Family):
{
  "success": true,
  "family": null,
  "message": "User does not belong to a family"
}
```

## Frontend Implementation

### Family Screen (`app/(tabs)/family.tsx`)
Located in the main navigation with 👪 icon.

**Features:**
- Create Family form with family name input
- Join Family form with 6-digit code input
- Display family members with:
  - Name and email
  - Role (Admin 👑 / Member 👤)
  - Dosha scores (Vata, Pitta, Kapha) in bar chart
  - Dominant Dosha badge
- Copy family code button
- Loading states and error alerts

### More Tab (`app/(tabs)/more.tsx`)
Updated to show family information:
- If user is in a family: Display family members with status
- If user is not in a family: Show link to Family tab

### Navigation
Added 'family' tab to the app navigation (NAV constant).

### API Wrappers
Three new functions in `utils/api.ts`:
- `createFamily(userId, familyName, token)`
- `joinFamily(userId, familyCode, token)`
- `getFamily(userId, token)`

Database layer wrappers in `utils/database.ts`:
- `createFamily(userId, familyName, token)`
- `joinFamily(userId, familyCode, token)`
- `getFamily(userId, token)`

## How to Use

### For Users Creating a Family
1. Go to Family tab (👪)
2. Tap "➕ Create Family"
3. Enter family name (e.g., "The Smiths")
4. Tap "Create"
5. Share the generated 6-digit code with family members

### For Users Joining a Family
1. Go to Family tab (👪)
2. Tap "🔗 Join Family"
3. Enter the 6-digit family code
4. Tap "Join"
5. Family members now appear on the Family tab

### Viewing Family Information
- **Family Tab**: Full family member list with all details
- **More Tab**: Quick preview of family members and their status

## Testing Checklist

- [ ] Backend server running: `cd backend && npm start`
- [ ] MongoDB connected and `families` collection visible
- [ ] User 1 creates family → family code generated
- [ ] Family code is unique (6 digits)
- [ ] Creator added as 'admin' member
- [ ] Creator's familyId updated in User collection
- [ ] User 2 joins family using code → success
- [ ] User 2's familyId updated in User collection
- [ ] GET /api/family/:userId returns all members with Dosha scores
- [ ] User profile shows family info in More tab
- [ ] Cannot join two families (error on join if already has familyId)
- [ ] Dosha bars display correctly in family members list
- [ ] Admin/Member badges show correctly

## Error Handling

### Common Errors

**"User already belongs to a family"**
- Cause: User tried to create/join while already in a family
- Solution: Remove familyId from user or leave family first

**"Invalid family code"**
- Cause: Code doesn't exist or is incorrectly formatted
- Solution: Verify 6-digit code is correct

**"Cannot reach backend"**
- Cause: Backend server not running or wrong API_BASE_URL
- Solution: 
  ```bash
  cd backend && npm start
  ```

## File Structure

```
backend/
├── models/
│   ├── User.js (updated with familyId)
│   ├── Family.js (new)
│   └── HealthProfile.js (unchanged)
├── routes/
│   ├── auth.js (unchanged)
│   ├── healthProfiles.js (unchanged)
│   └── family.js (new)
├── server.js (updated with CORS preflight and family routes)

ayushyaApp/
├── app/
│   ├── (tabs)/
│   │   ├── family.tsx (new)
│   │   └── more.tsx (updated)
│   └── index.tsx (updated with family tab)
├── utils/
│   ├── api.ts (updated with family functions)
│   ├── database.ts (updated with family wrappers)
│   └── constants.ts (updated NAV)
```

## Important Notes

1. **Family Code Generation**: Uses `Math.random()` to generate 6-digit codes. In production, should verify uniqueness in database.

2. **One Family Per User**: The `familyId` field in User schema ensures each user can only belong to one family.

3. **CORS Preflight**: Explicit OPTIONS handler added to server.js to ensure PATCH and other methods work correctly.

4. **Dosha Scores**: Family screen fetches Dosha scores from `health_profiles` collection, so members must have completed the quiz to show their Dosha data.

5. **Role-Based Access**: Currently only checking roles for display. Future enhancements could restrict operations by role (e.g., only admin can remove members).

## Future Enhancements

- Leave/Remove family functionality
- Invite friends via email/SMS
- Family goals and challenges
- Share meal plans within family
- Family history and statistics
- More granular permissions by role
