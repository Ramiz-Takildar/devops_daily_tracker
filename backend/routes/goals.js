const express = require('express');
const router = express.Router();
const {
  getAllGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  goalValidation,
  updateGoalValidation
} = require('../controllers/goalsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/goals
 * @desc    Get all goals
 * @access  Private
 */
router.get('/', getAllGoals);

/**
 * @route   GET /api/goals/:id
 * @desc    Get goal by ID
 * @access  Private
 */
router.get('/:id', getGoalById);

/**
 * @route   POST /api/goals
 * @desc    Create new goal
 * @access  Private
 */
router.post('/', goalValidation, createGoal);

/**
 * @route   PUT /api/goals/:id
 * @desc    Update goal
 * @access  Private
 */
router.put('/:id', updateGoalValidation, updateGoal);

/**
 * @route   DELETE /api/goals/:id
 * @desc    Delete goal
 * @access  Private
 */
router.delete('/:id', deleteGoal);

module.exports = router;
