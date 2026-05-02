import { useEffect, useMemo, useState } from 'react';
import CountUp from 'react-countup';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Award,
  Clock3,
  FolderKanban,
  Flame,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import LoadingSpinner, { LoadingSkeleton } from '../components/common/LoadingSpinner';
import SmartInsights from '../components/dashboard/SmartInsights';
import PageHeader from '../components/common/PageHeader';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler);

const rangeOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const Dashboard = () => {
  const { dashboardStats: stats, fetchDashboardStats } = useData();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('weekly');

  useEffect(() => {
    const loadStats = async () => {
      try {
        await fetchDashboardStats();
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [fetchDashboardStats]);

  const toolStats = stats?.toolStats || [];

  const filteredToolStats = useMemo(() => {
    if (!toolStats.length) return [];

    if (range === 'daily') {
      return toolStats.slice(0, 5);
    }

    if (range === 'monthly') {
      return [...toolStats]
        .sort((a, b) => b.total_hours - a.total_hours)
        .slice(0, 7);
    }

    return toolStats.slice(0, 6);
  }, [range, toolStats]);

  const chartData = useMemo(
    () => ({
      labels: filteredToolStats.map((tool) => tool.name),
      datasets: [
        {
          label: `${range.charAt(0).toUpperCase() + range.slice(1)} hours`,
          data: filteredToolStats.map((tool) => tool.total_hours),
          backgroundColor: filteredToolStats.map(
            (tool, index) =>
              tool.color ||
              ['#38bdf8', '#818cf8', '#22c55e', '#f59e0b', '#f472b6', '#a855f7', '#14b8a6'][index % 7]
          ),
          borderRadius: 14,
          borderSkipped: false,
          hoverBackgroundColor: filteredToolStats.map(
            (tool, index) =>
              tool.color ||
              ['#0ea5e9', '#6366f1', '#16a34a', '#d97706', '#ec4899', '#9333ea', '#0f766e'][index % 7]
          ),
        },
      ],
    }),
    [filteredToolStats, range]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(56, 189, 248, 0.28)',
          borderWidth: 1,
          padding: 14,
          displayColors: false,
          cornerRadius: 14,
          callbacks: {
            label: (context) => `${Number(context.raw).toFixed(1)}h focused`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: '#94a3b8',
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
            drawBorder: false,
          },
          ticks: {
            color: '#94a3b8',
            callback: (value) => `${value}h`,
          },
        },
      },
    }),
    []
  );

  const xpPoints = useMemo(() => Math.round((stats?.totalHours || 0) * 12), [stats?.totalHours]);
  const nextLevelXp = ((stats?.level || 1) + 1) * 500;
  const currentLevelXp = (stats?.level || 1) * 500;
  const xpProgress = Math.min(
    100,
    Math.round(((xpPoints - currentLevelXp) / Math.max(nextLevelXp - currentLevelXp, 1)) * 100)
  );

  const achievements = useMemo(
    () => [
      {
        title: '100 Hours Club',
        icon: '💯',
        unlocked: (stats?.totalHours || 0) >= 100,
        description: 'Crossed the 100 hour milestone',
      },
      {
        title: 'Docker Master',
        icon: '🐳',
        unlocked: toolStats.some((tool) => /docker/i.test(tool.name) && tool.total_hours >= 20),
        description: '20+ hours spent on Docker',
      },
      {
        title: '7-Day Streak',
        icon: '🔥',
        unlocked: (stats?.currentStreak || 0) >= 7,
        description: 'Stayed consistent for a full week',
      },
    ],
    [stats?.currentStreak, stats?.totalHours, toolStats]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton key={index} className="min-h-[170px]" title lines={3} />
          ))}
        </div>
        <LoadingSkeleton className="min-h-[320px]" title lines={6} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <LoadingSkeleton className="min-h-[280px] lg:col-span-2" title lines={5} />
          <LoadingSkeleton className="min-h-[280px]" title lines={5} avatar />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state card">
        <p className="text-base font-medium text-theme">Failed to load dashboard data</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Learning Hours',
      value: stats.totalHours,
      suffix: 'h',
      decimals: 1,
      meta: 'All time focus',
      icon: Clock3,
      accent: 'from-sky-500/20 to-cyan-500/10',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      meta: 'Currently building',
      icon: FolderKanban,
      accent: 'from-emerald-500/20 to-teal-500/10',
    },
    {
      title: 'Current Streak',
      value: stats.currentStreak,
      suffix: 'd',
      meta: 'Consistency streak',
      icon: Flame,
      accent: 'from-amber-500/20 to-orange-500/10',
    },
    {
      title: 'Tools Mastered',
      value: stats.toolsMastered,
      meta: '50+ hour champions',
      icon: Award,
      accent: 'from-violet-500/20 to-fuchsia-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Modern DevOps dashboard"
        badgeIcon={Sparkles}
        title="Stay in control of your"
        highlightText="learning momentum"
        subtitle="Visualise hours, projects, streaks, and achievements in one premium workspace inspired by modern productivity dashboards."
        pattern="gradient"
        rightContent={
          <div className="grid gap-4">
            <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-theme-muted">XP Progress</p>
                  <p className="mt-2 text-2xl font-bold text-theme">{xpPoints} XP</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,var(--accent),#8b5cf6)] text-white shadow-lg">
                  <Trophy size={24} />
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-theme-muted">
                  <span>Level {stats.level || 1}</span>
                  <span>{xpProgress > 0 ? xpProgress : 0}% to next</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.max(xpProgress, 8)}%` }} />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-theme-muted">Performance snapshot</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-[color:var(--surface)] px-3 py-3">
                  <p className="text-lg font-semibold text-theme">{toolStats.length}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-theme-muted">Tools</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--surface)] px-3 py-3">
                  <p className="text-lg font-semibold text-theme">{achievements.filter((item) => item.unlocked).length}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-theme-muted">Badges</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--surface)] px-3 py-3">
                  <p className="text-lg font-semibold text-theme">{stats.activeProjectsList?.length || 0}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-theme-muted">Boards</p>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item, index) => (
          <div key={item.title} className={`stat-card animate-[pageIn_380ms_ease] delay-${(index + 1) * 100}`}>
            <div className="mb-6 flex items-start justify-between">
              <div className={`rounded-3xl bg-gradient-to-br ${item.accent} p-3`}>
                <item.icon size={22} className="text-theme" />
              </div>
              <span className="rounded-full border border-theme bg-[color:var(--surface-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-muted">
                {item.meta}
              </span>
            </div>
            <div className="stat-value">
              <CountUp end={Number(item.value) || 0} duration={1.4} decimals={item.decimals || 0} suffix={item.suffix || ''} />
            </div>
            <div className="stat-label">{item.title}</div>
          </div>
        ))}
      </section>

      <SmartInsights />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-theme">Learning distribution</h2>
              <p className="mt-1 text-sm text-theme-muted">Animated usage overview with premium tooltips and range filters.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-theme bg-[color:var(--surface-soft)] p-1">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRange(option.value)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    range === option.value
                      ? 'bg-[color:var(--accent)] text-white shadow-lg'
                      : 'text-theme-muted hover:text-theme'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[320px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
          <div className="mt-5 flex justify-end">
            <Link to="/analytics" className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent)]">
              View deep analytics
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-theme">Recent activity</h2>
              <p className="mt-1 text-sm text-theme-muted">Live pulse from your workspace</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--surface-soft)]">
              <Activity size={18} className="text-[color:var(--accent)]" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.recentActivities?.slice(0, 5).map((activity, index) => (
              <div
                key={`${activity.activity_type}-${index}`}
                className="flex gap-3 rounded-2xl border border-theme bg-[color:var(--surface-soft)] p-4"
              >
                <div
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${
                    activity.activity_type === 'achievement'
                      ? 'bg-amber-400'
                      : activity.activity_type === 'project'
                      ? 'bg-emerald-400'
                      : 'bg-sky-400'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-theme">{activity.title}</p>
                  <p className="mt-1 text-xs leading-6 text-theme-muted">{activity.description}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-theme-muted">
                    {new Date(activity.activity_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {!stats.recentActivities?.length && (
              <div className="rounded-2xl border border-dashed border-theme px-4 py-8 text-center text-sm text-theme-muted">
                No recent activity yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-theme">Active projects</h2>
              <p className="mt-1 text-sm text-theme-muted">Premium project cards with progress and stack visibility.</p>
            </div>
            <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent)]">
              Open board
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.activeProjectsList?.slice(0, 3).map((project) => (
              <div key={project.id} className="card card-hover p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate text-base font-semibold text-theme">{project.name}</h3>
                  <span
                    className={`badge ${
                      project.status === 'In Progress'
                        ? 'badge-primary'
                        : project.status === 'Completed'
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="mt-3 min-h-[48px] text-sm leading-6 text-theme-muted">{project.description}</p>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-theme-muted">
                    <span>Progress</span>
                    <span>{project.completion_percentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${project.completion_percentage}%` }} />
                  </div>
                </div>
                {!!project.tech_stack?.length && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tech_stack.slice(0, 3).map((tech, index) => (
                      <span key={`${project.id}-${index}`} className="badge badge-info">
                        {tech}
                      </span>
                    ))}
                    {project.tech_stack.length > 3 && <span className="badge badge-info">+{project.tech_stack.length - 3}</span>}
                  </div>
                )}
              </div>
            ))}
            {!stats.activeProjectsList?.length && (
              <div className="empty-state col-span-full border border-dashed border-theme">
                <p>No active projects</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-theme">Achievement radar</h2>
                <p className="mt-1 text-sm text-theme-muted">Standout gamification moments.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--surface-soft)]">
                <Trophy size={18} className="text-[color:var(--accent)]" />
              </div>
            </div>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.title}
                  className={`rounded-2xl border p-4 ${
                    achievement.unlocked
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                      : 'border-theme bg-[color:var(--surface-soft)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--surface)] text-2xl">
                      {achievement.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-theme">{achievement.title}</p>
                      <p className="text-xs text-theme-muted">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-theme">Quick actions</h2>
            <div className="mt-5 grid grid-cols-1 gap-3">
              <Link to="/tools" className="card card-hover flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-semibold text-theme">Log learning</p>
                  <p className="mt-1 text-xs text-theme-muted">Add a new entry with instant feedback</p>
                </div>
                <ArrowRight size={16} className="text-[color:var(--accent)]" />
              </Link>
              <Link to="/projects" className="card card-hover flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-semibold text-theme">Update project board</p>
                  <p className="mt-1 text-xs text-theme-muted">Move work across Kanban stages</p>
                </div>
                <ArrowRight size={16} className="text-[color:var(--accent)]" />
              </Link>
              <Link to="/goals" className="card card-hover flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-semibold text-theme">Boost goals</p>
                  <p className="mt-1 text-xs text-theme-muted">Stay aligned with weekly learning targets</p>
                </div>
                <ArrowRight size={16} className="text-[color:var(--accent)]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="hidden">
        <LoadingSpinner size="sm" label="" />
      </div>
    </div>
  );
};

export default Dashboard;