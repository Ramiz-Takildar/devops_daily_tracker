const express = require('express');
const router = express.Router();
const {
  getAllAchievements,
  getEarnedAchievements,
  getUserPoints,
  getAchievementProgress,
  getLeaderboard
} = require('../controllers/achievementsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/achievements
 * @desc    Get all achievements (earned and locked)
 * @access  Private
 */
router.get('/', getAllAchievements);

/**
 * @route   GET /api/achievements/earned
 * @desc    Get user's earned achievements
 * @access  Private
 */
router.get('/earned', getEarnedAchievements);

/**
 * @route   GET /api/achievements/points
 * @desc    Get user points and level
 * @access  Private
 */
router.get('/points', getUserPoints);

/**
 * @route   GET /api/achievements/progress
 * @desc    Get achievement progress
 * @access  Private
 */
router.get('/progress', getAchievementProgress);

/**
 * @route   GET /api/achievements/leaderboard
 * @desc    Get leaderboard
 * @access  Private
 */
router.get('/leaderboard', getLeaderboard);

module.exports = router;
