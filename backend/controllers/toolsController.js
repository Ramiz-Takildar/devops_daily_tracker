const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

/**
 * Get all tools
 */
const getAllTools = async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, 
              COALESCE(tp.total_hours, 0) as user_total_hours,
              tp.proficiency_level,
              tp.last_practiced
       FROM tools t
       LEFT JOIN tool_proficiency tp ON t.id = tp.tool_id AND tp.user_id = $1
       ORDER BY t.name`,
      [req.user.userId]
    );

    res.json({
      success: true,
      tools: result.rows
    });
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tools'
    });
  }
};

/**
 * Get all daily entries with filters
 */
const getEntries = async (req, res) => {
  try {
    const { startDate, endDate, toolId, limit = 50, offset = 0 } = req.query;
    
    let queryText = `
      SELECT de.*, t.name as tool_name, t.color as tool_color, t.icon as tool_icon
      FROM daily_entries de
      JOIN tools t ON de.tool_id = t.id
      WHERE de.user_id = $1
    `;
    
    const params = [req.user.userId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      queryText += ` AND de.date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      queryText += ` AND de.date <= $${paramCount}`;
      params.push(endDate);
    }

    if (toolId) {
      paramCount++;
      queryText += ` AND de.tool_id = $${paramCount}`;
      params.push(toolId);
    }

    queryText += ` ORDER BY de.date DESC, de.created_at DESC`;
    
    paramCount++;
    queryText += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    queryText += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM daily_entries de
      WHERE de.user_id = $1
    `;
    const countParams = [req.user.userId];
    let countParamCount = 1;

    if (startDate) {
      countParamCount++;
      countQuery += ` AND de.date >= $${countParamCount}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countParamCount++;
      countQuery += ` AND de.date <= $${countParamCount}`;
      countParams.push(endDate);
    }

    if (toolId) {
      countParamCount++;
      countQuery += ` AND de.tool_id = $${countParamCount}`;
      countParams.push(toolId);
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      success: true,
      entries: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entries'
    });
  }
};

/**
 * Get entries by date
 */
const getEntriesByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const result = await query(
      `SELECT de.*, t.name as tool_name, t.color as tool_color, t.icon as tool_icon
       FROM daily_entries de
       JOIN tools t ON de.tool_id = t.id
       WHERE de.user_id = $1 AND de.date = $2
       ORDER BY de.created_at DESC`,
      [req.user.userId, date]
    );

    res.json({
      success: true,
      entries: result.rows
    });
  } catch (error) {
    console.error('Get entries by date error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entries'
    });
  }
};

/**
 * Create new entry
 */
const createEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { toolId, date, hoursSpent, notes } = req.body;

    // Create entry (allow multiple entries per tool per day)
    const result = await query(
      `INSERT INTO daily_entries (user_id, tool_id, date, hours_spent, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.userId, toolId, date, hoursSpent, notes]
    );

    // Update tool proficiency
    await updateToolProficiency(req.user.userId, toolId, hoursSpent, date);

    // Update streak
    await updateStreak(req.user.userId, date);

    // Check for achievements
    await checkAchievements(req.user.userId);

    // Get complete entry with tool info
    const entryResult = await query(
      `SELECT de.*, t.name as tool_name, t.color as tool_color, t.icon as tool_icon
       FROM daily_entries de
       JOIN tools t ON de.tool_id = t.id
       WHERE de.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'Entry created successfully',
      entry: entryResult.rows[0]
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create entry'
    });
  }
};

/**
 * Update entry
 */
const updateEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { hoursSpent, notes } = req.body;

    // Check if entry exists and belongs to user
    const existing = await query(
      'SELECT * FROM daily_entries WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    const oldHours = existing.rows[0].hours_spent;

    // Update entry
    const result = await query(
      `UPDATE daily_entries 
       SET hours_spent = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [hoursSpent, notes, id, req.user.userId]
    );

    // Update tool proficiency (adjust for difference)
    const hoursDiff = hoursSpent - oldHours;
    await updateToolProficiency(
      req.user.userId, 
      existing.rows[0].tool_id, 
      hoursDiff, 
      existing.rows[0].date
    );

    // Get complete entry with tool info
    const entryResult = await query(
      `SELECT de.*, t.name as tool_name, t.color as tool_color, t.icon as tool_icon
       FROM daily_entries de
       JOIN tools t ON de.tool_id = t.id
       WHERE de.id = $1`,
      [result.rows[0].id]
    );

    res.json({
      success: true,
      message: 'Entry updated successfully',
      entry: entryResult.rows[0]
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update entry'
    });
  }
};

/**
 * Delete entry
 */
const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if entry exists and belongs to user
    const existing = await query(
      'SELECT * FROM daily_entries WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    // Delete entry
    await query(
      'DELETE FROM daily_entries WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    // Update tool proficiency (subtract hours)
    await updateToolProficiency(
      req.user.userId,
      existing.rows[0].tool_id,
      -existing.rows[0].hours_spent,
      existing.rows[0].date
    );

    // Recalculate streak
    await recalculateStreak(req.user.userId);

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete entry'
    });
  }
};

/**
 * Helper: Update tool proficiency
 */
const updateToolProficiency = async (userId, toolId, hoursChange, practiceDate) => {
  try {
    // Get or create proficiency record
    const existing = await query(
      'SELECT * FROM tool_proficiency WHERE user_id = $1 AND tool_id = $2',
      [userId, toolId]
    );

    if (existing.rows.length === 0) {
      // Create new proficiency record
      await query(
        `INSERT INTO tool_proficiency (user_id, tool_id, total_hours, last_practiced, practice_days)
         VALUES ($1, $2, $3, $4, 1)`,
        [userId, toolId, Math.max(0, hoursChange), practiceDate]
      );
    } else {
      // Recalculate total hours from actual entries (don't use incremental update)
      const totalResult = await query(
        'SELECT COALESCE(SUM(hours_spent), 0) as total FROM daily_entries WHERE user_id = $1 AND tool_id = $2',
        [userId, toolId]
      );
      const newTotalHours = Number(totalResult.rows[0].total);
      console.log(`[updateToolProficiency] User ${userId}, Tool ${toolId}: Recalculated total = ${newTotalHours}h`);
      
      // Calculate proficiency level
      let proficiencyLevel = 'beginner';
      if (newTotalHours >= 100) proficiencyLevel = 'expert';
      else if (newTotalHours >= 50) proficiencyLevel = 'advanced';
      else if (newTotalHours >= 20) proficiencyLevel = 'intermediate';

      // Count practice days
      const daysResult = await query(
        'SELECT COUNT(DISTINCT date) as days FROM daily_entries WHERE user_id = $1 AND tool_id = $2',
        [userId, toolId]
      );
      const practiceDays = daysResult.rows[0].days;

      // Calculate consistency score (0-100)
      const daysSinceStart = await query(
        `SELECT EXTRACT(DAY FROM (CURRENT_DATE - MIN(date)::date))::integer as days 
         FROM daily_entries WHERE user_id = $1 AND tool_id = $2`,
        [userId, toolId]
      );
      const totalDays = Math.max(1, daysSinceStart.rows[0].days || 1);
      const consistencyScore = Math.min(100, Math.round((practiceDays / totalDays) * 100));

      await query(
        `UPDATE tool_proficiency 
         SET total_hours = $1, 
             proficiency_level = $2, 
             last_practiced = $3,
             practice_days = $4,
             consistency_score = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $6 AND tool_id = $7`,
        [newTotalHours, proficiencyLevel, practiceDate, practiceDays, consistencyScore, userId, toolId]
      );
    }
  } catch (error) {
    console.error('Update tool proficiency error:', error);
  }
};

/**
 * Helper: Update learning streak
 */
const updateStreak = async (userId, entryDate) => {
  try {
    const streakResult = await query(
      'SELECT * FROM learning_streaks WHERE user_id = $1',
      [userId]
    );

    if (streakResult.rows.length === 0) {
      // Create new streak record
      await query(
        `INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_activity_date, total_days_active)
         VALUES ($1, 1, 1, $2, 1)`,
        [userId, entryDate]
      );
      return;
    }

    const streak = streakResult.rows[0];
    const lastDate = new Date(streak.last_activity_date);
    const currentDate = new Date(entryDate);
    const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

    let newStreak = streak.current_streak;
    let newLongest = streak.longest_streak;

    if (daysDiff === 0) {
      // Same day, no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      newStreak += 1;
      newLongest = Math.max(newLongest, newStreak);
    } else if (daysDiff > 1) {
      // Streak broken
      newStreak = 1;
    }

    // Count total unique days
    const daysResult = await query(
      'SELECT COUNT(DISTINCT date) as days FROM daily_entries WHERE user_id = $1',
      [userId]
    );
    const totalDays = daysResult.rows[0].days;

    await query(
      `UPDATE learning_streaks 
       SET current_streak = $1, 
           longest_streak = $2, 
           last_activity_date = $3,
           total_days_active = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5`,
      [newStreak, newLongest, entryDate, totalDays, userId]
    );
  } catch (error) {
    console.error('Update streak error:', error);
  }
};

/**
 * Helper: Recalculate streak after deletion
 */
const recalculateStreak = async (userId) => {
  try {
    // Get all unique dates
    const datesResult = await query(
      'SELECT DISTINCT date FROM daily_entries WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );

    if (datesResult.rows.length === 0) {
      // No entries, reset streak
      await query(
        `UPDATE learning_streaks 
         SET current_streak = 0, last_activity_date = NULL, total_days_active = 0
         WHERE user_id = $1`,
        [userId]
      );
      return;
    }

    const dates = datesResult.rows.map(row => new Date(row.date));
    let currentStreak = 1;
    let longestStreak = 1;

    // Calculate current streak from most recent date
    for (let i = 0; i < dates.length - 1; i++) {
      const daysDiff = Math.floor((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        break;
      }
    }

    // Find longest streak in history
    let tempStreak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const daysDiff = Math.floor((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    await query(
      `UPDATE learning_streaks 
       SET current_streak = $1, 
           longest_streak = $2, 
           last_activity_date = $3,
           total_days_active = $4
       WHERE user_id = $5`,
      [currentStreak, longestStreak, dates[0], dates.length, userId]
    );
  } catch (error) {
    console.error('Recalculate streak error:', error);
  }
};

/**
 * Helper: Check and award achievements
 */
const checkAchievements = async (userId) => {
  try {
    // Get user stats
    const statsResult = await query(
      `SELECT 
         COALESCE(SUM(de.hours_spent), 0) as total_hours,
         COUNT(DISTINCT de.date) as total_days,
         ls.current_streak,
         ls.longest_streak
       FROM users u
       LEFT JOIN daily_entries de ON u.id = de.user_id
       LEFT JOIN learning_streaks ls ON u.id = ls.user_id
       WHERE u.id = $1
       GROUP BY u.id, ls.current_streak, ls.longest_streak`,
      [userId]
    );

    if (statsResult.rows.length === 0) return;

    const stats = statsResult.rows[0];

    // Check achievements
    const achievements = [
      { name: 'First Steps', condition: stats.total_days >= 1 },
      { name: 'Week Warrior', condition: stats.current_streak >= 7 },
      { name: 'Month Master', condition: stats.current_streak >= 30 },
      { name: 'Century Club', condition: stats.total_hours >= 100 },
      { name: 'Half Millennium', condition: stats.total_hours >= 500 },
      { name: 'Consistent Learner', condition: stats.current_streak >= 5 }
    ];

    for (const achievement of achievements) {
      if (achievement.condition) {
        // Check if already earned
        const earned = await query(
          `SELECT ua.id FROM user_achievements ua
           JOIN achievements a ON ua.achievement_id = a.id
           WHERE ua.user_id = $1 AND a.name = $2`,
          [userId, achievement.name]
        );

        if (earned.rows.length === 0) {
          // Award achievement
          const achResult = await query(
            'SELECT id, points FROM achievements WHERE name = $1',
            [achievement.name]
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
              [userId, 'Achievement Unlocked!', `You've earned the "${achievement.name}" badge!`]
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Check achievements error:', error);
  }
};

/**
 * Validation rules
 */
const entryValidation = [
  body('toolId')
    .isInt({ min: 1 })
    .withMessage('Valid tool ID is required'),
  body('date')
    .isDate()
    .withMessage('Valid date is required (YYYY-MM-DD)'),
  body('hoursSpent')
    .isFloat({ min: 0.1, max: 24 })
    .withMessage('Hours spent must be between 0.1 and 24'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

const updateEntryValidation = [
  body('hoursSpent')
    .isFloat({ min: 0.1, max: 24 })
    .withMessage('Hours spent must be between 0.1 and 24'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

module.exports = {
  getAllTools,
  getEntries,
  getEntriesByDate,
  createEntry,
  updateEntry,
  deleteEntry,
  entryValidation,
  updateEntryValidation
};
