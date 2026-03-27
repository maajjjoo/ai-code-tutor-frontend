import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/shared/Button';

interface Props { onGoLogin: () => void; }

function isAxiosError(err: unknown): err is { response?: { data?: unknown } } {
  return typeof err === 'object' && err !== null && 'response' in err;
}

export function RegisterPage({ onGoLogin }: Props) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await registerUser(form);
      login(user);
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data) {
        const msg = String(err.response.data);
        if (msg.toLowerCase().includes('email')) {
          setError('Este email ya está registrado');
        } else if (msg.toLowerCase().includes('username') || msg.toLowerCase().includes('usuario')) {
          setError('Este nombre de usuario ya está en uso');
        } else {
          setError(msg);
        }
      } else {
        setError('Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e2e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <GraduationCap className="w-10 h-10 text-indigo-400" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            CodeTutor
          </h1>
          <p className="text-sm text-gray-500">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-6">
          {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">{error}</p>}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Username</label>
            <input
              type="text" required value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="bg-[#16162a] border border-[#2a2a3e] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Email</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-[#16162a] border border-[#2a2a3e] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Password</label>
            <input
              type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-[#16162a] border border-[#2a2a3e] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full justify-center mt-1">
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-4">
          Already have an account?{' '}
          <button onClick={onGoLogin} className="text-indigo-400 hover:text-indigo-300 cursor-pointer">Sign in</button>
        </p>
      </div>
    </div>
  );
}
