import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings,
  SunMedium,
  UserCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const Header = ({ onMenuClick, onToggleSidebar, isSidebarCollapsed = false }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications?unreadOnly=true&limit=1');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = useMemo(() => {
    if (!user?.username) return 'DU';
    return user.username
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }, [user?.username]);

  return (
    <header className="sticky top-0 z-30 border-b border-theme bg-[color:var(--bg-muted)]/95 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="btn btn-secondary !h-11 !w-11 !rounded-2xl !p-0 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <button
            onClick={onToggleSidebar}
            className="btn btn-secondary hidden !h-11 !w-11 !rounded-2xl !p-0 lg:inline-flex"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={18} />
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-theme-muted">
              Premium Workspace
            </p>
            <h2 className="text-lg font-semibold text-theme md:text-xl">
              DevOps Learning Tracker
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleTheme}
            className="btn btn-secondary !h-11 rounded-2xl px-3"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            <span className="relative flex h-6 w-11 items-center rounded-full bg-[color:var(--surface-soft)] px-1">
              <span
                className={`absolute h-4 w-4 rounded-full bg-[color:var(--accent)] shadow-md transition-transform duration-300 ${
                  theme === 'dark' ? 'translate-x-0' : 'translate-x-5'
                }`}
              />
              <Moon size={12} className="relative z-10 text-theme-muted" />
              <SunMedium size={12} className="relative z-10 ml-auto text-theme-muted" />
            </span>
            <span className="hidden text-sm md:inline">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="btn btn-secondary relative !h-11 !w-11 !rounded-2xl !p-0"
            aria-label="Open notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <>
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="absolute -right-1 -top-1 flex min-w-[1.25rem] items-center justify-center rounded-full bg-[color:var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen((current) => !current)}
              className="flex items-center gap-3 rounded-2xl border border-theme bg-[color:var(--surface)] px-3 py-2.5 shadow-sm transition hover:shadow-md"
              aria-label="Open profile menu"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),#8b5cf6)] text-sm font-bold text-white">
                {initials}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold text-theme">{user?.username || 'DevOps User'}</p>
                <p className="text-xs text-theme-muted">Level {user?.level || 1}</p>
              </div>
              <ChevronDown
                size={16}
                className={`hidden text-theme-muted transition-transform md:block ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-3xl border border-theme bg-[color:var(--surface)] p-2 shadow-2xl backdrop-blur-xl">
                <div className="rounded-2xl border border-theme bg-[color:var(--surface-soft)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),#8b5cf6)] text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-theme">{user?.username}</p>
                      <p className="text-xs text-theme-muted">{user?.email || 'Learning in progress'}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-2xl bg-[color:var(--surface)] px-3 py-2">
                      <p className="text-xs text-theme-muted">Level</p>
                      <p className="text-sm font-semibold text-theme">{user?.level || 1}</p>
                    </div>
                    <div className="rounded-2xl bg-[color:var(--surface)] px-3 py-2">
                      <p className="text-xs text-theme-muted">XP</p>
                      <p className="text-sm font-semibold text-theme">{user?.total_points || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/profile');
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-theme-muted transition hover:bg-[color:var(--surface-soft)] hover:text-theme"
                  >
                    <UserCircle2 size={16} />
                    View profile
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/goals');
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-theme-muted transition hover:bg-[color:var(--surface-soft)] hover:text-theme"
                  >
                    <Settings size={16} />
                    Goals & settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;