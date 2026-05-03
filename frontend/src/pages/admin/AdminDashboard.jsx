import { useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { Users, FolderKanban, Wrench, Clock, Activity, TrendingUp, Sparkles, Award } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} className="min-h-[170px]" title lines={3} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LoadingSkeleton className="min-h-[280px]" title lines={5} />
            <LoadingSkeleton className="min-h-[280px]" title lines={5} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-12 text-center">
            <p className="text-base font-medium text-gray-900">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.stats?.total_users || 0,
      meta: 'Registered accounts',
      icon: Users,
      gradient: 'from-sky-500 to-cyan-500',
      bg: 'bg-sky-100',
    },
    {
      title: 'Active Users',
      value: stats?.stats?.active_users || 0,
      meta: 'Currently learning',
      icon: Activity,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Total Projects',
      value: stats?.stats?.total_projects || 0,
      meta: 'All projects',
      icon: FolderKanban,
      gradient: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-100',
    },
    {
      title: 'Total Tools',
      value: stats?.stats?.total_tools || 0,
      meta: 'Available tools',
      icon: Wrench,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-100',
    },
    {
      title: 'Total Hours',
      value: Math.round(stats?.stats?.total_hours || 0),
      suffix: 'h',
      meta: 'Learning time',
      icon: Clock,
      gradient: 'from-indigo-500 to-blue-500',
      bg: 'bg-indigo-100',
    },
    {
      title: 'Total Entries',
      value: stats?.stats?.total_entries || 0,
      meta: 'Time entries',
      icon: TrendingUp,
      gradient: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          badge="Admin Control Center"
          badgeIcon={Sparkles}
          title="System overview and"
          highlightText="management dashboard"
          subtitle="Monitor platform statistics, user activity, and system health in real-time with premium analytics."
          pattern="gradient"
        />

        {/* Stats Grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statCards.map((item, index) => (
            <div 
              key={item.title} 
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6 hover:shadow-lg transition-all"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-6 flex items-start justify-between">
                <div className={`rounded-xl ${item.bg} p-3`}>
                  <item.icon size={22} className={`text-${item.gradient.split(' ')[0].replace('from-', '').replace('-500', '-600')}`} />
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                  {item.meta}
                </span>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                <CountUp end={Number(item.value) || 0} duration={1.4} decimals={0} suffix={item.suffix || ''} />
              </div>
              <div className="text-sm font-medium text-gray-600">{item.title}</div>
            </div>
          ))}
        </section>

        {/* Most Used Tool */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Most Used Tool</h2>
              <p className="mt-1 text-sm text-gray-600">Platform-wide favorite learning tool</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
              <Award size={18} className="text-amber-600" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.mostUsedTool?.name || 'N/A'}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {stats?.mostUsedTool?.usage_count || 0} total uses across all users
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Activity Sections */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* User Growth */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">User Growth</h2>
                <p className="mt-1 text-sm text-gray-600">New registrations (Last 7 days)</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                <Users size={18} className="text-blue-600" />
              </div>
            </div>
            {stats?.userGrowth && stats.userGrowth.length > 0 ? (
              <div className="space-y-3">
                {stats.userGrowth.slice(-7).map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        +{day.count}
                      </span>
                      <span className="text-xs text-gray-500">users</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-xl">
                <p className="text-sm text-gray-500">No growth data available</p>
              </div>
            )}
          </div>

          {/* Daily Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Daily Activity</h2>
                <p className="mt-1 text-sm text-gray-600">Platform usage (Last 7 days)</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
                <Activity size={18} className="text-green-600" />
              </div>
            </div>
            {stats?.dailyActivity && stats.dailyActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.dailyActivity.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {day.entries}
                        </span>
                        <span className="text-xs text-gray-500">entries</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {Math.round(day.hours)}h
                        </span>
                        <span className="text-xs text-gray-500">logged</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-xl">
                <p className="text-sm text-gray-500">No activity data available</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
