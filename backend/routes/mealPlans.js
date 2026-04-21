const express = require('express');
const HealthProfile = require('../models/HealthProfile');
const GroceryList = require('../models/GroceryList');
const WeeklyMealPlan = require('../models/WeeklyMealPlan');
const { generateWeeklyMealPlan } = require('../services/mealPlanGenerator');

const router = express.Router();

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() + diffToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

function extractTokenUserId(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  if (!token.includes('_')) {
    return null;
  }

  return token.split('_')[0];
}

router.get('/:userId/current-week', async (req, res) => {
  try {
    const tokenUserId = extractTokenUserId(req);

    if (!tokenUserId) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    if (tokenUserId !== req.params.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - token does not match userId',
      });
    }

    const { weekStart, weekEnd } = getWeekRange();
    const refresh = String(req.query.refresh || 'false').toLowerCase() === 'true';

    if (!refresh) {
      const existingPlan = await WeeklyMealPlan.findOne({
        userId: req.params.userId,
        weekStart,
      });

      if (existingPlan) {
        return res.json({
          success: true,
          plan: existingPlan,
          source: 'cached',
        });
      }
    }

    const profile = await HealthProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Health profile not found. Complete quiz/profile first.',
      });
    }

    const groceryList = await GroceryList.findOne({ userId: req.params.userId, weekStart });

    if (!groceryList || !Array.isArray(groceryList.items) || groceryList.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Save grocery items first to generate your weekly meal plan.',
      });
    }

    const generated = await generateWeeklyMealPlan(profile, groceryList.items, req.params.userId);

    if (!generated.success) {
      return res.status(400).json({
        success: false,
        message: generated.message,
      });
    }

    const plan = await WeeklyMealPlan.findOneAndUpdate(
      {
        userId: req.params.userId,
        weekStart,
      },
      {
        userId: req.params.userId,
        weekStart,
        weekEnd,
        days: generated.days,
        filters: {
          age: profile.age,
          dietaryPreference: profile.dietaryPreference,
          season: profile.season,
          desha: profile.desha || profile.region,
          allergens: profile.allergens || [],
          blockedMeals: generated.blockedMeals,
          groceryItemsCount: groceryList.items.length,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      success: true,
      plan,
      source: 'generated',
    });
  } catch (error) {
    console.error('Weekly meal plan generation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate weekly meal plan',
    });
  }
});

module.exports = router;
