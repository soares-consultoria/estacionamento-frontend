import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DesempenhoAnualPage from './pages/DesempenhoAnual';
import FluxoVeiculos from './pages/FluxoVeiculos';
import MovimentacaoHorariaPage from './pages/MovimentacaoHoraria';
import Overview from './pages/Overview';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/fluxo" element={<FluxoVeiculos />} />
            <Route path="/horario" element={<MovimentacaoHorariaPage />} />
            <Route path="/anual" element={<DesempenhoAnualPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
