const express = require('express');
const HealthProfile = require('../models/HealthProfile');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/health-profile
// @desc    Save quiz results - simplified endpoint
// @access  Private
router.post('/', async (req, res) => {
  try {
    console.log('\n🔍 ==== HEALTH-PROFILE SAVE ENDPOINT ====');
    console.log('💾 Saving quiz results...');
    console.log('📨 Request body:', JSON.stringify(req.body, null, 2));
    
    const { userId, dosha_scores, dominant_dosha, quiz_completed, created_at } = req.body;

    console.log('✔️ Extracted fields:');
    console.log('  - userId:', userId, '(type:', typeof userId, ')');
    console.log('  - dosha_scores:', dosha_scores);
    console.log('  - dominant_dosha:', dominant_dosha);
    console.log('  - quiz_completed:', quiz_completed);
    console.log('  - created_at:', created_at);

    // Validate input
    if (!userId || !dosha_scores || !dominant_dosha) {
      console.log('❌ Missing required fields!');
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, dosha_scores, and dominant_dosha',
      });
    }

    // Check if user exists
    console.log('🔍 Looking for user:', userId);
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    console.log('✅ User found:', user.email);

    // Create or update health profile
    console.log('🔎 Looking for existing health profile...');
    let profile = await HealthProfile.findOne({ userId });

    if (profile) {
      console.log('📝 Updating existing profile');
      profile.doshaScores = dosha_scores;
      profile.dominantDosha = dominant_dosha;
      profile.quizCompleted = quiz_completed !== undefined ? quiz_completed : true;
    } else {
      console.log('✨ Creating new profile');
      profile = new HealthProfile({
        userId,
        doshaScores: dosha_scores,
        dominantDosha: dominant_dosha,
        quizCompleted: quiz_completed !== undefined ? quiz_completed : true,
      });
    }

    console.log('💾 Saving profile to database...');
    console.log('📦 Profile data to save:', {
      userId: profile.userId,
      doshaScores: profile.doshaScores,
      dominantDosha: profile.dominantDosha,
      allergens: profile.allergens,
      age: profile.age,
      bmi: profile.bmi,
      dietaryPreference: profile.dietaryPreference,
    });
    
    await profile.save();
    console.log('✅✅✅ PROFILE SAVED SUCCESSFULLY ✅✅✅');
    console.log('📍 MongoDB Collection: health_profiles');
    console.log('🆔 Saved Profile ID:', profile._id);

    const responseData = {
      success: true,
      message: 'Quiz results saved successfully',
      data: {
        _id: profile._id,
        userId: profile.userId,
        dosha_scores: profile.doshaScores,
        dominant_dosha: profile.dominantDosha,
        quiz_completed: profile.quizCompleted,
      },
    };
    
    console.log('📤 SENDING RESPONSE with success: true');
    res.status(201).json(responseData);
  } catch (error) {
    console.error('\n❌ Health profile save error:', error.message);
    console.error('Stack:', error.stack);
    console.log('🔍 ==== END HEALTH-PROFILE SAVE (ERROR) ====\n');
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save health profile',
    });
  }
});

// @route   POST /api/health-profiles/save-quiz
// @desc    Save quiz results and create/update health profile
// @access  Private
router.post('/save-quiz', async (req, res) => {
  try {
    console.log('\n🔍 ==== SAVE-QUIZ ENDPOINT ====');
    console.log('💾 Saving quiz results...');
    console.log('📨 Request body:', JSON.stringify(req.body, null, 2));
    
    const { userId, doshaScores, dominantDosha } = req.body;

    console.log('✔️ Extracted fields:');
    console.log('  - userId:', userId, '(type:', typeof userId, ')');
    console.log('  - doshaScores:', doshaScores);
    console.log('  - dominantDosha:', dominantDosha);

    // Validate input
    if (!userId || !doshaScores || !dominantDosha) {
      console.log('❌ Missing required fields!');
      console.log('  - userId:', !!userId);
      console.log('  - doshaScores:', !!doshaScores);
      console.log('  - dominantDosha:', !!dominantDosha);
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, doshaScores, and dominantDosha',
      });
    }

    // Check if user exists
    console.log('🔍 Looking for user:', userId);
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    console.log('✅ User found:', user.email);

    // Create or update health profile
    console.log('🔎 Looking for existing health profile...');
    let profile = await HealthProfile.findOne({ userId });

    if (profile) {
      console.log('📝 Updating existing profile');
      profile.doshaScores = doshaScores;
      profile.dominantDosha = dominantDosha;
      profile.quizCompleted = true;
      profile.updatedAt = new Date();
    } else {
      console.log('✨ Creating new profile');
      profile = new HealthProfile({
        userId,
        doshaScores,
        dominantDosha,
        quizCompleted: true,
      });
    }

    console.log('💾 Saving profile to database...');
    console.log('📦 Profile data to save:', {
      userId: profile.userId,
      doshaScores: profile.doshaScores,
      dominantDosha: profile.dominantDosha,
      allergens: profile.allergens,
      age: profile.age,
      bmi: profile.bmi,
      dietaryPreference: profile.dietaryPreference,
    });
    
    await profile.save();
    console.log('✅ Quiz results saved successfully!');
    console.log('📍 Collection: health_profiles');
    console.log('🔍 ==== END SAVE-QUIZ ====\n');

    res.status(201).json({
      success: true,
      message: 'Quiz results saved successfully',
      profile: {
        _id: profile._id,
        userId: profile.userId,
        doshaScores: profile.doshaScores,
        dominantDosha: profile.dominantDosha,
        quizCompleted: profile.quizCompleted,
      },
    });
  } catch (error) {
    console.error('\n❌ Quiz save error:', error.message);
    console.error('Stack:', error.stack);
    console.log('🔍 ==== END SAVE-QUIZ (ERROR) ====\n');
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save quiz results',
    });
  }
});

// @route   GET /api/health-profiles/:userId
// @desc    Get user's health profile
// @access  Private
router.get('/:userId', async (req, res) => {
  try {
    console.log('🔍 Fetching health profile for user:', req.params.userId);
    const profile = await HealthProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      console.log('⚠️ Profile not found');
      return res.status(404).json({
        success: false,
        message: 'Health profile not found',
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile',
    });
  }
});

// @route   PUT /api/health-profiles/:userId
// @desc    Update health profile (allergens, age, BMI, dietary preference, desha, season)
// @access  Private
router.put('/:userId', async (req, res) => {
  try {
    console.log('📝 Updating health profile:', req.params.userId);
    console.log('🔍 Full request body:', JSON.stringify(req.body, null, 2));
    const { allergens, dateOfBirth, age, bmi, dietaryPreference, desha, season } = req.body;
    console.log('📋 Destructured values:', {
      allergens,
      dateOfBirth,
      age,
      bmi,
      dietaryPreference,
      desha,
      season
    });

    const profile = await HealthProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      console.log('❌ Profile not found');
      return res.status(404).json({
        success: false,
        message: 'Health profile not found',
      });
    }

    // Update only provided fields
    if (allergens !== undefined) {
      console.log('✅ Updating allergens:', allergens);
      profile.allergens = allergens;
    }
    if (dateOfBirth !== undefined) {
      console.log('✅ Updating dateOfBirth:', dateOfBirth);
      profile.dateOfBirth = dateOfBirth;
    }
    if (age !== undefined) {
      console.log('✅ Updating age:', age);
      profile.age = age;
    }
    if (bmi !== undefined) {
      console.log('✅ Updating BMI:', bmi);
      profile.bmi = bmi;
    }
    if (dietaryPreference !== undefined) {
      console.log('✅ Updating dietary preference:', dietaryPreference);
      profile.dietaryPreference = dietaryPreference;
    }
    if (desha !== undefined) {
      console.log('✅ Updating desha (region):', desha);
      profile.desha = desha;
    }
    if (season !== undefined) {
      console.log('✅ Updating season:', season);
      profile.season = season;
    }

    profile.updatedAt = new Date();
    await profile.save();

    console.log('✅ Profile updated');
    console.log('📦 Updated fields:', {
      allergens: profile.allergens,
      dateOfBirth: profile.dateOfBirth,
      age: profile.age,
      bmi: profile.bmi,
      dietaryPreference: profile.dietaryPreference,
      desha: profile.desha,
      season: profile.season,
    });
    console.log('📍 Collection: health_profiles');
    res.status(200).json({
      success: true,
      message: 'Health profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
});

module.exports = router;
