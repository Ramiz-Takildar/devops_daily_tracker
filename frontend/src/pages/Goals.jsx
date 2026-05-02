import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Target, TrendingUp, Calendar, Clock, Award, Zap, AlertCircle, CheckCircle2, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    goalType: 'weekly_hours',
    title: '',
    description: '',
    targetValue: '',
    toolId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [goalsRes, toolsRes] = await Promise.all([
        api.get('/goals'),
        api.get('/tools'),
      ]);
      setGoals(goalsRes.data.goals);
      setTools(toolsRes.data.tools);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate goal insights
  const goalInsights = useMemo(() => {
    const total = goals.length;
    const active = goals.filter(g => g.computed_status === 'active').length;
    const completed = goals.filter(g => g.computed_status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, active, completed, completionRate };
  }, [goals]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const goalData = {
      ...formData,
      targetValue: parseFloat(formData.targetValue),
      toolId: formData.toolId ? parseInt(formData.toolId) : null,
    };

    try {
      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, goalData);
        toast.success('Goal updated successfully');
      } else {
        await api.post('/goals', goalData);
        toast.success('Goal created successfully');
      }
      
      setShowModal(false);
      setEditingGoal(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save goal');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      goalType: goal.goal_type,
      title: goal.title,
      description: goal.description || '',
      targetValue: goal.target_value,
      toolId: goal.tool_id || '',
      startDate: goal.start_date.split('T')[0],
      endDate: goal.end_date.split('T')[0],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  const resetForm = () => {
    setFormData({
      goalType: 'weekly_hours',
      title: '',
      description: '',
      targetValue: '',
      toolId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });
  };

  const openNewGoalModal = () => {
    setEditingGoal(null);
    resetForm();
    setShowModal(true);
  };

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        label: 'Completed',
        icon: CheckCircle2,
      },
      failed: {
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        label: 'Failed',
        icon: AlertCircle,
      },
      overdue: {
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        label: 'Overdue',
        icon: AlertCircle,
      },
      active: {
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        label: 'Active',
        icon: Zap,
      },
    };
    return configs[status] || configs.active;
  };

  const getGoalTypeConfig = (type) => {
    const configs = {
      weekly_hours: { icon: Clock, label: 'Weekly Hours', color: '#3b82f6' },
      monthly_hours: { icon: Calendar, label: 'Monthly Hours', color: '#8b5cf6' },
      tool_mastery: { icon: Award, label: 'Tool Mastery', color: '#f59e0b' },
      project_completion: { icon: Target, label: 'Project', color: '#10b981' },
      streak: { icon: TrendingUp, label: 'Streak', color: '#ef4444' },
    };
    return configs[type] || configs.weekly_hours;
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#10b981'; // green
    if (percentage >= 50) return '#f59e0b'; // orange
    return '#ef4444'; // red
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
        badge="🎯 GOAL TRACKING"
        badgeIcon={Target}
        title="Track your"
        highlightText="learning goals"
        subtitle="Set ambitious targets and achieve them with focused effort"
        pattern="gradient"
        rightContent={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openNewGoalModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>New Goal</span>
          </motion.button>
        }
      />

      {/* Goal Insights Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-500">
              <Target size={24} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-theme">{goalInsights.total}</p>
          <p className="text-sm text-theme-muted">Total Goals</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-purple-500/10 text-purple-500">
              <Zap size={24} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-theme">{goalInsights.active}</p>
          <p className="text-sm text-theme-muted">Active Goals</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-green-500/10 text-green-500">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-theme">{goalInsights.completed}</p>
          <p className="text-sm text-theme-muted">Completed</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-500">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-theme">{goalInsights.completionRate}%</p>
          <p className="text-sm text-theme-muted">Success Rate</p>
        </div>
      </motion.div>

      {/* Goals Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {goals.map((goal, index) => {
            const typeConfig = getGoalTypeConfig(goal.goal_type);
            const statusConfig = getStatusConfig(goal.computed_status);
            const TypeIcon = typeConfig.icon;
            const StatusIcon = statusConfig.icon;
            const daysRemaining = getDaysRemaining(goal.end_date);
            const progressColor = getProgressColor(goal.progress_percentage);

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="card group relative overflow-hidden p-6"
              >
                {/* Background Gradient */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-5"
                  style={{
                    background: `linear-gradient(135deg, ${typeConfig.color}, transparent 70%)`,
                  }}
                />

                {/* Header */}
                <div className="relative z-10 mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}
                    >
                      <TypeIcon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
                        {typeConfig.label}
                      </p>
                      {daysRemaining >= 0 && (
                        <p className="text-xs text-theme-muted">
                          {daysRemaining === 0 ? 'Due today' : `${daysRemaining} days left`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
                    <StatusIcon size={12} className={statusConfig.color} />
                    <span className={`text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="mb-2 text-lg font-bold text-theme line-clamp-2">
                  {goal.title}
                </h3>

                {/* Description */}
                {goal.description && (
                  <p className="mb-4 text-sm text-theme-muted line-clamp-2">
                    {goal.description}
                  </p>
                )}

                {/* Progress */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-theme-muted">Progress</span>
                    <span className="font-semibold text-theme">
                      {goal.current_value} / {goal.target_value}
                      {goal.goal_type.includes('hours') ? 'h' : ''}
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-[color:var(--surface-soft)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: index * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: progressColor }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-theme-muted">
                      {goal.progress_percentage}% complete
                    </span>
                    {goal.progress_percentage >= 80 && goal.computed_status === 'active' && (
                      <span className="text-xs font-medium text-green-500">On track ✅</span>
                    )}
                    {goal.progress_percentage < 50 && daysRemaining < 3 && goal.computed_status === 'active' && (
                      <span className="text-xs font-medium text-orange-500">At risk ⚠️</span>
                    )}
                  </div>
                </div>

                {/* Tool Badge */}
                {goal.tool_name && (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-theme bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-medium text-theme">
                      <Award size={12} />
                      {goal.tool_name}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-theme pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(goal)}
                    className="btn btn-secondary btn-sm flex flex-1 items-center justify-center gap-2"
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(goal.id)}
                    className="btn btn-danger btn-sm flex flex-1 items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {goals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="empty-state"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--surface-soft)]">
            <Target size={40} className="text-theme-muted" />
          </div>
          <p className="mb-2 text-lg font-semibold text-theme">No goals yet</p>
          <p className="mb-4 text-sm text-theme-muted">Start setting learning goals to track your progress</p>
          <button onClick={openNewGoalModal} className="btn btn-primary">
            Create your first goal
          </button>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="modal-content max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-theme px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-theme-muted">Goal Management</p>
                  <h2 className="mt-2 text-xl font-bold text-theme">
                    {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                  </h2>
                </div>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="form-group">
                  <label htmlFor="goalType" className="label">
                    Goal Type *
                  </label>
                  <select
                    id="goalType"
                    value={formData.goalType}
                    onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
                    className="input"
                    required
                    disabled={!!editingGoal}
                  >
                    <option value="weekly_hours">Weekly Hours</option>
                    <option value="monthly_hours">Monthly Hours</option>
                    <option value="tool_mastery">Tool Mastery</option>
                    <option value="project_completion">Project Completion</option>
                    <option value="streak">Learning Streak</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="title" className="label">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="Complete 20 hours this week"
                    required
                    maxLength="200"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows="3"
                    placeholder="Describe your goal..."
                    maxLength="1000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="targetValue" className="label">
                    Target Value *
                  </label>
                  <input
                    type="number"
                    id="targetValue"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    className="input"
                    placeholder="20"
                    step="0.1"
                    min="0.1"
                    required
                  />
                </div>

                {formData.goalType === 'tool_mastery' && (
                  <div className="form-group">
                    <label htmlFor="toolId" className="label">
                      Tool *
                    </label>
                    <select
                      id="toolId"
                      value={formData.toolId}
                      onChange={(e) => setFormData({ ...formData, toolId: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Select a tool</option>
                      {tools.map((tool) => (
                        <option key={tool.id} value={tool.id}>
                          {tool.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="startDate" className="label">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endDate" className="label">
                      End Date *
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingGoal(null);
                      resetForm();
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Goals;