import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resetOk = (location.state as { resetOk?: boolean })?.resetOk ?? false;
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, senha);
      navigate('/', { replace: true });
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-white sm:bg-slate-100 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="w-full sm:max-w-sm sm:bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-slate-100 p-6 py-10 sm:p-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <BarChart2 size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">Gestão</p>
            <p className="text-slate-400 text-xs">Estacionamento</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-1">Entrar</h1>
        <p className="text-slate-400 text-sm mb-6">Acesse sua conta para continuar</p>

        {resetOk && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
            Senha redefinida com sucesso! Faça login com a nova senha.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-lg text-base transition-colors mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="text-center pt-1">
            <Link
              to="/esqueci-senha"
              className="text-slate-400 hover:text-blue-500 text-sm transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
