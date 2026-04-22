const express = require('express');
const MealFeedback = require('../models/MealFeedback');

const router = express.Router();

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

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
}

router.post('/:userId', async (req, res) => {
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

    const { mealType, mealName, feedback } = req.body;

    if (!mealType || !mealName || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'mealType, mealName and feedback are required',
      });
    }

    const log = await MealFeedback.create({
      userId: req.params.userId,
      mealType,
      mealName,
      feedback,
    });

    return res.status(201).json({
      success: true,
      message: 'Meal feedback saved',
      log,
    });
  } catch (error) {
    console.error('Save meal feedback error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save meal feedback',
    });
  }
});

router.get('/:userId/recent', async (req, res) => {
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

    const limit = Math.min(Math.max(Number(req.query.limit || 4), 1), 20);

    const logs = await MealFeedback.find({ userId: req.params.userId })
      .sort({ loggedAt: -1, _id: -1 })
      .limit(limit);

    return res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('Get recent meal feedback error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recent meal feedback',
    });
  }
});

router.get('/:userId/summary', async (req, res) => {
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

    const { start, end } = getTodayRange();

    const logs = await MealFeedback.find({
      userId: req.params.userId,
      loggedAt: { $gte: start, $lt: end },
    }).sort({ loggedAt: -1, _id: -1 });

    const goodCounts = new Map();
    const latestGoodLogByMeal = new Map();

    logs.forEach((log) => {
      if (log.feedback !== 'good') {
        return;
      }

      const currentCount = goodCounts.get(log.mealName) || 0;
      goodCounts.set(log.mealName, currentCount + 1);

      if (!latestGoodLogByMeal.has(log.mealName)) {
        latestGoodLogByMeal.set(log.mealName, log);
      }
    });

    let topFoodToday = null;
    let topFoodGoodCount = 0;
    let topFoodLatest = null;

    for (const [mealName, count] of goodCounts.entries()) {
      const latestLog = latestGoodLogByMeal.get(mealName);

      if (
        count > topFoodGoodCount ||
        (count === topFoodGoodCount && latestLog && topFoodLatest && latestLog.loggedAt > topFoodLatest.loggedAt)
      ) {
        topFoodToday = mealName;
        topFoodGoodCount = count;
        topFoodLatest = latestLog;
      }
    }

    return res.json({
      success: true,
      summary: {
        mealsLoggedToday: logs.length,
        topFoodToday,
        topFoodGoodCount,
        totalGoodMealsToday: logs.filter((log) => log.feedback === 'good').length,
        date: start.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get meal feedback summary error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch meal summary',
    });
  }
});

module.exports = router;
