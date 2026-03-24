import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Building2, UserCircle, Zap } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', role: 'employee',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-mesh" />
      <div className="absolute top-10 right-32 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: 'var(--gradient-purple-blue)' }} />
      <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--gradient-green)' }} />

      <div className="glass-card w-full max-w-md animate-slide-up !border-glow-500/15">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 animate-glow"
            style={{ background: 'var(--gradient-purple-blue)' }}>
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join <span className="bg-gradient-to-r from-glow-400 to-primary-400 text-transparent bg-clip-text font-semibold">PayStreamX</span></p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          {[
            { value: 'employer', label: 'Employer', icon: Building2 },
            { value: 'employee', label: 'Employee', icon: UserCircle },
          ].map((r) => (
            <button key={r.value} type="button"
              onClick={() => setForm({ ...form, role: r.value })}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                form.role === r.value
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={form.role === r.value ? { background: 'var(--gradient-primary)' } : {}}>
              <r.icon className="w-4 h-4" /> {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
              <input className="input-field" placeholder="John" value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
              <input className="input-field" placeholder="Doe" value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input className="input-field" placeholder="johndoe" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input type="email" className="input-field" placeholder="john@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="input-field pr-10"
                  placeholder="••••••••" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm</label>
              <input type="password" className="input-field" placeholder="••••••••" value={form.password2}
                onChange={(e) => setForm({ ...form, password2: e.target.value })} required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
