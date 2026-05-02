import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Settings, Award, Target, TrendingUp, Zap, AlertCircle, CheckCircle2, X, Filter } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
    } catch (error) {
      toast.error('Failed to load notifications');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/notifications/settings');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Settings fetch error:', error);
    }
  };

  // Calculate notification insights
  const notificationInsights = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    const read = total - unread;
    const today = notifications.filter(n => {
      const notifDate = new Date(n.created_at);
      const now = new Date();
      return notifDate.toDateString() === now.toDateString();
    }).length;

    return { total, unread, read, today };
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => !n.is_read);
      case 'read':
        return notifications.filter(n => n.is_read);
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/notifications/settings', settings);
      toast.success('Settings updated successfully');
      setShowSettings(false);
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const getNotificationConfig = (type) => {
    const configs = {
      achievement: {
        icon: Award,
        color: '#f59e0b',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        emoji: '🏆',
      },
      milestone: {
        icon: Target,
        color: '#8b5cf6',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        emoji: '🎉',
      },
      goal: {
        icon: Target,
        color: '#3b82f6',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        emoji: '🎯',
      },
      streak: {
        icon: TrendingUp,
        color: '#ef4444',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        emoji: '🔥',
      },
      reminder: {
        icon: Bell,
        color: '#10b981',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        emoji: '⏰',
      },
    };
    return configs[type] || configs.reminder;
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PageHeader
        badge="🔔 NOTIFICATION CENTER"
        badgeIcon={Bell}
        title="Stay updated on your"
        highlightText="learning journey"
        subtitle="Track achievements, milestones, and important reminders"
        pattern="dots"
        rightContent={
          <div className="flex items-center gap-2">
            {notificationInsights.unread > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllAsRead}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>Mark All Read</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <Settings size={16} />
              <span>Settings</span>
            </motion.button>
          </div>
        }
      />

      {/* Notification Insights Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-500">
              <Bell size={24} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-theme">{notificationInsights.total}</p>
          <p className="text-sm text-theme-muted">Total Notifications</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-500">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-theme">{notificationInsights.unread}</p>
          <p className="text-sm text-theme-muted">Unread</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-green-500/10 text-green-500">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-theme">{notificationInsights.read}</p>
          <p className="text-sm text-theme-muted">Read</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-purple-500/10 text-purple-500">
              <Zap size={24} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-theme">{notificationInsights.today}</p>
          <p className="text-sm text-theme-muted">Today</p>
        </div>
      </motion.div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && settings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-theme">Notification Settings</h2>
                  <p className="text-sm text-theme-muted">Customize how you receive notifications</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="btn btn-secondary btn-sm">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="flex items-center justify-between rounded-2xl border border-theme bg-[color:var(--surface-soft)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                      <Bell size={20} />
                    </div>
                    <div>
                      <label className="font-semibold text-theme">Daily Reminders</label>
                      <p className="text-sm text-theme-muted">Get reminded to log your learning</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.daily_reminder_enabled}
                    onChange={(e) => setSettings({ ...settings, daily_reminder_enabled: e.target.checked })}
                    className="h-5 w-5 cursor-pointer"
                  />
                </div>

                {settings.daily_reminder_enabled && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="form-group"
                  >
                    <label className="label">Reminder Time</label>
                    <input
                      type="time"
                      value={settings.reminder_time}
                      onChange={(e) => setSettings({ ...settings, reminder_time: e.target.value })}
                      className="input"
                    />
                  </motion.div>
                )}

                <div className="flex items-center justify-between rounded-2xl border border-theme bg-[color:var(--surface-soft)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                      <Award size={20} />
                    </div>
                    <div>
                      <label className="font-semibold text-theme">Achievement Notifications</label>
                      <p className="text-sm text-theme-muted">Get notified when you earn badges</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.achievement_notifications}
                    onChange={(e) => setSettings({ ...settings, achievement_notifications: e.target.checked })}
                    className="h-5 w-5 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-theme bg-[color:var(--surface-soft)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10 text-green-500">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <label className="font-semibold text-theme">Browser Notifications</label>
                      <p className="text-sm text-theme-muted">Show notifications in your browser</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.browser_notifications}
                    onChange={(e) => setSettings({ ...settings, browser_notifications: e.target.checked })}
                    className="h-5 w-5 cursor-pointer"
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  Save Settings
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 overflow-x-auto"
      >
        {[
          { id: 'all', label: 'All', count: notificationInsights.total },
          { id: 'unread', label: 'Unread', count: notificationInsights.unread },
          { id: 'read', label: 'Read', count: notificationInsights.read },
        ].map((filter) => (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              activeFilter === filter.id
                ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                : 'border-theme bg-[color:var(--surface-soft)] text-theme hover:border-[color:var(--accent)]'
            }`}
          >
            <Filter size={14} />
            <span>{filter.label}</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{filter.count}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((notification, index) => {
            const config = getNotificationConfig(notification.type);
            const NotifIcon = config.icon;

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 4 }}
                className={`card group relative overflow-hidden p-4 ${
                  !notification.is_read ? 'border-l-4' : ''
                }`}
                style={{
                  borderLeftColor: !notification.is_read ? config.color : 'transparent',
                }}
              >
                {/* Background gradient */}
                {!notification.is_read && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-5"
                    style={{
                      background: `linear-gradient(90deg, ${config.color}, transparent 70%)`,
                    }}
                  />
                )}

                <div className="relative z-10 flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${config.bgColor}`}
                    style={{ color: config.color }}
                  >
                    <NotifIcon size={20} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-theme">{notification.title}</h3>
                      <span className="flex-shrink-0 text-xs text-theme-muted">
                        {getRelativeTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-theme-muted">{notification.message}</p>
                    
                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-500">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        New
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {!notification.is_read && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="rounded-lg p-2 text-green-500 hover:bg-green-500/10"
                        title="Mark as read"
                      >
                        <Check size={18} />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(notification.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="empty-state"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--surface-soft)]">
            <Bell size={40} className="text-theme-muted" />
          </div>
          <p className="mb-2 text-lg font-semibold text-theme">
            {activeFilter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </p>
          <p className="text-sm text-theme-muted">
            {activeFilter === 'unread'
              ? 'You have no unread notifications'
              : "You'll see your notifications here"}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Notifications;