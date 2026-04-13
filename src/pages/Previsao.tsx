import { FeatureGate } from '../components/FeatureGate';
import { useEffect, useState } from 'react';
import { dashboardApi, type Previsao } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { TrendingUp } from 'lucide-react';

const BRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const INT = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0);

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function MonthSelector({ ano, mes, onChange }: { ano: number; mes: number; onChange: (ano: number, mes: number) => void }) {
  return (
    <div className="flex gap-2 items-center">
      <select
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={mes}
        onChange={(e) => onChange(ano, Number(e.target.value))}
      >
        {MESES.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={ano}
        onChange={(e) => onChange(Number(e.target.value), mes)}
      >
        {[2024, 2025, 2026].map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
}

export default function PrevisaoPage() {
  const now = new Date();
  // Default: show prediction for next month
  const nextMonth = now.getMonth() === 11
    ? { ano: now.getFullYear() + 1, mes: 1 }
    : { ano: now.getFullYear(), mes: now.getMonth() + 2 };

  const [ano, setAno] = useState(nextMonth.ano);
  const [mes, setMes] = useState(nextMonth.mes);
  const [dados, setDados] = useState<Previsao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Backend endpoint uses year/month as the BASE for computing the prediction of the NEXT month
    // We pass the month BEFORE the one we want to preview
    const base = mes === 1
      ? { ano: ano - 1, mes: 12 }
      : { ano, mes: mes - 1 };
    dashboardApi.getPrevisao(base.ano, base.mes)
      .then(setDados)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ano, mes]);

  return (
    <FeatureGate funcionalidade="previsao">
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Previsão do Próximo Mês</h1>
            <p className="text-slate-500 text-sm mt-1">Estimativa baseada na média histórica dos meses anteriores</p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <p className="text-xs text-slate-400">Mês a prever:</p>
            <MonthSelector ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m); }} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Erro ao carregar previsão: {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Calculando previsão..." />
        ) : !dados ? (
          <div className="text-center text-slate-400 py-16">Dados históricos insuficientes para gerar previsão.</div>
        ) : (
          <>
            {/* Header card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">Previsão para</p>
                  <p className="text-white text-lg font-bold">{dados.mes_nome}/{dados.ano_previsao}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-blue-200 text-xs">Fluxo estimado</p>
                  <p className="text-white text-xl font-bold">{INT(dados.previsao_fluxo)}</p>
                  <p className="text-blue-200 text-xs">veículos</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs">Receita estimada</p>
                  <p className="text-white text-xl font-bold">{BRL(dados.previsao_receita)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs">Ticket médio est.</p>
                  <p className="text-white text-xl font-bold">{BRL(dados.previsao_ticket_medio)}</p>
                </div>
              </div>
            </div>

            {/* Methodology */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-3">
              <h2 className="text-base font-semibold text-slate-700">Metodologia do Cálculo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-slate-700">Base de cálculo</p>
                  <p className="text-slate-500 mt-0.5">{dados.base_calculo}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Meses utilizados</p>
                  <p className="text-slate-500 mt-0.5">{dados.meses_utilizados} {dados.meses_utilizados === 1 ? 'mês' : 'meses'} anteriores</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  <strong>Aviso:</strong> Esta previsão é uma estimativa baseada em médias históricas.
                  Fatores externos como feriados, eventos locais ou sazonalidade atípica podem impactar os resultados reais.
                </p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
              <p className="text-sm text-slate-600">
                Use esta previsão como referência ao definir as{' '}
                <a href="/metas" className="text-blue-600 hover:underline font-medium">metas mensais</a>{' '}
                de {dados.mes_nome}/{dados.ano_previsao}.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
    </FeatureGate>
  );
}
