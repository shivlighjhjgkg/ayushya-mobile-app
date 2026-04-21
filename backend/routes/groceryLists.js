const express = require('express');
const GroceryList = require('../models/GroceryList');

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

router.get('/:userId/current', async (req, res) => {
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

    const { weekStart } = getWeekRange();

    const groceryList = await GroceryList.findOne({
      userId: req.params.userId,
      weekStart,
    });

    return res.json({
      success: true,
      groceryList,
    });
  } catch (error) {
    console.error('Get current grocery list error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch grocery list',
    });
  }
});

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

    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array of ingredient names',
      });
    }

    const cleanedItems = [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
    const { weekStart, weekEnd } = getWeekRange();

    const groceryList = await GroceryList.findOneAndUpdate(
      {
        userId: req.params.userId,
        weekStart,
      },
      {
        userId: req.params.userId,
        weekStart,
        weekEnd,
        items: cleanedItems,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      success: true,
      message: 'Weekly grocery list saved',
      groceryList,
    });
  } catch (error) {
    console.error('Save grocery list error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save grocery list',
    });
  }
});

module.exports = router;
