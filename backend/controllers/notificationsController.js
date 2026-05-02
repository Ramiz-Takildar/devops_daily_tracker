const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

/**
 * Get all notifications for user
 */
const getNotifications = async (req, res) => {
  try {
    const { unreadOnly = false, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;

    const params = [req.user.userId];

    if (unreadOnly === 'true') {
      queryText += ' AND is_read = false';
    }

    queryText += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get unread count
    const countResult = await query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.userId]
    );

    res.json({
      success: true,
      notifications: result.rows,
      unreadCount: parseInt(countResult.rows[0].unread_count)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
};

/**
 * Get notification settings
 */
const getSettings = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notification_settings WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      // Create default settings
      const newSettings = await query(
        `INSERT INTO notification_settings (user_id) 
         VALUES ($1) 
         RETURNING *`,
        [req.user.userId]
      );
      return res.json({
        success: true,
        settings: newSettings.rows[0]
      });
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification settings'
    });
  }
};

/**
 * Update notification settings
 */
const updateSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      dailyReminderEnabled,
      reminderTime,
      achievementNotifications,
      emailNotifications,
      browserNotifications
    } = req.body;

    const result = await query(
      `UPDATE notification_settings 
       SET daily_reminder_enabled = $1,
           reminder_time = $2,
           achievement_notifications = $3,
           email_notifications = $4,
           browser_notifications = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6
       RETURNING *`,
      [
        dailyReminderEnabled,
        reminderTime,
        achievementNotifications,
        emailNotifications,
        browserNotifications,
        req.user.userId
      ]
    );

    if (result.rows.length === 0) {
      // Create settings if they don't exist
      const newSettings = await query(
        `INSERT INTO notification_settings 
         (user_id, daily_reminder_enabled, reminder_time, achievement_notifications, 
          email_notifications, browser_notifications)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.user.userId,
          dailyReminderEnabled,
          reminderTime,
          achievementNotifications,
          emailNotifications,
          browserNotifications
        ]
      );
      return res.json({
        success: true,
        message: 'Notification settings created successfully',
        settings: newSettings.rows[0]
      });
    }

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification settings'
    });
  }
};

/**
 * Create notification (internal use)
 */
const createNotification = async (userId, type, title, message, metadata = null) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

/**
 * Validation rules
 */
const settingsValidation = [
  body('dailyReminderEnabled')
    .optional()
    .isBoolean()
    .withMessage('Daily reminder enabled must be a boolean'),
  body('reminderTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('Reminder time must be in HH:MM:SS format'),
  body('achievementNotifications')
    .optional()
    .isBoolean()
    .withMessage('Achievement notifications must be a boolean'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('browserNotifications')
    .optional()
    .isBoolean()
    .withMessage('Browser notifications must be a boolean')
];

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getSettings,
  updateSettings,
  createNotification,
  settingsValidation
};
