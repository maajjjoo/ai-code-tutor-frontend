import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { registerUser, getErrorMessage } from '../services/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [focusedField, setFocusedField] = useState('');

  const passwordRules = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*]/.test(form.password),
  };
  const passwordValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) return;
    setError('');
    setLoading(true);
    try {
      const res = await registerUser(form);
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
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6f42c1] focus:ring-1 focus:ring-[#6f42c1]/30 transition-all" />
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
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6f42c1] focus:ring-1 focus:ring-[#6f42c1]/30 transition-all" />
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
                value={form.password}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="bg-[#0d0d14] border border-[#ffffff12] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6f42c1] focus:ring-1 focus:ring-[#6f42c1]/30 transition-all" />
              {(focusedField === 'password' || form.password.length > 0) && (
                <div className="mt-1 flex flex-col gap-1">
                  {[
                    { key: 'length', label: 'Mínimo 8 caracteres' },
                    { key: 'uppercase', label: 'Una mayúscula' },
                    { key: 'number', label: 'Un número' },
                    { key: 'special', label: 'Un caracter especial (!@#$%^&*)' },
                  ].map(rule => {
                    const ok = passwordRules[rule.key as keyof typeof passwordRules];
                    return (
                      <div key={rule.key} className="flex items-center gap-1.5">
                        <span className={`text-xs ${ok ? 'text-green-400' : 'text-[#6b7280]'}`}>
                          {ok ? '✓' : '○'}
                        </span>
                        <span className={`text-xs ${ok ? 'text-green-400' : 'text-[#6b7280]'}`}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button type="submit" disabled={loading || !passwordValid}
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
