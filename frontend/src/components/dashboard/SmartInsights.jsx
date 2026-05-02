import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SmartInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedInsights, setDismissedInsights] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await api.get('/insights');
      setInsights(response.data.insights || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setDismissedInsights([]);
    toast.success('Insights refreshed');
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleDismiss = (index) => {
    setDismissedInsights([...dismissedInsights, index]);
  };

  const getInsightIcon = (type, icon) => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📊';
    }
  };

  const getInsightStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/5',
          border: 'border-emerald-500/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          icon: TrendingUp,
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/5',
          border: 'border-amber-500/20',
          text: 'text-amber-600 dark:text-amber-400',
          icon: AlertTriangle,
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-500/5',
          border: 'border-blue-500/20',
          text: 'text-blue-600 dark:text-blue-400',
          icon: Info,
        };
      default:
        return {
          bg: 'bg-slate-500/10 dark:bg-slate-500/5',
          border: 'border-slate-500/20',
          text: 'text-slate-600 dark:text-slate-400',
          icon: Info,
        };
    }
  };

  const visibleInsights = insights.filter((_, index) => !dismissedInsights.includes(index));

  if (loading) {
    return (
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[color:var(--accent)]" />
            <h2 className="text-xl font-bold text-theme">Smart Insights</h2>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[color:var(--surface-soft)]" />
          ))}
        </div>
      </section>
    );
  }

  if (visibleInsights.length === 0) {
    return (
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[color:var(--accent)]" />
            <h2 className="text-xl font-bold text-theme">Smart Insights</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh insights"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="empty-state border border-dashed border-theme py-8">
          <Sparkles size={40} className="mx-auto mb-3 text-theme-muted" />
          <p className="text-sm text-theme-muted">
            Start tracking your learning to see personalized insights
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[color:var(--accent)]" />
          <h2 className="text-xl font-bold text-theme">🧠 Smart Insights</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-secondary btn-sm"
          title="Refresh insights"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleInsights.map((insight, index) => {
            const styles = getInsightStyles(insight.type);
            const IconComponent = styles.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} p-4 transition-all hover:shadow-lg`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.bg}`}>
                    <span className="text-xl">{getInsightIcon(insight.type, insight.icon)}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-semibold ${styles.text}`}>
                          {insight.title}
                        </h3>
                        <p className="mt-1 text-sm text-theme-muted">
                          {insight.message}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDismiss(index)}
                        className="btn btn-secondary !h-8 !w-8 shrink-0 !rounded-lg !p-0 opacity-60 hover:opacity-100"
                        title="Dismiss"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {insight.score !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-theme-muted">Score</span>
                          <span className={`font-semibold ${styles.text}`}>
                            {insight.score}/100
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[color:var(--surface-soft)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${insight.score}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className={`h-full rounded-full ${
                              insight.score >= 80
                                ? 'bg-emerald-500'
                                : insight.score >= 50
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Decorative gradient */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl"
                  style={{
                    background: insight.color || 'var(--accent)',
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {dismissedInsights.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setDismissedInsights([])}
          className="mt-4 text-sm font-medium text-[color:var(--accent)] hover:underline"
        >
          Show {dismissedInsights.length} dismissed insight{dismissedInsights.length > 1 ? 's' : ''}
        </motion.button>
      )}
    </section>
  );
};

export default SmartInsights;
