const { query } = require('../config/database');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get total hours
    const hoursResult = await query(
      'SELECT COALESCE(SUM(hours_spent), 0) as total_hours FROM daily_entries WHERE user_id = $1',
      [userId]
    );

    // Get project counts
    const projectsResult = await query(
      `SELECT 
         COUNT(*) as total_projects,
         COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as active_projects,
         COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_projects
       FROM projects WHERE user_id = $1`,
      [userId]
    );

    // Get streak info
    const streakResult = await query(
      'SELECT current_streak, longest_streak, total_days_active FROM learning_streaks WHERE user_id = $1',
      [userId]
    );

    // Get tool stats
    const toolStatsResult = await query(
      `SELECT t.name, t.color, t.icon, 
              COALESCE(SUM(de.hours_spent), 0) as total_hours,
              COUNT(DISTINCT de.date) as days_practiced
       FROM tools t
       LEFT JOIN daily_entries de ON t.id = de.tool_id AND de.user_id = $1
       GROUP BY t.id, t.name, t.color, t.icon
       HAVING SUM(de.hours_spent) > 0
       ORDER BY total_hours DESC
       LIMIT 8`,
      [userId]
    );

    // Calculate percentages for tool stats
    const totalHours = parseFloat(hoursResult.rows[0].total_hours);
    const toolStats = toolStatsResult.rows.map(tool => ({
      ...tool,
      total_hours: parseFloat(tool.total_hours),
      percentage: totalHours > 0 ? Math.round((parseFloat(tool.total_hours) / totalHours) * 100) : 0
    }));

    // Get recent activities (last 10)
    const recentActivitiesResult = await query(
      `SELECT activity_type, title, description, activity_date, created_at
       FROM recent_activity
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Get active projects
    const activeProjectsResult = await query(
      `SELECT id, name, description, tech_stack, status, completion_percentage, 
              start_date, end_date, updated_at
       FROM projects
       WHERE user_id = $1 AND status IN ('In Progress', 'Not Started')
       ORDER BY updated_at DESC
       LIMIT 5`,
      [userId]
    );

    // Get user level and points
    const pointsResult = await query(
      'SELECT total_points, level, points_to_next_level FROM user_points WHERE user_id = $1',
      [userId]
    );

    // Get tools mastered count (50+ hours)
    const masteredToolsResult = await query(
      `SELECT COUNT(DISTINCT tool_id) as count
       FROM tool_proficiency
       WHERE user_id = $1 AND total_hours >= 50`,
      [userId]
    );

    const stats = {
      totalHours: parseFloat(hoursResult.rows[0].total_hours),
      totalProjects: parseInt(projectsResult.rows[0].total_projects),
      activeProjects: parseInt(projectsResult.rows[0].active_projects),
      completedProjects: parseInt(projectsResult.rows[0].completed_projects),
      currentStreak: streakResult.rows[0]?.current_streak || 0,
      longestStreak: streakResult.rows[0]?.longest_streak || 0,
      totalDaysActive: streakResult.rows[0]?.total_days_active || 0,
      toolsMastered: parseInt(masteredToolsResult.rows[0].count),
      level: pointsResult.rows[0]?.level || 1,
      totalPoints: pointsResult.rows[0]?.total_points || 0,
      pointsToNextLevel: pointsResult.rows[0]?.points_to_next_level || 100,
      toolStats,
      recentActivities: recentActivitiesResult.rows,
      activeProjectsList: activeProjectsResult.rows
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
};

/**
 * Get tool usage analytics
 */
const getToolUsage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    let queryText = `
      SELECT t.id, t.name, t.color, t.icon, t.category,
             COALESCE(SUM(de.hours_spent), 0) as total_hours,
             COUNT(DISTINCT de.date) as days_practiced,
             MAX(de.date) as last_practiced,
             tp.proficiency_level,
             tp.consistency_score
      FROM tools t
      LEFT JOIN daily_entries de ON t.id = de.tool_id AND de.user_id = $1
      LEFT JOIN tool_proficiency tp ON t.id = tp.tool_id AND tp.user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (startDate || endDate) {
      queryText += ' WHERE';
      if (startDate) {
        paramCount++;
        queryText += ` de.date >= $${paramCount}`;
        params.push(startDate);
      }
      if (endDate) {
        if (startDate) queryText += ' AND';
        paramCount++;
        queryText += ` de.date <= $${paramCount}`;
        params.push(endDate);
      }
    }

    queryText += `
      GROUP BY t.id, t.name, t.color, t.icon, t.category, tp.proficiency_level, tp.consistency_score
      HAVING SUM(de.hours_spent) > 0
      ORDER BY total_hours DESC
    `;

    const result = await query(queryText, params);

    const toolUsage = result.rows.map(tool => ({
      ...tool,
      total_hours: parseFloat(tool.total_hours)
    }));

    res.json({
      success: true,
      toolUsage
    });
  } catch (error) {
    console.error('Get tool usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tool usage data'
    });
  }
};

/**
 * Get daily hours chart data
 */
const getDailyHours = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30 } = req.query;

    const result = await query(
      `SELECT date, SUM(hours_spent) as total_hours
       FROM daily_entries
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
       GROUP BY date
       ORDER BY date ASC`,
      [userId]
    );

    // Fill in missing dates with 0 hours
    const dailyHours = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    for (let i = 0; i < parseInt(days); i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const entry = result.rows.find(row => row.date.toISOString().split('T')[0] === dateStr);
      
      dailyHours.push({
        date: dateStr,
        hours: entry ? parseFloat(entry.total_hours) : 0
      });
    }

    res.json({
      success: true,
      dailyHours
    });
  } catch (error) {
    console.error('Get daily hours error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily hours data'
    });
  }
};

/**
 * Get time distribution (pie chart data)
 */
const getTimeDistribution = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    let queryText = `
      SELECT t.name, t.color, t.category,
             SUM(de.hours_spent) as total_hours
      FROM daily_entries de
      JOIN tools t ON de.tool_id = t.id
      WHERE de.user_id = $1
    `;

    const params = [userId];
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

    queryText += `
      GROUP BY t.id, t.name, t.color, t.category
      ORDER BY total_hours DESC
    `;

    const result = await query(queryText, params);

    const totalHours = result.rows.reduce((sum, row) => sum + parseFloat(row.total_hours), 0);

    const distribution = result.rows.map(row => ({
      name: row.name,
      color: row.color,
      category: row.category,
      hours: parseFloat(row.total_hours),
      percentage: totalHours > 0 ? Math.round((parseFloat(row.total_hours) / totalHours) * 100) : 0
    }));

    res.json({
      success: true,
      distribution,
      totalHours
    });
  } catch (error) {
    console.error('Get time distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time distribution data'
    });
  }
};

/**
 * Get learning streak information
 */
const getStreak = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT current_streak, longest_streak, last_activity_date, total_days_active
       FROM learning_streaks
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          totalDaysActive: 0,
          streakStatus: 'inactive'
        }
      });
    }

    const streak = result.rows[0];
    const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streakStatus = 'inactive';
    if (lastActivity) {
      const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysDiff === 0) {
        streakStatus = 'active';
      } else if (daysDiff === 1) {
        streakStatus = 'at_risk';
      } else {
        streakStatus = 'broken';
      }
    }

    res.json({
      success: true,
      streak: {
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        lastActivityDate: streak.last_activity_date,
        totalDaysActive: streak.total_days_active,
        streakStatus
      }
    });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch streak information'
    });
  }
};

/**
 * Get learning velocity (hours per week trend)
 */
const getLearningVelocity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { weeks = 12 } = req.query;

    const result = await query(
      `SELECT 
         DATE_TRUNC('week', date) as week_start,
         SUM(hours_spent) as total_hours,
         COUNT(DISTINCT date) as active_days
       FROM daily_entries
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${parseInt(weeks)} weeks'
       GROUP BY week_start
       ORDER BY week_start ASC`,
      [userId]
    );

    const velocity = result.rows.map(row => ({
      weekStart: row.week_start,
      totalHours: parseFloat(row.total_hours),
      activeDays: parseInt(row.active_days),
      avgHoursPerDay: parseFloat(row.total_hours) / parseInt(row.active_days)
    }));

    // Calculate trend
    let trend = 'stable';
    if (velocity.length >= 2) {
      const recentAvg = velocity.slice(-4).reduce((sum, w) => sum + w.totalHours, 0) / 4;
      const olderAvg = velocity.slice(0, 4).reduce((sum, w) => sum + w.totalHours, 0) / 4;
      
      if (recentAvg > olderAvg * 1.1) trend = 'increasing';
      else if (recentAvg < olderAvg * 0.9) trend = 'decreasing';
    }

    res.json({
      success: true,
      velocity,
      trend
    });
  } catch (error) {
    console.error('Get learning velocity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning velocity data'
    });
  }
};

/**
 * Get productivity heatmap data
 */
const getProductivityHeatmap = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year = new Date().getFullYear() } = req.query;

    const result = await query(
      `SELECT date, SUM(hours_spent) as total_hours
       FROM daily_entries
       WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
       GROUP BY date
       ORDER BY date ASC`,
      [userId, year]
    );

    const heatmap = result.rows.map(row => ({
      date: row.date,
      hours: parseFloat(row.total_hours),
      level: getHeatmapLevel(parseFloat(row.total_hours))
    }));

    res.json({
      success: true,
      heatmap
    });
  } catch (error) {
    console.error('Get productivity heatmap error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch heatmap data'
    });
  }
};

/**
 * Helper: Get heatmap level based on hours
 */
const getHeatmapLevel = (hours) => {
  if (hours === 0) return 0;
  if (hours < 1) return 1;
  if (hours < 2) return 2;
  if (hours < 4) return 3;
  return 4;
};

/**
 * Get tool proficiency radar chart data
 */
const getToolProficiency = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT t.name, t.color,
              tp.total_hours,
              tp.proficiency_level,
              tp.consistency_score,
              tp.practice_days
       FROM tool_proficiency tp
       JOIN tools t ON tp.tool_id = t.id
       WHERE tp.user_id = $1 AND tp.total_hours > 0
       ORDER BY tp.total_hours DESC
       LIMIT 8`,
      [userId]
    );

    const proficiency = result.rows.map(row => ({
      name: row.name,
      color: row.color,
      totalHours: parseFloat(row.total_hours),
      proficiencyLevel: row.proficiency_level,
      consistencyScore: row.consistency_score,
      practiceDays: row.practice_days,
      // Normalized score for radar chart (0-100)
      score: Math.min(100, (parseFloat(row.total_hours) / 100) * 100)
    }));

    res.json({
      success: true,
      proficiency
    });
  } catch (error) {
    console.error('Get tool proficiency error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proficiency data'
    });
  }
};

/**
 * Get personalized insights
 */
const getInsights = async (req, res) => {
  try {
    const userId = req.user.userId;
    const insights = [];

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

    if (statsResult.rows.length === 0) {
      return res.json({ success: true, insights: [] });
    }

    const stats = statsResult.rows[0];

    // Insight: Best learning day
    const dayResult = await query(
      `SELECT EXTRACT(DOW FROM date) as day_of_week, 
              SUM(hours_spent) as total_hours
       FROM daily_entries
       WHERE user_id = $1
       GROUP BY day_of_week
       ORDER BY total_hours DESC
       LIMIT 1`,
      [userId]
    );

    if (dayResult.rows.length > 0) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const bestDay = days[dayResult.rows[0].day_of_week];
      insights.push({
        type: 'pattern',
        icon: '📅',
        title: 'Best Learning Day',
        message: `You learn best on ${bestDay}s`
      });
    }

    // Insight: Streak warning
    if (stats.current_streak >= 7) {
      const lastActivity = await query(
        'SELECT last_activity_date FROM learning_streaks WHERE user_id = $1',
        [userId]
      );
      
      if (lastActivity.rows.length > 0) {
        const lastDate = new Date(lastActivity.rows[0].last_activity_date);
        const today = new Date();
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          insights.push({
            type: 'warning',
            icon: '⚠️',
            title: 'Streak at Risk',
            message: `Don't break your ${stats.current_streak}-day streak! Log your learning today.`
          });
        }
      }
    }

    // Insight: Tool recommendation
    const toolResult = await query(
      `SELECT t.name, tp.total_hours
       FROM tool_proficiency tp
       JOIN tools t ON tp.tool_id = t.id
       WHERE tp.user_id = $1
       ORDER BY tp.total_hours DESC
       LIMIT 1`,
      [userId]
    );

    if (toolResult.rows.length > 0) {
      const topTool = toolResult.rows[0].name;
      const recommendations = {
        'Docker': 'Kubernetes',
        'Git': 'Jenkins',
        'Linux': 'Docker',
        'Jenkins': 'Terraform',
        'Terraform': 'AWS',
        'AWS': 'Kubernetes',
        'Azure': 'Terraform'
      };

      if (recommendations[topTool]) {
        insights.push({
          type: 'recommendation',
          icon: '💡',
          title: 'Next Tool Suggestion',
          message: `Based on your ${topTool} skills, consider learning ${recommendations[topTool]} next`
        });
      }
    }

    // Insight: Milestone celebration
    if (stats.total_hours >= 100 && stats.total_hours < 110) {
      insights.push({
        type: 'celebration',
        icon: '🎉',
        title: 'Milestone Achieved!',
        message: `Congratulations! You've completed ${Math.floor(stats.total_hours)} hours of learning!`
      });
    }

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights'
    });
  }
};

module.exports = {
  getDashboardStats,
  getToolUsage,
  getDailyHours,
  getTimeDistribution,
  getStreak,
  getLearningVelocity,
  getProductivityHeatmap,
  getToolProficiency,
  getInsights
};
