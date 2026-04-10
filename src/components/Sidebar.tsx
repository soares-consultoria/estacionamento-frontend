import { BarChart2, Car, Clock, Home, TrendingUp, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Visão Geral', icon: Home },
  { to: '/fluxo', label: 'Fluxo de Veículos', icon: Car },
  { to: '/horario', label: 'Movimentação Horária', icon: Clock },
  { to: '/anual', label: 'Desempenho Anual', icon: TrendingUp },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
            Painel
          </p>
          <ul className="space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs">v1.0.0 &mdash; Dashboard</p>
        </div>
      </aside>
    </>
  );
}
