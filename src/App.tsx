import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { BarChart2, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DesempenhoAnualPage from './pages/DesempenhoAnual';
import FluxoVeiculos from './pages/FluxoVeiculos';
import MovimentacaoHorariaPage from './pages/MovimentacaoHoraria';
import Overview from './pages/Overview';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Mobile top bar */}
          <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0 shadow-sm">
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
          </header>

          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/fluxo" element={<FluxoVeiculos />} />
              <Route path="/horario" element={<MovimentacaoHorariaPage />} />
              <Route path="/anual" element={<DesempenhoAnualPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
