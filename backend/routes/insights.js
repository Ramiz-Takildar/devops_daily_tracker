const express = require('express');
const router = express.Router();
const { generateInsights } = require('../services/insightsService');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/insights
 * @desc    Get smart insights for the authenticated user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const insights = await generateInsights(userId);

    res.json({
      success: true,
      insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights'
    });
  }
});

module.exports = router;
