const express = require('express');
const { assertRateLimit, getAqiRouteRecommendations, searchLocationSuggestions } = require('../services/aqiService');

const router = express.Router();

function handleError(res, error) {
  const status = error.status || 500;
  res.status(status).json({
    success: false,
    message: error.message || 'Failed to process AQI request',
  });
}

router.get('/suggestions', async (req, res) => {
  try {
    assertRateLimit(`aqi:suggestions:${req.ip}`, 60, 60 * 1000);

    const query = String(req.query.q || req.query.query || '').trim();
    const limit = Number(req.query.limit || 6);
    const response = await searchLocationSuggestions(query, limit);
    res.json(response);
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/routes', async (req, res) => {
  try {
    assertRateLimit(`aqi:routes:${req.ip}`, 25, 60 * 1000);

    const { fromText, toText, activity, options } = req.body || {};

    if (!fromText || !toText) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both fromText and toText',
      });
    }

    const response = await getAqiRouteRecommendations(fromText, toText, activity, options);
    res.json(response);
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;