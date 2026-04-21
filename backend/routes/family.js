const express = require('express');
const Family = require('../models/Family');
const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');

const router = express.Router();

// ==================== HELPER: Generate unique 6-digit code ====================
function generateFamilyCode() {
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = Math.floor(Math.random() * 900000) + 100000; // 6 digits
    // In production, check DB for uniqueness
    isUnique = true;
  }

  return code.toString();
}

// ==================== CREATE FAMILY ====================
// POST /api/family/create
router.post('/create', async (req, res) => {
  try {
    const { userId, familyName } = req.body;

    if (!userId || !familyName) {
      return res.status(400).json({
        success: false,
        message: 'User ID and family name are required',
      });
    }

    // Check if user already belongs to a family
    const existingUser = await User.findById(userId);
    if (existingUser && existingUser.familyId) {
      return res.status(400).json({
        success: false,
        message: 'User already belongs to a family',
      });
    }

    // Generate unique family code
    const familyCode = generateFamilyCode();

    // Create family
    const family = new Family({
      familyName,
      familyCode,
      createdBy: userId,
      members: [
        {
          userId,
          role: 'admin',
        },
      ],
    });

    await family.save();

    // Update user with familyId
    await User.findByIdAndUpdate(userId, { familyId: family._id });

    console.log(`✅ Family created: ${familyName} (Code: ${familyCode})`);

    res.status(201).json({
      success: true,
      message: 'Family created successfully',
      family: {
        _id: family._id,
        familyName: family.familyName,
        familyCode: family.familyCode,
        members: family.members,
      },
    });
  } catch (error) {
    console.error('❌ Create family error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create family',
    });
  }
});

// ==================== JOIN FAMILY ====================
// POST /api/family/join
router.post('/join', async (req, res) => {
  try {
    const { userId, familyCode } = req.body;

    if (!userId || !familyCode) {
      return res.status(400).json({
        success: false,
        message: 'User ID and family code are required',
      });
    }

    // Check if user already belongs to a family
    const existingUser = await User.findById(userId);
    if (existingUser && existingUser.familyId) {
      return res.status(400).json({
        success: false,
        message: 'User already belongs to a family',
      });
    }

    // Find family by code
    const family = await Family.findOne({ familyCode });

    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Invalid family code',
      });
    }

    // Check if user is already a member
    const isMember = family.members.some(
      (member) => member.userId.toString() === userId.toString()
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this family',
      });
    }

    // Add user to family
    family.members.push({
      userId,
      role: 'member',
    });

    await family.save();

    // Update user with familyId
    await User.findByIdAndUpdate(userId, { familyId: family._id });

    console.log(
      `✅ User ${userId} joined family: ${family.familyName}`
    );

    res.json({
      success: true,
      message: 'Joined family successfully',
      family: {
        _id: family._id,
        familyName: family.familyName,
        members: family.members,
      },
    });
  } catch (error) {
    console.error('❌ Join family error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to join family',
    });
  }
});

// ==================== GET FAMILY MEMBERS ====================
// GET /api/family/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If user doesn't belong to a family
    if (!user.familyId) {
      return res.json({
        success: true,
        family: null,
        message: 'User does not belong to a family',
      });
    }

    // Get family
    const family = await Family.findById(user.familyId).populate('members.userId', 'name email');

    if (!family) {
      return res.json({
        success: true,
        family: null,
        message: 'Family not found',
      });
    }

    // Get health profiles for all members (to get dosha scores)
    const memberIds = family.members.map((m) => m.userId._id);
    const healthProfiles = await HealthProfile.find({
      userId: { $in: memberIds },
    });

    // Combine member data with health profile data
    const membersWithDosha = family.members.map((member) => {
      const profile = healthProfiles.find(
        (p) => p.userId.toString() === member.userId._id.toString()
      );

      return {
        userId: member.userId._id,
        name: member.userId.name,
        email: member.userId.email,
        role: member.role,
        joinedAt: member.joinedAt,
        doshaScores: profile
          ? {
              vata: profile.doshaScores.vata,
              pitta: profile.doshaScores.pitta,
              kapha: profile.doshaScores.kapha,
            }
          : null,
        dominantDosha: profile ? profile.dominantDosha : null,
      };
    });

    res.json({
      success: true,
      family: {
        _id: family._id,
        familyName: family.familyName,
        familyCode: family.familyCode,
        createdBy: family.createdBy,
        members: membersWithDosha,
        createdAt: family.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Get family error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get family',
    });
  }
});

module.exports = router;
