import { NavLink } from 'react-router-dom';
import {
  Award,
  Bell,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Home,
  Settings,
  Sparkles,
  Target,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { user } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/tools', icon: Wrench, label: 'Tool Tracker' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/analytics', icon: Sparkles, label: 'Analytics' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/achievements', icon: Award, label: 'Achievements' },
    { path: '/tool-management', icon: Settings, label: 'Manage Tools' },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full border-r border-theme bg-[color:var(--bg-muted)]/95 backdrop-blur-2xl transition-all duration-300 ease-out lg:translate-x-0 ${
          isCollapsed ? 'w-[92px]' : 'w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'} `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-theme px-4 py-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),#8b5cf6)] shadow-lg shadow-sky-500/20">
                <span className="text-lg font-bold text-white">D</span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold text-theme">DevOps</h1>
                  <p className="truncate text-xs uppercase tracking-[0.24em] text-theme-muted">
                    Learning Tracker
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleCollapse}
                className="btn btn-secondary hidden !h-10 !w-10 !rounded-2xl !p-0 lg:inline-flex"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <button
                onClick={onClose}
                className="btn btn-secondary !h-10 !w-10 !rounded-2xl !p-0 lg:hidden"
                aria-label="Close sidebar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {user && (
            <div className="border-b border-theme px-4 py-4">
              <div className="card p-4">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),#8b5cf6)] text-sm font-bold text-white">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-theme">{user.username}</p>
                      <p className="truncate text-xs text-theme-muted">
                        Level {user.level || 1} • {user.total_points || 0} XP
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-2 px-4 py-5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active glow' : ''} ${
                    isCollapsed ? 'justify-center px-0' : ''
                  }`
                }
              >
                <item.icon size={18} className="shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-theme px-4 py-4">
            <div className="card p-4">
              {isCollapsed ? (
                <div className="flex justify-center">
                  <Sparkles size={18} className="text-[color:var(--accent)]" />
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-muted">
                    Productivity
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-theme">Stay in your learning flow</h3>
                  <p className="mt-1 text-xs leading-5 text-theme-muted">
                    Track progress, maintain streaks, and unlock DevOps milestones every day.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;