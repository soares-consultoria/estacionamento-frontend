import { BarChart2, Building2, CalendarDays, Car, Clock, GitCompare, History, Home, Lock, LogOut, Server, Shield, Target, Trophy, TrendingUp, UploadCloud, Users, X, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePlano } from '../hooks/usePlano';

const dashboardItems = [
  { to: '/', label: 'Visão Geral', icon: Home, funcionalidade: 'kpi-mensal' },
  { to: '/fluxo', label: 'Fluxo de Veículos', icon: Car, funcionalidade: 'fluxo-diario' },
  { to: '/horario', label: 'Movimentação Horária', icon: Clock, funcionalidade: 'movimentacao-horaria' },
  { to: '/anual', label: 'Desempenho Anual', icon: TrendingUp, funcionalidade: 'desempenho-anual' },
  { to: '/comparativo', label: 'Comparativo', icon: GitCompare, funcionalidade: 'desempenho-anual' },
  { to: '/semana', label: 'Dias da Semana', icon: CalendarDays, funcionalidade: 'analise-dia-semana' },
  { to: '/metas', label: 'Metas', icon: Target, funcionalidade: 'metas-mensais' },
  { to: '/gratuidade', label: 'Gratuidade', icon: Zap, funcionalidade: 'analise-tolerancia' },
  { to: '/previsao', label: 'Previsão', icon: TrendingUp, funcionalidade: 'previsao' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { temAcesso } = usePlano();
  const isSistemaAdmin = user?.role === 'SISTEMA_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin || isSistemaAdmin;

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b] flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:h-full lg:z-auto
        `}
      >
        {/* Logo area */}
        <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Gestão</p>
              <p className="text-slate-400 text-xs mt-0.5">Estacionamento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
          {/* Painel */}
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
              Painel
            </p>
            <ul className="space-y-1">
              {dashboardItems.map(({ to, label, icon: Icon, funcionalidade }) => {
                const liberado = temAcesso(funcionalidade);
                return (
                  <li key={to}>
                    <NavLink
                      to={liberado ? to : '#'}
                      end={to === '/'}
                      onClick={e => { if (!liberado) e.preventDefault(); else onClose(); }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          !liberado
                            ? 'text-slate-600 cursor-not-allowed'
                            : isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`
                      }
                    >
                      <Icon size={18} />
                      <span className="flex-1">{label}</span>
                      {!liberado && <Lock size={12} className="text-slate-600 flex-shrink-0" />}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Importação */}
          {isAdmin && (
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                Importação
              </p>
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to="/importacao"
                    end
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`
                    }
                  >
                    <UploadCloud size={18} />
                    Importar PDF
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/importacao/historico"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`
                    }
                  >
                    <History size={18} />
                    Histórico de Uploads
                  </NavLink>
                </li>
              </ul>
            </div>
          )}

          {/* Sistema — somente SISTEMA_ADMIN */}
          {isSistemaAdmin && (
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                Sistema
              </p>
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to="/admin/contas"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`
                    }
                  >
                    <Server size={18} />
                    Contas / Planos
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/ranking"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`
                    }
                  >
                    <Trophy size={18} />
                    Ranking Global
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/instituicoes"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`
                    }
                  >
                    <Building2 size={18} />
                    Todas as Instituições
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/usuarios"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`
                    }
                  >
                    <Users size={18} />
                    Todos os Usuários
                  </NavLink>
                </li>
              </ul>
            </div>
          )}

          {/* Administração — SUPER_ADMIN e ADMIN */}
          {isAdmin && !isSistemaAdmin && (
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                Administração
              </p>
              <ul className="space-y-1">
                {isSuperAdmin && (
                  <li>
                    <NavLink
                      to="/ranking"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`
                      }
                    >
                      <Trophy size={18} />
                      Ranking
                    </NavLink>
                  </li>
                )}
                {isSuperAdmin && (
                  <li>
                    <NavLink
                      to="/admin/planos"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`
                      }
                    >
                      <Shield size={18} />
                      Meu Plano
                    </NavLink>
                  </li>
                )}
                {isSuperAdmin && (
                  <li>
                    <NavLink
                      to="/admin/instituicoes"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`
                      }
                    >
                      <Building2 size={18} />
                      Instituições
                    </NavLink>
                  </li>
                )}
                <li>
                  <NavLink
                    to="/admin/usuarios"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`
                    }
                  >
                    <Users size={18} />
                    Usuários
                  </NavLink>
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700">
          {user && (
            <div className="mb-3">
              <p className="text-slate-300 text-xs font-semibold truncate">{user.nome}</p>
              <p className="text-slate-500 text-xs truncate">{user.email}</p>
              {isSistemaAdmin ? (
                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-700 text-purple-100 text-xs rounded-full">
                  SISTEMA
                </span>
              ) : user.plano && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                  {user.plano}
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => { onClose(); logout(); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs transition-colors"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
