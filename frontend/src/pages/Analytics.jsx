import { useEffect, useMemo, useState } from 'react';
import CountUp from 'react-countup';
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Download, Sparkles, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { LoadingSkeleton } from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const filters = [
  { label: 'Daily', value: 'daily', days: 14, weeks: 6 },
  { label: 'Weekly', value: 'weekly', days: 30, weeks: 8 },
  { label: 'Monthly', value: 'monthly', days: 90, weeks: 12 },
];

const chartPalette = ['#38bdf8', '#818cf8', '#22c55e', '#f59e0b', '#f472b6', '#a855f7', '#14b8a6'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('weekly');
  const [toolUsage, setToolUsage] = useState([]);
  const [dailyHours, setDailyHours] = useState([]);
  const [timeDistribution, setTimeDistribution] = useState([]);
  const [proficiency, setProficiency] = useState([]);
  const [velocity, setVelocity] = useState([]);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [filter]);

  const fetchAnalytics = async () => {
    setLoading(true);

    const selectedFilter = filters.find((item) => item.value === filter) || filters[1];

    try {
      const [
        toolUsageRes,
        dailyHoursRes,
        distributionRes,
        proficiencyRes,
        velocityRes,
        insightsRes,
      ] = await Promise.all([
        api.get('/dashboard/analytics/tool-usage'),
        api.get(`/dashboard/analytics/daily-hours?days=${selectedFilter.days}`),
        api.get('/dashboard/analytics/time-distribution'),
        api.get('/dashboard/analytics/proficiency'),
        api.get(`/dashboard/analytics/velocity?weeks=${selectedFilter.weeks}`),
        api.get('/dashboard/analytics/insights'),
      ]);

      setToolUsage(toolUsageRes.data.toolUsage || []);
      setDailyHours(dailyHoursRes.data.dailyHours || []);
      setTimeDistribution(distributionRes.data.distribution || []);
      setProficiency(proficiencyRes.data.proficiency || []);
      setVelocity(velocityRes.data.velocity || []);
      setInsights(insightsRes.data.insights || []);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await api.get(`/export/${type}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(type === 'analytics' ? 'Analytics exported ✅' : 'Entries exported ✅');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const sharedOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(56, 189, 248, 0.24)',
          borderWidth: 1,
          cornerRadius: 16,
          padding: 14,
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(148, 163, 184, 0.08)',
            drawBorder: false,
          },
          ticks: {
            color: '#94a3b8',
          },
        },
        y: {
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
            drawBorder: false,
          },
          ticks: {
            color: '#94a3b8',
          },
        },
      },
    }),
    []
  );

  const dailyHoursData = useMemo(
    () => ({
      labels: dailyHours.map((d) =>
        new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Learning Hours',
          data: dailyHours.map((d) => d.hours),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.18)',
          fill: true,
          tension: 0.38,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    }),
    [dailyHours]
  );

  const toolUsageData = useMemo(
    () => ({
      labels: toolUsage.map((item) => item.name),
      datasets: [
        {
          label: 'Hours',
          data: toolUsage.map((item) => item.total_hours),
          backgroundColor: toolUsage.map((item, index) => item.color || chartPalette[index % chartPalette.length]),
          borderRadius: 14,
          borderSkipped: false,
        },
      ],
    }),
    [toolUsage]
  );

  const distributionData = useMemo(
    () => ({
      labels: timeDistribution.map((item) => item.name),
      datasets: [
        {
          data: timeDistribution.map((item) => item.hours),
          backgroundColor: timeDistribution.map(
            (item, index) => item.color || chartPalette[index % chartPalette.length]
          ),
          borderColor: 'rgba(15, 23, 42, 0.12)',
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    }),
    [timeDistribution]
  );

  const proficiencyData = useMemo(
    () => ({
      labels: proficiency.map((item) => item.name),
      datasets: [
        {
          label: 'Proficiency',
          data: proficiency.map((item) => item.score),
          backgroundColor: 'rgba(129, 140, 248, 0.18)',
          borderColor: '#818cf8',
          borderWidth: 2,
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: '#ffffff',
        },
      ],
    }),
    [proficiency]
  );

  const radarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(56, 189, 248, 0.24)',
          borderWidth: 1,
          cornerRadius: 16,
          padding: 14,
        },
      },
      scales: {
        r: {
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
          },
          angleLines: {
            color: 'rgba(148, 163, 184, 0.12)',
          },
          pointLabels: {
            color: '#94a3b8',
          },
          ticks: {
            color: '#94a3b8',
            backdropColor: 'transparent',
          },
        },
      },
    }),
    []
  );

  const velocityData = useMemo(
    () => ({
      labels: velocity.map((item) =>
        new Date(item.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Weekly Hours',
          data: velocity.map((item) => item.totalHours),
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.14)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    }),
    [velocity]
  );

  const totals = useMemo(() => {
    const totalHours = toolUsage.reduce((sum, item) => sum + Number(item.total_hours || 0), 0);
    const averageHours =
      dailyHours.length > 0
        ? dailyHours.reduce((sum, item) => sum + Number(item.hours || 0), 0) / dailyHours.length
        : 0;

    return {
      totalHours,
      averageHours,
      tools: toolUsage.length,
    };
  }, [dailyHours, toolUsage]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="min-h-[180px]" title lines={4} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton key={index} className="min-h-[320px]" title lines={5} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Animated analytics layer"
        badgeIcon={Sparkles}
        title="Visualise your"
        highlightText="DevOps growth curve"
        subtitle="Explore premium charting, smooth transitions, and time-based filters across learning velocity, tool depth, and skill maturity."
        pattern="gradient"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-theme bg-[color:var(--surface-soft)] p-1 backdrop-blur-sm">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    filter === item.value
                      ? 'bg-[color:var(--accent)] text-white shadow-lg'
                      : 'text-theme-muted hover:text-theme'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleExport('entries')}
              className="btn btn-secondary btn-sm"
            >
              <Download size={16} />
              Export Entries
            </button>
            <button
              onClick={() => handleExport('analytics')}
              className="btn btn-primary btn-sm"
            >
              <Download size={16} />
              Export Analytics
            </button>
          </div>
        }
        rightContent={
          <div className="grid gap-4">
            <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-theme-muted">Quick Stats</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-theme-muted">Total Hours</span>
                  <span className="text-lg font-bold text-theme">{totals.totalHours.toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-theme-muted">Avg Daily</span>
                  <span className="text-lg font-bold text-theme">{totals.averageHours.toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-theme-muted">Tools Used</span>
                  <span className="text-lg font-bold text-theme">{totals.tools}</span>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {insights.length > 0 && (
        <section className="card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)]">
              <TrendingUp size={18} className="text-[color:var(--accent)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme">Personalised insights</h2>
              <p className="text-sm text-theme-muted">Smart observations based on your learning patterns.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {insights.map((insight, index) => (
              <div key={index} className="card card-hover p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--surface-soft)] text-2xl">
                    {insight.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-theme">{insight.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-theme-muted">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="stat-card">
          <p className="text-sm text-theme-muted">Total learning hours</p>
          <p className="mt-3 text-4xl font-bold text-theme">
            <CountUp end={totals.totalHours} decimals={1} duration={1.4} suffix="h" />
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-theme-muted">Tools practised</p>
          <p className="mt-3 text-4xl font-bold text-theme">
            <CountUp end={totals.tools} duration={1.1} />
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-theme-muted">Average per session window</p>
          <p className="mt-3 text-4xl font-bold text-theme">
            <CountUp end={totals.averageHours} decimals={1} duration={1.2} suffix="h" />
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 text-xl font-bold text-theme">Learning hours trend</h2>
          <div className="h-72">
            <Line data={dailyHoursData} options={sharedOptions} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-xl font-bold text-theme">Tool usage depth</h2>
          <div className="h-72">
            <Bar data={toolUsageData} options={sharedOptions} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-xl font-bold text-theme">Time distribution</h2>
          <div className="h-72">
            <Doughnut
              data={distributionData}
              options={{
                ...sharedOptions,
                cutout: '62%',
                scales: undefined,
              }}
            />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-xl font-bold text-theme">Tool proficiency radar</h2>
          <div className="h-72">
            <Radar data={proficiencyData} options={radarOptions} />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-xl font-bold text-theme">Learning velocity</h2>
        <div className="h-80">
          <Line data={velocityData} options={sharedOptions} />
        </div>
      </section>
    </div>
  );
};

export default Analytics;