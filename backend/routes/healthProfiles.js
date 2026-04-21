const express = require('express');
const HealthProfile = require('../models/HealthProfile');
const User = require('../models/User');

const router = express.Router();


// ==================== GET PROFILE ====================
router.get('/:userId', async (req, res) => {
  try {

    const profile = await HealthProfile.findOne({
      userId: req.params.userId
    });

    if (!profile) {

      return res.status(404).json({
        success: false,
        needsQuiz: true
      });

    }

    res.json({
      success: true,
      profile
    });

  }

  catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});



// ==================== SAVE QUIZ ====================
router.post('/', async (req, res) => {

  try {

    const {
      userId,
      doshaScores,
      dominantDosha
    } = req.body;


    if (!userId || !doshaScores || !dominantDosha) {

      return res.status(400).json({
        success: false,
        message: 'Missing quiz fields'
      });

    }


    const user = await User.findById(userId);

    if (!user) {

      return res.status(404).json({
        success: false,
        message: 'User not found'
      });

    }


    let profile = await HealthProfile.findOne({
      userId
    });


    if (profile) {

      profile.doshaScores = doshaScores;
      profile.dominantDosha = dominantDosha;
      profile.quizCompleted = true;

    }

    else {

      profile = new HealthProfile({

        userId,
        doshaScores,
        dominantDosha,
        quizCompleted: true

      });

    }


    await profile.save();


    res.json({
      success: true,
      profile
    });

  }

  catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});



// ==================== UPDATE PERSONALISATION ====================
router.patch('/:userId', async (req, res) => {

  try {

    const {

      allergens,
      age,
      bmi,
      dietaryPreference,
      dateOfBirth,
      region,
      season

    } = req.body;


    const profile = await HealthProfile.findOne({

      userId: req.params.userId

    });


    if (!profile) {

      return res.status(404).json({
        success: false,
        message: 'Health profile not found'
      });

    }


    if (allergens !== undefined)
      profile.allergens = allergens;

    if (age !== undefined)
      profile.age = age;

    if (bmi !== undefined)
      profile.bmi = bmi;

    if (dietaryPreference !== undefined)
      profile.dietaryPreference = dietaryPreference;

    if (dateOfBirth !== undefined)
      profile.dateOfBirth = dateOfBirth;

    if (region !== undefined)
      profile.region = region;

    if (season !== undefined)
      profile.season = season;


    await profile.save();


    res.json({

      success: true,
      profile

    });

  }

  catch (err) {

    res.status(500).json({

      success: false,
      message: err.message

    });

  }

});


module.exports = router;