import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { registerUser, getErrorMessage } from '../services/api';
import { encodePassword } from '../utils/passwordUtils';
import { CharCounter } from '../components/ui/CharCounter';
import { validateUsername, validateEmail, validatePassword, getPasswordStrength } from '../utils/validation';

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [focusedField, setFocusedField] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const usernameErr = form.username ? validateUsername(form.username) : null;
  const emailErr = form.email ? validateEmail(form.email) : null;
  const passwordErr = form.password ? validatePassword(form.password) : null;
  const confirmErr = form.confirmPassword && form.confirmPassword !== form.password ? 'Passwords do not match' : null;

  const strength = form.password ? getPasswordStrength(form.password) : 'weak';

  const canSubmit = !usernameErr && !emailErr && !passwordErr && !confirmErr
    && form.username.length > 0 && form.email.length > 0 && form.password.length > 0 && form.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const res = await registerUser({ ...form, password: encodePassword(form.password) });
      localStorage.setItem('user', JSON.stringify({ id: res.id, username: res.username, email: res.email }));
      localStorage.setItem('codetutor_token', res.token);
      navigate('/');
    } catch (err) {
      const msg = getErrorMessage(err).toLowerCase();
      if (msg.includes('email')) setError('Este correo ya está registrado');
      else if (msg.includes('username') || msg.includes('usuario')) setError('Este nombre de usuario ya está en uso');
      else setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-sm text-[#6b7280] mt-1">Empieza a aprender hoy</p>
          </div>
        </div>

        <div className="bg-[#161622] border border-[#ffffff0f] rounded-2xl p-6 shadow-2xl shadow-black/40">
          <h2 className="text-base font-semibold text-white mb-5">Crear cuenta</h2>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-username" className="text-xs font-medium text-[#9ca3af]">Usuario</label>
              <input
                id="register-username"
                name="username"
                type="text"
                required
                placeholder="tunombre"
                autoComplete="username"
                maxLength={30}
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6f42c1] focus:ring-1 focus:ring-[#6f42c1]/30 transition-all" />
              <CharCounter current={form.username.length} max={30} showAt={1} />
              {usernameErr && <p className="text-xs text-red-400 mt-[2px]">{usernameErr}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-email" className="text-xs font-medium text-[#9ca3af]">Email</label>
              <input
                id="register-email"
                name="email"
                type="email"
                required
                placeholder="tu@email.com"
                autoComplete="email"
                maxLength={254}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6f42c1] focus:ring-1 focus:ring-[#6f42c1]/30 transition-all" />
              {emailErr && <p className="text-xs text-red-400 mt-[2px]">{emailErr}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-password" className="text-xs font-medium text-[#9ca3af]">Contraseña</label>
              <input
                id="register-password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="new-password"
                maxLength={64}
                value={form.password}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6f42c1] focus:ring-1 focus:ring-[#6f42c1]/30 transition-all" />
              <CharCounter current={form.password.length} max={64} showAt={1} />
              {passwordErr && <p className="text-xs text-red-400 mt-[2px]">{passwordErr}</p>}
              {(focusedField === 'password' || form.password.length > 0) && form.password.length > 0 && (
                <div className="mt-1">
                  <div className="flex gap-1 mb-1">
                    <div className={`h-1 flex-1 rounded-full ${strength === 'weak' ? 'bg-red-400' : 'bg-gray-200'}`} />
                    <div className={`h-1 flex-1 rounded-full ${strength === 'medium' || strength === 'strong' ? 'bg-amber-400' : 'bg-gray-200'}`} />
                    <div className={`h-1 flex-1 rounded-full ${strength === 'strong' ? 'bg-green-400' : 'bg-gray-200'}`} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {strength === 'weak' && 'Weak — add uppercase and numbers'}
                    {strength === 'medium' && 'Medium — add a symbol (!@#$)'}
                    {strength === 'strong' && 'Strong password'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-confirm-password" className="text-xs font-medium text-[#9ca3af]">Confirmar contraseña</label>
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
              {confirmErr && <p className="text-xs text-red-400 mt-[2px]">{confirmErr}</p>}
            </div>
            <button type="submit" disabled={loading || !canSubmit}
              className="mt-1 w-full py-2.5 rounded-lg bg-gradient-to-r from-[#6f42c1] to-[#0e639c] hover:from-[#0e639c] hover:to-[#6f42c1] text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-[#6f42c1]/20 cursor-pointer disabled:cursor-not-allowed">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#60a5fa] hover:text-white transition-colors">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
