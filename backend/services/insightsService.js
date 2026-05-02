const { query } = require('../config/database');

/**
 * Smart Insights Service
 * Analyzes user data and generates intelligent insights
 */

/**
 * Calculate weekly progress comparison
 */
const calculateWeeklyProgress = async (userId) => {
  try {
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Current week hours
    const currentWeekResult = await query(
      `SELECT COALESCE(SUM(hours_spent), 0) as total_hours
       FROM daily_entries
       WHERE user_id = $1 AND date >= $2`,
      [userId, currentWeekStart.toISOString().split('T')[0]]
    );

    // Last week hours
    const lastWeekResult = await query(
      `SELECT COALESCE(SUM(hours_spent), 0) as total_hours
       FROM daily_entries
       WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [userId, lastWeekStart.toISOString().split('T')[0], currentWeekStart.toISOString().split('T')[0]]
    );

    const currentHours = parseFloat(currentWeekResult.rows[0].total_hours);
    const lastHours = parseFloat(lastWeekResult.rows[0].total_hours);

    if (lastHours === 0) return null;

    const percentChange = ((currentHours - lastHours) / lastHours) * 100;

    return {
      currentWeekHours: currentHours,
      lastWeekHours: lastHours,
      percentChange: Math.round(percentChange),
      isImprovement: percentChange > 0
    };
  } catch (error) {
    console.error('Error calculating weekly progress:', error);
    return null;
  }
};

/**
 * Get most used tool
 */
const getMostUsedTool = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await query(
      `SELECT t.name, t.color, COALESCE(SUM(de.hours_spent), 0) as total_hours
       FROM tools t
       LEFT JOIN daily_entries de ON t.id = de.tool_id AND de.user_id = $1 AND de.date >= $2
       GROUP BY t.id, t.name, t.color
       HAVING SUM(de.hours_spent) > 0
       ORDER BY total_hours DESC
       LIMIT 1`,
      [userId, startDate.toISOString().split('T')[0]]
    );

    if (result.rows.length === 0) return null;

    return {
      toolName: result.rows[0].name,
      color: result.rows[0].color,
      hours: parseFloat(result.rows[0].total_hours)
    };
  } catch (error) {
    console.error('Error getting most used tool:', error);
    return null;
  }
};

/**
 * Detect inactive tools (not used in X days)
 */
const detectInactiveTools = async (userId, inactiveDays = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    const result = await query(
      `SELECT t.name, t.color, MAX(de.date) as last_used
       FROM tools t
       LEFT JOIN daily_entries de ON t.id = de.tool_id AND de.user_id = $1
       WHERE de.date IS NOT NULL
       GROUP BY t.id, t.name, t.color
       HAVING MAX(de.date) < $2
       ORDER BY MAX(de.date) ASC
       LIMIT 3`,
      [userId, cutoffDate.toISOString().split('T')[0]]
    );

    return result.rows.map(row => ({
      toolName: row.name,
      color: row.color,
      lastUsed: row.last_used,
      daysInactive: Math.floor((new Date() - new Date(row.last_used)) / (1000 * 60 * 60 * 24))
    }));
  } catch (error) {
    console.error('Error detecting inactive tools:', error);
    return [];
  }
};

/**
 * Calculate current learning streak
 */
const calculateStreak = async (userId) => {
  try {
    const result = await query(
      `SELECT date
       FROM daily_entries
       WHERE user_id = $1
       GROUP BY date
       ORDER BY date DESC
       LIMIT 30`,
      [userId]
    );

    if (result.rows.length === 0) return { currentStreak: 0, isAtRisk: false };

    const dates = result.rows.map(row => new Date(row.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);

    // Check if there's activity today or yesterday
    const lastActivityDate = dates[0];
    const daysSinceLastActivity = Math.floor((today - lastActivityDate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastActivity > 1) {
      return { currentStreak: 0, isAtRisk: false, daysSinceLastActivity };
    }

    // Calculate streak
    for (let i = 0; i < dates.length; i++) {
      const activityDate = dates[i];
      activityDate.setHours(0, 0, 0, 0);

      if (activityDate.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (activityDate.getTime() < checkDate.getTime()) {
        break;
      }
    }

    const isAtRisk = daysSinceLastActivity === 1;

    return { currentStreak: streak, isAtRisk, daysSinceLastActivity };
  } catch (error) {
    console.error('Error calculating streak:', error);
    return { currentStreak: 0, isAtRisk: false };
  }
};

/**
 * Get highest learning day of the week
 */
const getHighestLearningDay = async (userId) => {
  try {
    const result = await query(
      `SELECT 
         EXTRACT(DOW FROM date) as day_of_week,
         COALESCE(SUM(hours_spent), 0) as total_hours
       FROM daily_entries
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY day_of_week
       ORDER BY total_hours DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = parseInt(result.rows[0].day_of_week);

    return {
      dayName: dayNames[dayIndex],
      hours: parseFloat(result.rows[0].total_hours)
    };
  } catch (error) {
    console.error('Error getting highest learning day:', error);
    return null;
  }
};

/**
 * Calculate goal progress
 */
const calculateGoalProgress = async (userId) => {
  try {
    // Get active weekly goal
    const goalResult = await query(
      `SELECT target_hours, current_hours
       FROM goals
       WHERE user_id = $1 AND status = 'active' AND type = 'weekly'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (goalResult.rows.length === 0) return null;

    const { target_hours, current_hours } = goalResult.rows[0];
    const progress = (current_hours / target_hours) * 100;
    const remaining = target_hours - current_hours;

    return {
      targetHours: parseFloat(target_hours),
      currentHours: parseFloat(current_hours),
      progress: Math.round(progress),
      remainingHours: Math.max(0, parseFloat(remaining))
    };
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    return null;
  }
};

/**
 * Calculate productivity score (0-100)
 */
const calculateProductivityScore = async (userId) => {
  try {
    const weeklyProgress = await calculateWeeklyProgress(userId);
    const streak = await calculateStreak(userId);
    const goalProgress = await calculateGoalProgress(userId);

    let score = 50; // Base score

    // Streak contribution (max 25 points)
    if (streak.currentStreak > 0) {
      score += Math.min(25, streak.currentStreak * 3);
    }

    // Weekly progress contribution (max 25 points)
    if (weeklyProgress && weeklyProgress.currentWeekHours > 0) {
      if (weeklyProgress.isImprovement) {
        score += Math.min(15, weeklyProgress.percentChange / 4);
      }
      score += Math.min(10, weeklyProgress.currentWeekHours / 2);
    }

    // Goal progress contribution (max 25 points)
    if (goalProgress) {
      score += Math.min(25, goalProgress.progress / 4);
    }

    // Consistency penalty
    if (streak.isAtRisk) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  } catch (error) {
    console.error('Error calculating productivity score:', error);
    return 50;
  }
};

/**
 * Generate all insights for a user
 */
const generateInsights = async (userId) => {
  try {
    const insights = [];

    // 1. Weekly Progress Insight
    const weeklyProgress = await calculateWeeklyProgress(userId);
    if (weeklyProgress) {
      if (weeklyProgress.isImprovement && weeklyProgress.percentChange > 10) {
        insights.push({
          type: 'success',
          icon: '🔥',
          title: 'Great Progress!',
          message: `You studied ${Math.abs(weeklyProgress.percentChange)}% more this week compared to last week`,
          priority: 1
        });
      } else if (!weeklyProgress.isImprovement && weeklyProgress.percentChange < -20) {
        insights.push({
          type: 'warning',
          icon: '📉',
          title: 'Activity Drop',
          message: `Your learning time dropped by ${Math.abs(weeklyProgress.percentChange)}% this week`,
          priority: 2
        });
      }
    }

    // 2. Streak Insight
    const streak = await calculateStreak(userId);
    if (streak.currentStreak > 0) {
      if (streak.isAtRisk) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Streak at Risk',
          message: `Your ${streak.currentStreak}-day streak is at risk! Study today to keep it going`,
          priority: 1
        });
      } else if (streak.currentStreak >= 7) {
        insights.push({
          type: 'success',
          icon: '🔥',
          title: 'Amazing Streak!',
          message: `You're on a ${streak.currentStreak}-day learning streak. Keep it up!`,
          priority: 2
        });
      }
    } else if (streak.daysSinceLastActivity > 1) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Missed Days',
        message: `You haven't studied in ${streak.daysSinceLastActivity} days. Get back on track!`,
        priority: 1
      });
    }

    // 3. Most Used Tool
    const mostUsedTool = await getMostUsedTool(userId);
    if (mostUsedTool) {
      insights.push({
        type: 'info',
        icon: '🎯',
        title: 'Top Tool',
        message: `${mostUsedTool.toolName} is your most used tool (${mostUsedTool.hours.toFixed(1)}h this month)`,
        priority: 3,
        color: mostUsedTool.color
      });
    }

    // 4. Inactive Tools
    const inactiveTools = await detectInactiveTools(userId);
    if (inactiveTools.length > 0) {
      const tool = inactiveTools[0];
      insights.push({
        type: 'info',
        icon: '💤',
        title: 'Inactive Tool',
        message: `You haven't used ${tool.toolName} in ${tool.daysInactive} days`,
        priority: 4,
        color: tool.color
      });
    }

    // 5. Goal Progress
    const goalProgress = await calculateGoalProgress(userId);
    if (goalProgress) {
      if (goalProgress.progress >= 70 && goalProgress.progress < 100) {
        insights.push({
          type: 'success',
          icon: '🎯',
          title: 'Almost There!',
          message: `You're ${goalProgress.progress}% towards your weekly goal. Only ${goalProgress.remainingHours.toFixed(1)}h left!`,
          priority: 2
        });
      } else if (goalProgress.progress < 50) {
        insights.push({
          type: 'info',
          icon: '🎯',
          title: 'Goal Progress',
          message: `You need ${goalProgress.remainingHours.toFixed(1)} more hours to reach your weekly target`,
          priority: 3
        });
      } else if (goalProgress.progress >= 100) {
        insights.push({
          type: 'success',
          icon: '🎉',
          title: 'Goal Achieved!',
          message: `Congratulations! You've reached your weekly goal of ${goalProgress.targetHours}h`,
          priority: 1
        });
      }
    }

    // 6. Highest Learning Day
    const highestDay = await getHighestLearningDay(userId);
    if (highestDay) {
      insights.push({
        type: 'info',
        icon: '📈',
        title: 'Peak Day',
        message: `${highestDay.dayName} is your most productive learning day`,
        priority: 5
      });
    }

    // 7. Productivity Score
    const productivityScore = await calculateProductivityScore(userId);
    let scoreType = 'info';
    let scoreIcon = '📊';
    if (productivityScore >= 80) {
      scoreType = 'success';
      scoreIcon = '🌟';
    } else if (productivityScore < 50) {
      scoreType = 'warning';
      scoreIcon = '📉';
    }

    insights.push({
      type: scoreType,
      icon: scoreIcon,
      title: 'Productivity Score',
      message: `Your DevOps consistency score is ${productivityScore}/100`,
      priority: 6,
      score: productivityScore
    });

    // Sort by priority and limit to top 7
    return insights
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 7);

  } catch (error) {
    console.error('Error generating insights:', error);
    return [];
  }
};

module.exports = {
  generateInsights,
  calculateWeeklyProgress,
  getMostUsedTool,
  detectInactiveTools,
  calculateStreak,
  getHighestLearningDay,
  calculateGoalProgress,
  calculateProductivityScore
};
