const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getSettings,
  updateSettings,
  settingsValidation
} = require('../controllers/notificationsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications
 * @access  Private
 */
router.get('/', getNotifications);

/**
 * @route   POST /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/:id/read', markAsRead);

/**
 * @route   POST /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/read-all', markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

/**
 * @route   GET /api/notifications/settings
 * @desc    Get notification settings
 * @access  Private
 */
router.get('/settings', getSettings);

/**
 * @route   PUT /api/notifications/settings
 * @desc    Update notification settings
 * @access  Private
 */
router.put('/settings', settingsValidation, updateSettings);

module.exports = router;
