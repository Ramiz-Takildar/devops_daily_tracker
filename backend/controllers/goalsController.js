const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

/**
 * Get all goals for user
 */
const getAllGoals = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT g.*,
             t.name as tool_name,
             t.color as tool_color,
             CASE 
               WHEN g.end_date < CURRENT_DATE AND g.status = 'active' THEN 'overdue'
               ELSE g.status
             END as computed_status,
             ROUND((g.current_value / NULLIF(g.target_value, 0)) * 100, 2) as progress_percentage
      FROM learning_goals g
      LEFT JOIN tools t ON g.tool_id = t.id
      WHERE g.user_id = $1
    `;

    const params = [req.user.userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      queryText += ` AND g.status = $${paramCount}`;
      params.push(status);
    }

    queryText += ` ORDER BY 
      CASE g.status 
        WHEN 'active' THEN 1 
        WHEN 'completed' THEN 2 
        WHEN 'failed' THEN 3 
        WHEN 'cancelled' THEN 4 
      END,
      g.end_date ASC`;

    paramCount++;
    queryText += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    queryText += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await query(queryText, params);

    res.json({
      success: true,
      goals: result.rows
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goals'
    });
  }
};

/**
 * Get single goal
 */
const getGoalById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT g.*,
              t.name as tool_name,
              t.color as tool_color,
              ROUND((g.current_value / NULLIF(g.target_value, 0)) * 100, 2) as progress_percentage
       FROM learning_goals g
       LEFT JOIN tools t ON g.tool_id = t.id
       WHERE g.id = $1 AND g.user_id = $2`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }

    res.json({
      success: true,
      goal: result.rows[0]
    });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goal'
    });
  }
};

/**
 * Create new goal
 */
const createGoal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { goalType, title, description, targetValue, toolId, startDate, endDate } = req.body;

    const result = await query(
      `INSERT INTO learning_goals 
       (user_id, goal_type, title, description, target_value, tool_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.userId, goalType, title, description, targetValue, toolId, startDate, endDate]
    );

    // Update current value based on existing data
    await updateGoalProgress(result.rows[0].id);

    // Get updated goal
    const updatedGoal = await query(
      `SELECT g.*,
              t.name as tool_name,
              ROUND((g.current_value / NULLIF(g.target_value, 0)) * 100, 2) as progress_percentage
       FROM learning_goals g
       LEFT JOIN tools t ON g.tool_id = t.id
       WHERE g.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      goal: updatedGoal.rows[0]
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create goal'
    });
  }
};

/**
 * Update goal
 */
const updateGoal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, description, targetValue, status, endDate } = req.body;

    // Check if goal exists
    const existing = await query(
      'SELECT * FROM learning_goals WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }

    const result = await query(
      `UPDATE learning_goals 
       SET title = $1, description = $2, target_value = $3, status = $4, end_date = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, description, targetValue, status, endDate, id, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Goal updated successfully',
      goal: result.rows[0]
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update goal'
    });
  }
};

/**
 * Delete goal
 */
const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM learning_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete goal'
    });
  }
};

/**
 * Update goal progress (called internally)
 */
const updateGoalProgress = async (goalId) => {
  try {
    const goalResult = await query(
      'SELECT * FROM learning_goals WHERE id = $1',
      [goalId]
    );

    if (goalResult.rows.length === 0) return;

    const goal = goalResult.rows[0];
    let currentValue = 0;

    switch (goal.goal_type) {
      case 'weekly_hours':
        // Calculate hours for current week
        const weekResult = await query(
          `SELECT COALESCE(SUM(hours_spent), 0) as total
           FROM daily_entries
           WHERE user_id = $1 
           AND date >= DATE_TRUNC('week', CURRENT_DATE)
           AND date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'`,
          [goal.user_id]
        );
        currentValue = parseFloat(weekResult.rows[0].total);
        break;

      case 'monthly_hours':
        // Calculate hours for current month
        const monthResult = await query(
          `SELECT COALESCE(SUM(hours_spent), 0) as total
           FROM daily_entries
           WHERE user_id = $1 
           AND date >= DATE_TRUNC('month', CURRENT_DATE)
           AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
          [goal.user_id]
        );
        currentValue = parseFloat(monthResult.rows[0].total);
        break;

      case 'tool_mastery':
        // Calculate hours for specific tool
        if (goal.tool_id) {
          const toolResult = await query(
            `SELECT COALESCE(total_hours, 0) as total
             FROM tool_proficiency
             WHERE user_id = $1 AND tool_id = $2`,
            [goal.user_id, goal.tool_id]
          );
          currentValue = toolResult.rows.length > 0 ? parseFloat(toolResult.rows[0].total) : 0;
        }
        break;

      case 'project_completion':
        // Count completed projects
        const projectResult = await query(
          `SELECT COUNT(*) as total
           FROM projects
           WHERE user_id = $1 AND status = 'Completed'
           AND created_at >= $2`,
          [goal.user_id, goal.start_date]
        );
        currentValue = parseInt(projectResult.rows[0].total);
        break;

      case 'streak':
        // Get current streak
        const streakResult = await query(
          'SELECT current_streak FROM learning_streaks WHERE user_id = $1',
          [goal.user_id]
        );
        currentValue = streakResult.rows.length > 0 ? streakResult.rows[0].current_streak : 0;
        break;
    }

    // Update goal
    let status = goal.status;
    let completedAt = goal.completed_at;

    if (currentValue >= goal.target_value && status === 'active') {
      status = 'completed';
      completedAt = new Date();

      // Check for goal achievement
      await checkGoalAchievement(goal.user_id);

      // Create notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message, metadata)
         VALUES ($1, 'goal', $2, $3, $4)`,
        [
          goal.user_id,
          'Goal Completed! 🎯',
          `Congratulations! You've achieved your goal: "${goal.title}"`,
          JSON.stringify({ goal_id: goalId })
        ]
      );
    } else if (new Date() > new Date(goal.end_date) && status === 'active' && currentValue < goal.target_value) {
      status = 'failed';
    }

    await query(
      `UPDATE learning_goals 
       SET current_value = $1, status = $2, completed_at = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [currentValue, status, completedAt, goalId]
    );
  } catch (error) {
    console.error('Update goal progress error:', error);
  }
};

/**
 * Update all active goals (called by scheduler)
 */
const updateAllGoals = async () => {
  try {
    const result = await query(
      'SELECT id FROM learning_goals WHERE status = $1',
      ['active']
    );

    for (const goal of result.rows) {
      await updateGoalProgress(goal.id);
    }

    console.log(`Updated ${result.rows.length} active goals`);
  } catch (error) {
    console.error('Update all goals error:', error);
  }
};

/**
 * Helper: Check goal achievement
 */
const checkGoalAchievement = async (userId) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as completed_count 
       FROM learning_goals 
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );

    const completedCount = parseInt(result.rows[0].completed_count);

    if (completedCount >= 1) {
      // Check if already earned
      const earned = await query(
        `SELECT ua.id FROM user_achievements ua
         JOIN achievements a ON ua.achievement_id = a.id
         WHERE ua.user_id = $1 AND a.name = 'Goal Getter'`,
        [userId]
      );

      if (earned.rows.length === 0) {
        // Award achievement
        const achResult = await query(
          'SELECT id, points FROM achievements WHERE name = $1',
          ['Goal Getter']
        );

        if (achResult.rows.length > 0) {
          await query(
            'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
            [userId, achResult.rows[0].id]
          );

          // Add points
          await query(
            `INSERT INTO user_points (user_id, total_points)
             VALUES ($1, $2)
             ON CONFLICT (user_id) 
             DO UPDATE SET total_points = user_points.total_points + $2`,
            [userId, achResult.rows[0].points]
          );

          // Create notification
          await query(
            `INSERT INTO notifications (user_id, type, title, message)
             VALUES ($1, 'achievement', $2, $3)`,
            [userId, 'Achievement Unlocked!', 'You\'ve earned the "Goal Getter" badge!']
          );
        }
      }
    }
  } catch (error) {
    console.error('Check goal achievement error:', error);
  }
};

/**
 * Validation rules
 */
const goalValidation = [
  body('goalType')
    .isIn(['weekly_hours', 'monthly_hours', 'tool_mastery', 'project_completion', 'streak'])
    .withMessage('Invalid goal type'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('targetValue')
    .isFloat({ min: 0.1 })
    .withMessage('Target value must be greater than 0'),
  body('toolId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid tool ID'),
  body('startDate')
    .isDate()
    .withMessage('Valid start date is required'),
  body('endDate')
    .isDate()
    .withMessage('Valid end date is required')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

const updateGoalValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('targetValue')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Target value must be greater than 0'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'failed', 'cancelled'])
    .withMessage('Invalid status'),
  body('endDate')
    .optional()
    .isDate()
    .withMessage('Invalid end date')
];

module.exports = {
  getAllGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  updateAllGoals,
  goalValidation,
  updateGoalValidation
};
