import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { loginUser, getErrorMessage } from '../services/api';
import { validateEmail } from '../utils/validation';
import { hashPassword } from '../utils/hashPassword';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../context/ToastContext';

export function LoginPage() {
  usePageTitle('Log in');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailErr = form.email ? validateEmail(form.email) : null;
  const canSubmit = form.email.length > 0 && form.password.length >= 8 && !emailErr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const hashedPassword = await hashPassword(form.password);
      const res = await loginUser({ email: form.email, password: hashedPassword });
      login({ id: res.id, username: res.username, email: res.email, createdAt: new Date().toISOString() });
      showToast('Welcome back!', 'success');
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0e639c]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#6f42c1]/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0e639c] to-[#6f42c1] flex items-center justify-center shadow-lg shadow-[#0e639c]/30">
            <Code2 className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">CodeTutor</h1>
            <p className="text-sm text-[#6b7280] mt-1">Your AI programming tutor</p>
          </div>
        </div>

        <div className="bg-[#161622] border border-[#ffffff0f] rounded-2xl p-6 shadow-2xl shadow-black/40">
          <h2 className="text-base font-semibold text-white mb-5">Log in</h2>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-medium text-[#9ca3af]">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                maxLength={254}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
                autoComplete="email"
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#0e639c] focus:ring-1 focus:ring-[#0e639c]/30 transition-all" />
              {emailErr && <p className="text-xs text-red-400 mt-[2px]">{emailErr}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-xs font-medium text-[#9ca3af]">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                maxLength={64}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#0e639c] focus:ring-1 focus:ring-[#0e639c]/30 transition-all" />
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="text-xs text-red-400 mt-[2px]">Password must be at least 8 characters</p>
              )}
            </div>
            <button type="submit" disabled={loading || !canSubmit}
              className="mt-1 w-full py-2.5 rounded-lg bg-gradient-to-r from-[#0e639c] to-[#1177bb] hover:from-[#1177bb] hover:to-[#0e639c] text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-[#0e639c]/20 cursor-pointer">
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-5">
          Don't have an account?{' '}
           <Link to="/register" className="text-[#60a5fa] hover:text-white transition-colors">Register</Link>
        </p>
      </div>
    </div>
  );
}
