// pages/Login.js
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Login() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const { notify }              = useNotifications();
  const navigate                = useNavigate();
  const location                = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      notify(`Welcome back, ${user.name}! 👋`, '', 'event_approved');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      notify('Login failed', err.response?.data?.message || 'Invalid credentials', 'event_cancelled');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-brand-400/20">🌍</div>
          <h1 className="font-bold text-3xl text-white">NGO Events</h1>
          <p className="text-slate-400 mt-1">Sign in to your account</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base justify-center">
              {loading ? <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
          <div className="mt-5 p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wider">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-slate-300 font-medium">User</p><p className="text-slate-500">user@demo.com</p><p className="text-slate-500">demo123</p></div>
              <div><p className="text-slate-300 font-medium">Admin</p><p className="text-slate-500">admin@demo.com</p><p className="text-slate-500">admin123</p></div>
            </div>
          </div>
          <p className="text-center text-sm text-slate-400 mt-5">
            No account? <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
