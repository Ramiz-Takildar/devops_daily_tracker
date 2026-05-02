import { useEffect, useMemo, useState } from 'react';
import CountUp from 'react-countup';
import { Award, Flame, Lock, Sparkles, Star, Trophy } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LoadingSkeleton } from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';

const featuredBadges = [
  { key: '100 Hours Club', icon: '💯', description: 'Cross 100 total learning hours.' },
  { key: 'Docker Master', icon: '🐳', description: 'Reach mastery-level Docker practice.' },
  { key: '7-Day Streak', icon: '🔥', description: 'Maintain consistency for 7 days in a row.' },
];

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [points, setPoints] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [achievementsRes, pointsRes, progressRes] = await Promise.all([
        api.get('/achievements'),
        api.get('/achievements/points'),
        api.get('/achievements/progress'),
      ]);

      setAchievements(achievementsRes.data.achievements || []);
      setGrouped(achievementsRes.data.grouped || {});
      setPoints(pointsRes.data.points);
      setProgress(progressRes.data.progress || []);
    } catch (error) {
      toast.error('Failed to load achievements');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierClasses = (tier) => {
    switch (tier) {
      case 'platinum':
        return 'from-cyan-400 via-sky-500 to-indigo-500';
      case 'gold':
        return 'from-amber-300 via-yellow-400 to-orange-500';
      case 'silver':
        return 'from-slate-200 via-slate-300 to-slate-400';
      default:
        return 'from-orange-500 via-rose-500 to-pink-500';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      streak: '🔥',
      hours: '⏰',
      project: '📁',
      tool: '🛠️',
      consistency: '📚',
      goal: '🎯',
      milestone: '🎉',
    };

    return icons[category] || '🏆';
  };

  const earnedCount = useMemo(
    () => achievements.filter((achievement) => achievement.earned).length,
    [achievements]
  );

  const levelProgress = useMemo(() => {
    if (!points) return 0;

    const total = Number(points.total_points || 0);
    const currentLevelBase = Math.max((Number(points.level || 1) - 1) * 500, 0);
    const nextLevelBase = Number(points.level || 1) * 500;

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(((total - currentLevelBase) / Math.max(nextLevelBase - currentLevelBase, 1)) * 100)
      )
    );
  }, [points]);

  const spotlightBadges = useMemo(() => {
    return featuredBadges.map((badge) => {
      const matched =
        achievements.find((achievement) => achievement.name === badge.key) ||
        achievements.find((achievement) => achievement.name?.toLowerCase().includes(badge.key.toLowerCase()));

      return {
        ...badge,
        unlocked: Boolean(matched?.earned),
        points: matched?.points || 0,
        tier: matched?.tier || 'gold',
      };
    });
  }, [achievements]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="min-h-[180px]" title lines={4} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton key={index} className="min-h-[150px]" title lines={3} />
          ))}
        </div>
        <LoadingSkeleton className="min-h-[280px]" title lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Gamified growth system"
        badgeIcon={Sparkles}
        title="Unlock"
        highlightText="DevOps milestones"
        subtitle="Track XP, visual level progression, standout streaks, and badge progress in a premium, glassmorphism achievement centre."
        pattern="gradient"
        rightContent={
          points && (
            <div className="grid gap-4">
              <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-theme-muted">Current Level</p>
                    <p className="mt-2 text-4xl font-bold text-theme">
                      <CountUp end={Number(points.level || 1)} duration={1.2} />
                    </p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,var(--accent),#8b5cf6)] text-white shadow-lg">
                    <Trophy size={28} />
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-theme-muted">
                    <span>{points.total_points || 0} XP</span>
                    <span>{points.points_to_next_level || 0} XP to next</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.max(levelProgress, 8)}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-4 text-center backdrop-blur-sm">
                  <Award size={18} className="mx-auto text-amber-400" />
                  <p className="mt-2 text-2xl font-bold text-theme">
                    <CountUp end={earnedCount} duration={1.2} />
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-theme-muted">Unlocked</p>
                </div>
                <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-4 text-center backdrop-blur-sm">
                  <Star size={18} className="mx-auto text-[color:var(--accent)]" />
                  <p className="mt-2 text-2xl font-bold text-theme">
                    <CountUp end={Number(points?.total_points || 0)} duration={1.4} />
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-theme-muted">XP</p>
                </div>
                <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-4 text-center backdrop-blur-sm">
                  <Flame size={18} className="mx-auto text-orange-400" />
                  <p className="mt-2 text-2xl font-bold text-theme">
                    <CountUp
                      end={spotlightBadges.filter((badge) => badge.unlocked).length}
                      duration={1}
                    />
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-theme-muted">Featured</p>
                </div>
              </div>
            </div>
          )
        }
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {spotlightBadges.map((badge) => (
          <div
            key={badge.key}
            className={`card p-5 ${badge.unlocked ? 'glow' : 'opacity-80'}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[color:var(--surface-soft)] text-3xl">
                {badge.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-theme">{badge.key}</h2>
                  <span className={`badge ${badge.unlocked ? 'badge-success' : 'badge-warning'}`}>
                    {badge.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-theme-muted">{badge.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-theme-muted">
                  <span className="badge badge-info">{badge.tier}</span>
                  <span>{badge.points} XP</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {progress.length > 0 && (
        <section className="card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)]">
              <TrendingUpIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme">Achievement progress</h2>
              <p className="text-sm text-theme-muted">See how close you are to the next unlock.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {progress.map((item, index) => (
              <div key={index} className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-theme">{item.name}</span>
                  <span className="text-xs text-theme-muted">{item.percentage}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${item.percentage}%` }} />
                </div>
                <p className="mt-3 text-xs text-theme-muted">
                  {item.current} / {item.target}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {Object.keys(grouped).map((category) => (
        <section key={category} className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--surface-soft)] text-2xl">
              {getCategoryIcon(category)}
            </div>
            <div>
              <h2 className="text-xl font-bold capitalize text-theme">{category} achievements</h2>
              <p className="text-sm text-theme-muted">Premium badge collection for this category</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {grouped[category].map((achievement) => (
              <div
                key={achievement.id}
                className={`card p-5 text-center ${achievement.earned ? 'card-hover' : 'achievement-locked'}`}
              >
                <div
                  className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${getTierClasses(
                    achievement.tier
                  )} text-4xl shadow-lg`}
                >
                  {achievement.earned ? (
                    achievement.icon
                  ) : (
                    <Lock size={26} className="text-slate-900/70" />
                  )}
                </div>

                <h3 className="text-sm font-semibold text-theme">{achievement.name}</h3>
                <p className="mt-2 min-h-[42px] text-xs leading-5 text-theme-muted">
                  {achievement.description}
                </p>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <span
                    className={`badge ${
                      achievement.tier === 'platinum'
                        ? 'badge-info'
                        : achievement.tier === 'gold'
                        ? 'badge-warning'
                        : achievement.tier === 'silver'
                        ? 'badge-primary'
                        : 'badge-danger'
                    }`}
                  >
                    {achievement.tier}
                  </span>
                  <span className="text-xs text-theme-muted">{achievement.points} XP</span>
                </div>

                {achievement.earned && achievement.earned_at ? (
                  <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-theme-muted">
                    Earned {new Date(achievement.earned_at).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-theme-muted">
                    Keep progressing
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {!achievements.length && (
        <div className="empty-state card">
          <Award size={44} className="mx-auto mb-4 text-theme-muted" />
          <p className="text-theme">No achievements available</p>
        </div>
      )}
    </div>
  );
};

const TrendingUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[color:var(--accent)]">
    <path
      d="M22 7L13.5 15.5L8.5 10.5L2 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 7H22V13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Achievements;