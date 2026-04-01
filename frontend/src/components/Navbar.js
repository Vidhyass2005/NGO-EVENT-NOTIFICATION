// components/Navbar.js
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogOut, Home, BarChart2, Clock, Award, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import Notification from './Notification';
import { LayoutDashboard } from 'lucide-react';
const NAV_LINKS = [
  { to: '/',            label: 'Events',       Icon: Home          },
  { to: '/analytics',   label: 'Analytics',    Icon: BarChart2     },
  { to: '/history',     label: 'History',      Icon: Clock         },
  { to: '/certificates',label: 'Certificates', Icon: Award         },
  { to: '/feedback',    label: 'Feedback',     Icon: MessageSquare },
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, adminOnly: true },
]
;

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme }   = useTheme();
  const { pushStatus, enablePush }= useNotifications();
  const [menuOpen, setMenuOpen]   = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname === path
    ? 'bg-brand-400/10 text-brand-500 dark:text-brand-400'
    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="w-8 h-8 bg-brand-400 rounded-lg flex items-center justify-center text-slate-900">🌍</span>
            <span className="hidden sm:block">NGO <span className="text-brand-400">Events</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, Icon }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(to)}`}>
                <Icon size={15} />{label}
              </Link>
            ))}
            {isAdmin && <span className="ml-2 badge bg-brand-400/10 text-brand-500 border border-brand-400/30">Admin</span>}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Push notification toggle button */}
            {pushStatus !== 'unsupported' && pushStatus !== 'granted' && (
              <button
                onClick={enablePush}
                title="Enable push notifications"
                className="btn-ghost p-2 relative text-slate-400 hover:text-brand-500"
              >
                <Bell size={17} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-400 rounded-full" />
              </button>
            )}

            <Notification />

            <button onClick={toggleTheme} className="btn-ghost p-2">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="flex items-center gap-2 px-2">
              <div className="w-7 h-7 bg-brand-400 rounded-full flex items-center justify-center text-slate-900 font-bold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
            </div>

            <button onClick={handleLogout} className="btn-ghost p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut size={18} />
            </button>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden btn-ghost p-2">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 py-2 px-4 space-y-1 animate-slide-in">
          {NAV_LINKS.map(({ to, label, Icon }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(to)}`}>
              <Icon size={15} />{label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
