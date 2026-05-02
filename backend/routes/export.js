const express = require('express');
const router = express.Router();
const {
  exportEntries,
  exportProjects,
  exportAnalytics,
  exportCompleteReport
} = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/export/entries
 * @desc    Export daily entries as CSV
 * @access  Private
 */
router.get('/entries', exportEntries);

/**
 * @route   GET /api/export/projects
 * @desc    Export projects as CSV
 * @access  Private
 */
router.get('/projects', exportProjects);

/**
 * @route   GET /api/export/analytics
 * @desc    Export analytics summary as CSV
 * @access  Private
 */
router.get('/analytics', exportAnalytics);

/**
 * @route   GET /api/export/report
 * @desc    Export complete learning report
 * @access  Private
 */
router.get('/report', exportCompleteReport);

module.exports = router;
