import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { BarChart2, Building2, LogOut, Menu } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { InstituicaoProvider } from './contexts/InstituicaoContext';
import { useAuth } from './hooks/useAuth';
import { useInstituicao } from './hooks/useInstituicao';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/Login';
import DesempenhoAnualPage from './pages/DesempenhoAnual';
import FluxoVeiculos from './pages/FluxoVeiculos';
import MovimentacaoHorariaPage from './pages/MovimentacaoHoraria';
import Overview from './pages/Overview';
import InstituicoesPage from './pages/admin/Instituicoes';
import UsuariosPage from './pages/admin/Usuarios';
import ImportacaoPdfPage from './pages/ImportacaoPdf';
import ComparativoPage from './pages/Comparativo';
import EsqueciSenhaPage from './pages/EsqueciSenha';

function InstituicaoSelector() {
  const { instituicoes, selectedId, setSelectedId } = useInstituicao();
  if (instituicoes.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
      <Building2 size={14} className="text-slate-500 flex-shrink-0" />
      <select
        value={selectedId ?? ''}
        onChange={e => setSelectedId(Number(e.target.value))}
        className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer max-w-[180px]"
      >
        {instituicoes.map(i => (
          <option key={i.id} value={i.id}>{i.nome}</option>
        ))}
      </select>
    </div>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const { selectedId } = useInstituicao();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar — mobile + SUPER_ADMIN selector */}
        <header className={`flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0 shadow-sm ${!isSuperAdmin ? 'lg:hidden' : ''}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-1 rounded"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
                <BarChart2 size={15} className="text-white" />
              </div>
              <span className="font-bold text-slate-800 text-sm">Gestão Estacionamento</span>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-2 flex-1 justify-start lg:justify-start lg:ml-0">
              <span className="hidden lg:inline text-xs text-slate-400 font-medium">Visualizando:</span>
              <InstituicaoSelector />
            </div>
          )}

          {user && (
            <button
              onClick={logout}
              className="text-slate-400 hover:text-slate-600 p-1 rounded lg:hidden"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          )}
        </header>

        <main key={isSuperAdmin ? (selectedId ?? 'none') : 'fixed'} className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
            <Route path="/fluxo" element={<ProtectedRoute><FluxoVeiculos /></ProtectedRoute>} />
            <Route path="/horario" element={<ProtectedRoute><MovimentacaoHorariaPage /></ProtectedRoute>} />
            <Route path="/anual" element={<ProtectedRoute><DesempenhoAnualPage /></ProtectedRoute>} />
            <Route path="/admin/instituicoes" element={<ProtectedRoute><InstituicoesPage /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />
            <Route path="/importacao" element={<ProtectedRoute><ImportacaoPdfPage /></ProtectedRoute>} />
            <Route path="/comparativo" element={<ProtectedRoute><ComparativoPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InstituicaoProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </InstituicaoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
