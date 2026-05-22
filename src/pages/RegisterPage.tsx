import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { registerUser, getErrorMessage } from '../services/api';
import { validateUsername, validateEmail } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../context/ToastContext';

const PWD_CHECKS = [
  { key: 'length', label: '8+ characters (not counting spaces)' },
  { key: 'uppercase', label: 'One uppercase letter' },
  { key: 'number', label: 'One number' },
  { key: 'special', label: 'One special character (!@#$%^&*)' },
] as const;

export function RegisterPage() {
  usePageTitle('Create account');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const trimmedPwd = form.password.replace(/\s/g, '');
  const passwordChecks = {
    length: trimmedPwd.length >= 8,
    uppercase: /[A-Z]/.test(trimmedPwd),
    number: /[0-9]/.test(trimmedPwd),
    special: /[!@#$%^&*]/.test(trimmedPwd),
  };
  const allChecksPass = Object.values(passwordChecks).every(Boolean);
  const confirmMatch = form.confirmPassword === form.password;
  const usernameOk = form.username.length > 0 && !validateUsername(form.username);
  const emailOk = form.email.length > 0 && !validateEmail(form.email);
  const canSubmit = usernameOk && emailOk && allChecksPass && confirmMatch && form.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: btoa(unescape(encodeURIComponent(trimmedPwd))),
      };
      const res = await registerUser(payload);
      login({ id: res.id, username: res.username, email: res.email, createdAt: new Date().toISOString() }, res.token);
      showToast('Account created!', 'success');
      setSuccess(true);
      setTimeout(() => navigate('/practice'), 1500);
    } catch (err) {
      const msg = getErrorMessage(err);
      const lower = msg.toLowerCase();
      if (lower.includes('email') || lower.includes('already registered')) {
        setErrors(prev => ({ ...prev, email: 'Email already registered' }));
      } else if (lower.includes('username') || lower.includes('already taken')) {
        setErrors(prev => ({ ...prev, username: 'Username already taken' }));
      } else {
        setErrors(prev => ({ ...prev, form: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="text-white text-sm font-medium">Account created! Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#6f42c1]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0e639c]/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6f42c1] to-[#0e639c] flex items-center justify-center shadow-lg shadow-[#6f42c1]/30">
            <Code2 className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">CodeTutor</h1>
            <p className="text-sm text-[#6b7280] mt-1">Start learning today</p>
          </div>
        </div>

        <div className="bg-[#161622] border border-[#ffffff0f] rounded-2xl p-6 shadow-2xl shadow-black/40">
          <h2 className="text-base font-semibold text-white mb-5">Create account</h2>

          {errors.form && (
            <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-username" className="text-xs font-medium text-[#9ca3af]">Username</label>
              <input
                id="register-username"
                name="username"
                type="text"
                required
                placeholder="yourusername"
                autoComplete="username"
                maxLength={50}
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6f42c1] focus:ring-1 focus:ring-[#6f42c1]/30 transition-all" />
              {form.username.length > 0 && validateUsername(form.username) && (
                <p className="text-[11px] text-[#DC2626] mt-[2px]">{validateUsername(form.username)}</p>
              )}
              {errors.username && (
                <p className="text-[11px] text-[#DC2626] mt-[2px]">{errors.username}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-email" className="text-xs font-medium text-[#9ca3af]">Email</label>
              <input
                id="register-email"
                name="email"
                type="email"
                required
                placeholder="you@email.com"
                autoComplete="email"
                maxLength={254}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6f42c1] focus:ring-1 focus:ring-[#6f42c1]/30 transition-all" />
              {form.email.length > 0 && validateEmail(form.email) && (
                <p className="text-[11px] text-[#DC2626] mt-[2px]">{validateEmail(form.email)}</p>
              )}
              {errors.email && (
                <p className="text-[11px] text-[#DC2626] mt-[2px]">{errors.email}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-password" className="text-xs font-medium text-[#9ca3af]">Password</label>
              <input
                id="register-password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="new-password"
                maxLength={64}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6f42c1] focus:ring-1 focus:ring-[#6f42c1]/30 transition-all" />
              {form.password.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  {PWD_CHECKS.map(({ key, label }) => {
                    const ok = passwordChecks[key];
                    return (
                      <div key={key} className="flex items-center gap-1.5">
                        <span className={`text-[11px] ${ok ? 'text-[#0F6E56]' : 'text-[#9CA3AF]'}`}>
                          {ok ? '✓' : '✗'}
                        </span>
                        <span className={`text-[11px] ${ok ? 'text-[#0F6E56]' : 'text-[#9CA3AF]'}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-confirm-password" className="text-xs font-medium text-[#9ca3af]">Confirm password</label>
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="new-password"
                maxLength={64}
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6f42c1] focus:ring-1 focus:ring-[#6f42c1]/30 transition-all" />
              {form.confirmPassword.length > 0 && !confirmMatch && (
                <p className="text-[11px] text-[#DC2626] mt-[2px]">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={loading || !canSubmit}
              className="mt-1 w-full py-2.5 rounded-lg bg-gradient-to-r from-[#6f42c1] to-[#0e639c] hover:from-[#0e639c] hover:to-[#6f42c1] text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-[#6f42c1]/20 cursor-pointer disabled:cursor-not-allowed">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-5">
          Already have an account?{' '}
           <Link to="/login" className="text-[#60a5fa] hover:text-white transition-colors">Log in</Link>
        </p>
      </div>
    </div>
  );
}
