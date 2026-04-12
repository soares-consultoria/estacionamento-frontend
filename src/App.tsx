import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { BarChart2, LogOut, Menu } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/Login';
import DesempenhoAnualPage from './pages/DesempenhoAnual';
import FluxoVeiculos from './pages/FluxoVeiculos';
import MovimentacaoHorariaPage from './pages/MovimentacaoHoraria';
import Overview from './pages/Overview';
import InstituicoesPage from './pages/admin/Instituicoes';
import UsuariosPage from './pages/admin/Usuarios';
import EsqueciSenhaPage from './pages/EsqueciSenha';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-900 p-1 rounded"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
                <BarChart2 size={15} className="text-white" />
              </div>
              <span className="font-bold text-slate-800 text-sm">Gestão Estacionamento</span>
            </div>
          </div>
          {user && (
            <button
              onClick={logout}
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
            <Route path="/fluxo" element={<ProtectedRoute><FluxoVeiculos /></ProtectedRoute>} />
            <Route path="/horario" element={<ProtectedRoute><MovimentacaoHorariaPage /></ProtectedRoute>} />
            <Route path="/anual" element={<ProtectedRoute><DesempenhoAnualPage /></ProtectedRoute>} />
            <Route path="/admin/instituicoes" element={<ProtectedRoute><InstituicoesPage /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />
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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
