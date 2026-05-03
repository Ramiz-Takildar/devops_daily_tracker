import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Wrench, Sparkles, Activity } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <LoadingSkeleton className="h-32" title lines={2} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-64" title lines={6} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          badge="Advanced Analytics"
          badgeIcon={Sparkles}
          title="Platform insights"
          highlightText="and trends"
          subtitle="Deep dive into user behavior, tool usage patterns, and activity trends with comprehensive analytics."
          pattern="gradient"
        />

        {/* Top Users */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Top Performing Users</h2>
              <p className="mt-1 text-sm text-gray-600">Most active learners on the platform</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <Users size={18} className="text-blue-600" />
            </div>
          </div>
          {analytics?.topUsers && analytics.topUsers.length > 0 ? (
            <div className="space-y-3">
              {analytics.topUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:bg-blue-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {Math.round(user.total_hours)}h
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.total_entries} entries
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-xl">
              <Users className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-base font-semibold text-gray-900">No user data available</p>
              <p className="text-sm text-gray-500 mt-1">User activity will appear here</p>
            </div>
          )}
        </div>

        {/* Tool Distribution */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tool Usage Distribution</h2>
              <p className="mt-1 text-sm text-gray-600">Most popular learning tools</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
              <Wrench size={18} className="text-green-600" />
            </div>
          </div>
          {analytics?.toolDistribution && analytics.toolDistribution.length > 0 ? (
            <div className="space-y-3">
              {analytics.toolDistribution.map((tool, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:bg-green-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{tool.name}</p>
                      <p className="text-xs text-gray-500">{tool.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {Math.round(tool.total_hours)}h
                      </p>
                      <p className="text-xs text-gray-500">
                        {tool.usage_count} uses
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {tool.unique_users} users
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-xl">
              <Wrench className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-base font-semibold text-gray-900">No tool data available</p>
              <p className="text-sm text-gray-500 mt-1">Tool usage will appear here</p>
            </div>
          )}
        </div>

        {/* Activity Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Daily Activity</h2>
                <p className="mt-1 text-sm text-gray-600">Last 7 days platform usage</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                <Activity size={18} className="text-purple-600" />
              </div>
            </div>
            {analytics?.dailyActivity && analytics.dailyActivity.length > 0 ? (
              <div className="space-y-3">
                {analytics.dailyActivity.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-purple-50 transition-colors"
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
                <Activity className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-base font-semibold text-gray-900">No activity data</p>
                <p className="text-sm text-gray-500 mt-1">Activity will appear here</p>
              </div>
            )}
          </div>

          {/* Growth Trends */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Growth Trends</h2>
                <p className="mt-1 text-sm text-gray-600">User registration trends</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
            </div>
            {analytics?.userGrowth && analytics.userGrowth.length > 0 ? (
              <div className="space-y-3">
                {analytics.userGrowth.slice(-7).map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-emerald-50 transition-colors"
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
                      <span className="text-xs text-gray-500">new users</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-xl">
                <TrendingUp className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-base font-semibold text-gray-900">No growth data</p>
                <p className="text-sm text-gray-500 mt-1">Growth trends will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;