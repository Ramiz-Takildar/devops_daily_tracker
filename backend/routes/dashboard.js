const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getToolUsage,
  getDailyHours,
  getTimeDistribution,
  getStreak,
  getLearningVelocity,
  getProductivityHeatmap,
  getToolProficiency,
  getInsights
} = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', getDashboardStats);

/**
 * @route   GET /api/analytics/tool-usage
 * @desc    Get tool usage analytics
 * @access  Private
 */
router.get('/analytics/tool-usage', getToolUsage);

/**
 * @route   GET /api/analytics/daily-hours
 * @desc    Get daily hours chart data
 * @access  Private
 */
router.get('/analytics/daily-hours', getDailyHours);

/**
 * @route   GET /api/analytics/time-distribution
 * @desc    Get time distribution (pie chart)
 * @access  Private
 */
router.get('/analytics/time-distribution', getTimeDistribution);

/**
 * @route   GET /api/analytics/streak
 * @desc    Get learning streak info
 * @access  Private
 */
router.get('/analytics/streak', getStreak);

/**
 * @route   GET /api/analytics/velocity
 * @desc    Get learning velocity (hours per week trend)
 * @access  Private
 */
router.get('/analytics/velocity', getLearningVelocity);

/**
 * @route   GET /api/analytics/heatmap
 * @desc    Get productivity heatmap data
 * @access  Private
 */
router.get('/analytics/heatmap', getProductivityHeatmap);

/**
 * @route   GET /api/analytics/proficiency
 * @desc    Get tool proficiency radar chart data
 * @access  Private
 */
router.get('/analytics/proficiency', getToolProficiency);

/**
 * @route   GET /api/analytics/insights
 * @desc    Get personalized insights
 * @access  Private
 */
router.get('/analytics/insights', getInsights);

module.exports = router;
