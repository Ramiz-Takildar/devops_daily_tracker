const { query } = require('../config/database');

/**
 * Get all achievements
 */
const getAllAchievements = async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*,
              CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as earned,
              ua.earned_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       ORDER BY 
         CASE WHEN ua.id IS NOT NULL THEN 0 ELSE 1 END,
         a.tier DESC,
         a.points DESC`,
      [req.user.userId]
    );

    // Group by category
    const grouped = result.rows.reduce((acc, achievement) => {
      const category = achievement.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(achievement);
      return acc;
    }, {});

    res.json({
      success: true,
      achievements: result.rows,
      grouped
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements'
    });
  }
};

/**
 * Get user's earned achievements
 */
const getEarnedAchievements = async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, ua.earned_at
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      achievements: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get earned achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earned achievements'
    });
  }
};

/**
 * Get user points and level
 */
const getUserPoints = async (req, res) => {
  try {
    const result = await query(
      `SELECT up.*, 
              (SELECT COUNT(*) FROM user_achievements WHERE user_id = $1) as achievements_count
       FROM user_points up
       WHERE up.user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      // Create default points record
      await query(
        'INSERT INTO user_points (user_id) VALUES ($1)',
        [req.user.userId]
      );
      
      return res.json({
        success: true,
        points: {
          total_points: 0,
          level: 1,
          points_to_next_level: 100,
          achievements_count: 0
        }
      });
    }

    res.json({
      success: true,
      points: result.rows[0]
    });
  } catch (error) {
    console.error('Get user points error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user points'
    });
  }
};

/**
 * Get achievement progress
 */
const getAchievementProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user stats
    const statsResult = await query(
      `SELECT 
         COALESCE(SUM(de.hours_spent), 0) as total_hours,
         COUNT(DISTINCT de.date) as total_days,
         COUNT(DISTINCT de.tool_id) as tools_used,
         ls.current_streak,
         ls.longest_streak,
         (SELECT COUNT(*) FROM projects WHERE user_id = $1 AND status = 'Completed') as completed_projects
       FROM users u
       LEFT JOIN daily_entries de ON u.id = de.user_id
       LEFT JOIN learning_streaks ls ON u.id = ls.user_id
       WHERE u.id = $1
       GROUP BY u.id, ls.current_streak, ls.longest_streak`,
      [userId]
    );

    if (statsResult.rows.length === 0) {
      return res.json({
        success: true,
        progress: []
      });
    }

    const stats = statsResult.rows[0];

    // Get tool with most hours
    const toolResult = await query(
      `SELECT tool_id, total_hours
       FROM tool_proficiency
       WHERE user_id = $1
       ORDER BY total_hours DESC
       LIMIT 1`,
      [userId]
    );

    const maxToolHours = toolResult.rows.length > 0 ? parseFloat(toolResult.rows[0].total_hours) : 0;

    // Calculate progress for each achievement
    const progress = [
      {
        name: 'First Steps',
        current: stats.total_days >= 1 ? 1 : 0,
        target: 1,
        percentage: stats.total_days >= 1 ? 100 : 0
      },
      {
        name: 'Week Warrior',
        current: stats.current_streak,
        target: 7,
        percentage: Math.min(100, Math.round((stats.current_streak / 7) * 100))
      },
      {
        name: 'Month Master',
        current: stats.current_streak,
        target: 30,
        percentage: Math.min(100, Math.round((stats.current_streak / 30) * 100))
      },
      {
        name: 'Century Club',
        current: parseFloat(stats.total_hours),
        target: 100,
        percentage: Math.min(100, Math.round((parseFloat(stats.total_hours) / 100) * 100))
      },
      {
        name: 'Half Millennium',
        current: parseFloat(stats.total_hours),
        target: 500,
        percentage: Math.min(100, Math.round((parseFloat(stats.total_hours) / 500) * 100))
      },
      {
        name: 'Tool Master',
        current: maxToolHours,
        target: 50,
        percentage: Math.min(100, Math.round((maxToolHours / 50) * 100))
      },
      {
        name: 'Project Pioneer',
        current: parseInt(stats.completed_projects),
        target: 1,
        percentage: parseInt(stats.completed_projects) >= 1 ? 100 : 0
      },
      {
        name: 'Project Pro',
        current: parseInt(stats.completed_projects),
        target: 5,
        percentage: Math.min(100, Math.round((parseInt(stats.completed_projects) / 5) * 100))
      },
      {
        name: 'Consistent Learner',
        current: stats.current_streak,
        target: 5,
        percentage: Math.min(100, Math.round((stats.current_streak / 5) * 100))
      }
    ];

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Get achievement progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievement progress'
    });
  }
};

/**
 * Get leaderboard (if multiple users)
 */
const getLeaderboard = async (req, res) => {
  try {
    const { period = 'all_time', limit = 10 } = req.query;

    let queryText = `
      SELECT u.id, u.username,
             COALESCE(up.total_points, 0) as total_points,
             COALESCE(up.level, 1) as level,
             (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as achievements_count,
             COALESCE(ls.current_streak, 0) as current_streak
      FROM users u
      LEFT JOIN user_points up ON u.id = up.user_id
      LEFT JOIN learning_streaks ls ON u.id = ls.user_id
      WHERE u.is_active = true
    `;

    if (period === 'weekly') {
      queryText = `
        SELECT u.id, u.username,
               COALESCE(SUM(de.hours_spent), 0) as weekly_hours,
               COUNT(DISTINCT de.date) as active_days
        FROM users u
        LEFT JOIN daily_entries de ON u.id = de.user_id 
          AND de.date >= DATE_TRUNC('week', CURRENT_DATE)
        WHERE u.is_active = true
        GROUP BY u.id, u.username
        ORDER BY weekly_hours DESC, active_days DESC
        LIMIT $1
      `;
    } else if (period === 'monthly') {
      queryText = `
        SELECT u.id, u.username,
               COALESCE(SUM(de.hours_spent), 0) as monthly_hours,
               COUNT(DISTINCT de.date) as active_days
        FROM users u
        LEFT JOIN daily_entries de ON u.id = de.user_id 
          AND de.date >= DATE_TRUNC('month', CURRENT_DATE)
        WHERE u.is_active = true
        GROUP BY u.id, u.username
        ORDER BY monthly_hours DESC, active_days DESC
        LIMIT $1
      `;
    } else {
      queryText += ' ORDER BY up.total_points DESC, up.level DESC LIMIT $1';
    }

    const result = await query(queryText, [limit]);

    // Find current user's rank
    const userRank = result.rows.findIndex(row => row.id === req.user.userId) + 1;

    res.json({
      success: true,
      leaderboard: result.rows,
      userRank: userRank || null
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
};

module.exports = {
  getAllAchievements,
  getEarnedAchievements,
  getUserPoints,
  getAchievementProgress,
  getLeaderboard
};
