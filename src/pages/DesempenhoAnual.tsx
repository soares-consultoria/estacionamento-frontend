import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardApi, type DesempenhoAnual } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const INT = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0);

const BRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const SHORT_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function pctDiff(atual: number, anterior: number | undefined): number | null {
  if (!anterior || anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

export default function DesempenhoAnualPage() {
  const now = new Date();
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  const [anoAnterior, setAnoAnterior] = useState(now.getFullYear() - 1);
  const [dataAtual, setDataAtual] = useState<DesempenhoAnual[]>([]);
  const [dataAnterior, setDataAnterior] = useState<DesempenhoAnual[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      dashboardApi.getDesempenhoAnual(anoAtual),
      dashboardApi.getDesempenhoAnual(anoAnterior),
    ])
      .then(([atual, anterior]) => { setDataAtual(atual); setDataAnterior(anterior); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [anoAtual, anoAnterior]);

  // Build combined chart data aligned by month number
  const mapByMes = (list: DesempenhoAnual[]) => {
    const m: Record<number, DesempenhoAnual> = {};
    list.forEach((d) => { m[d.mes_numero] = d; });
    return m;
  };

  const atualMap = mapByMes(dataAtual);
  const anteriorMap = mapByMes(dataAnterior);

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const a = atualMap[m];
    const b = anteriorMap[m];
    return {
      mes: SHORT_MESES[i],
      [`Fluxo ${anoAtual}`]: a?.fluxo_total ?? null,
      [`Fluxo ${anoAnterior}`]: b?.fluxo_total ?? null,
    };
  });

  const receitaChartData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const a = atualMap[m];
    const b = anteriorMap[m];
    return {
      mes: SHORT_MESES[i],
      [`Receita ${anoAtual}`]: a?.receita_total ? Number(a.receita_total) : null,
      [`Receita ${anoAnterior}`]: b?.receita_total ? Number(b.receita_total) : null,
    };
  });

  // Totals for summary
  const sumAtual = dataAtual.reduce((acc, d) => ({
    fluxo: acc.fluxo + (d.fluxo_total ?? 0),
    receita: acc.receita + Number(d.receita_total ?? 0),
    pagantes: acc.pagantes + (d.pagantes_total ?? 0),
  }), { fluxo: 0, receita: 0, pagantes: 0 });

  const sumAnterior = dataAnterior.reduce((acc, d) => ({
    fluxo: acc.fluxo + (d.fluxo_total ?? 0),
    receita: acc.receita + Number(d.receita_total ?? 0),
    pagantes: acc.pagantes + (d.pagantes_total ?? 0),
  }), { fluxo: 0, receita: 0, pagantes: 0 });

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Desempenho Anual</h1>
            <p className="text-slate-500 text-sm mt-1">Comparativo mensal entre dois anos</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Ano atual:</span>
              <select
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                value={anoAtual}
                onChange={(e) => setAnoAtual(Number(e.target.value))}
              >
                {[2024, 2025, 2026].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Comparar com:</span>
              <select
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                value={anoAnterior}
                onChange={(e) => setAnoAnterior(Number(e.target.value))}
              >
                {[2023, 2024, 2025].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">Erro: {error}</div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Summary comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: 'Fluxo Total',
                  atual: INT(sumAtual.fluxo),
                  anterior: INT(sumAnterior.fluxo),
                  pct: pctDiff(sumAtual.fluxo, sumAnterior.fluxo),
                },
                {
                  label: 'Arrecadação Total',
                  atual: BRL(sumAtual.receita),
                  anterior: BRL(sumAnterior.receita),
                  pct: pctDiff(sumAtual.receita, sumAnterior.receita),
                },
                {
                  label: 'Pagantes Total',
                  atual: INT(sumAtual.pagantes),
                  anterior: INT(sumAnterior.pagantes),
                  pct: pctDiff(sumAtual.pagantes, sumAnterior.pagantes),
                },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{c.label}</p>
                  <p className="text-xl font-bold text-slate-800 mt-2">{c.atual}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">{anoAnterior}: {c.anterior}</span>
                    {c.pct !== null && (
                      <span className={`text-xs font-semibold ${c.pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {c.pct >= 0 ? '▲' : '▼'} {Math.abs(c.pct).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Fluxo bar chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Fluxo Mensal — {anoAnterior} vs {anoAtual}</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => INT(v as number)} />
                  <Legend />
                  <Bar dataKey={`Fluxo ${anoAnterior}`} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={`Fluxo ${anoAtual}`} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Receita bar chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Arrecadação Mensal — {anoAnterior} vs {anoAtual}</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={receitaChartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => BRL(v as number)} />
                  <Legend />
                  <Bar dataKey={`Receita ${anoAnterior}`} fill="#fde68a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={`Receita ${anoAtual}`} fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly comparison table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-700">Tabela Comparativa Mensal</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-left">
                      <th className="px-4 py-3 font-medium">Mês</th>
                      <th className="px-4 py-3 font-medium text-right">{anoAnterior} Fluxo</th>
                      <th className="px-4 py-3 font-medium text-right">{anoAtual} Fluxo</th>
                      <th className="px-4 py-3 font-medium text-right">Var. %</th>
                      <th className="px-4 py-3 font-medium text-right">{anoAnterior} Receita</th>
                      <th className="px-4 py-3 font-medium text-right">{anoAtual} Receita</th>
                      <th className="px-4 py-3 font-medium text-right">Var. %</th>
                      <th className="px-4 py-3 font-medium text-right">{anoAtual} Ticket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }, (_, i) => {
                      const m = i + 1;
                      const a = atualMap[m];
                      const b = anteriorMap[m];
                      const fluxoPct = pctDiff(a?.fluxo_total ?? 0, b?.fluxo_total);
                      const receitaPct = pctDiff(Number(a?.receita_total ?? 0), Number(b?.receita_total));
                      if (!a && !b) return null;
                      return (
                        <tr key={m} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium">{SHORT_MESES[i]}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400">{b ? INT(b.fluxo_total) : '—'}</td>
                          <td className="px-4 py-2.5 text-right font-medium">{a ? INT(a.fluxo_total) : '—'}</td>
                          <td className={`px-4 py-2.5 text-right text-xs font-semibold ${fluxoPct === null ? '' : fluxoPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {fluxoPct !== null ? `${fluxoPct >= 0 ? '▲' : '▼'} ${Math.abs(fluxoPct).toFixed(1)}%` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-400">{b ? BRL(Number(b.receita_total)) : '—'}</td>
                          <td className="px-4 py-2.5 text-right font-medium">{a ? BRL(Number(a.receita_total)) : '—'}</td>
                          <td className={`px-4 py-2.5 text-right text-xs font-semibold ${receitaPct === null ? '' : receitaPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {receitaPct !== null ? `${receitaPct >= 0 ? '▲' : '▼'} ${Math.abs(receitaPct).toFixed(1)}%` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right">{a?.ticket_medio ? BRL(Number(a.ticket_medio)) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
