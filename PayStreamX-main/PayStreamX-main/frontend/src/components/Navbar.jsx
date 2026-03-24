import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { LogOut, LayoutDashboard, FileText, Wallet, Target } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = user?.role === 'employer'
    ? [
        { to: '/employer', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/audit', label: 'Audit', icon: FileText },
      ]
    : [
        { to: '/employee', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/audit', label: 'Audit', icon: FileText },
      ];

  return (
    <nav className="sticky top-0 z-50 border-b" style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(20px)',
      borderColor: 'rgba(37, 99, 235, 0.08)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user?.role === 'employer' ? '/employer' : '/employee'} className="flex items-center gap-3 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-xl animate-glow" style={{ background: 'var(--gradient-primary)', opacity: 0.6 }} />
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <span className="text-lg font-display font-bold bg-gradient-to-r from-primary-400 via-glow-400 to-accent-400 text-transparent bg-clip-text">
              PayStreamX
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'var(--gradient-primary)' }}>
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div>
                <p className="text-white text-xs font-medium">{user?.first_name || user?.username}</p>
                <p className="text-slate-500 text-[10px] capitalize">{user?.role}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
