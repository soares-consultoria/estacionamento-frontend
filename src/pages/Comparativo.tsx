import { FeatureGate } from '../components/FeatureGate';
import { useEffect, useState } from 'react';
import { dashboardApi, type KpiMensal } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

const BRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const INT = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0);

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function prevMonth(ano: number, mes: number) {
  if (mes === 1) return { ano: ano - 1, mes: 12 };
  return { ano, mes: mes - 1 };
}

function labelPeriodo(ano: number, mes: number) {
  return `${MESES[mes - 1]}/${ano}`;
}

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

function Delta({ current, compare }: { current: number; compare: number | null | undefined }) {
  if (!compare || compare === 0) return <span className="text-slate-400 text-xs">—</span>;
  const pct = ((current - compare) / compare) * 100;
  const up = pct >= 0;
  const color = up ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
  const Icon = pct === 0 ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold ${color}`}>
      <Icon size={10} />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

interface ColData {
  label: string;
  kpi: KpiMensal | null;
  loading: boolean;
}

export default function Comparativo() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  const prev = prevMonth(ano, mes);
  const anoAnterior = { ano: ano - 1, mes };

  const [cols, setCols] = useState<ColData[]>([
    { label: labelPeriodo(ano, mes), kpi: null, loading: true },
    { label: labelPeriodo(prev.ano, prev.mes), kpi: null, loading: true },
    { label: labelPeriodo(anoAnterior.ano, anoAnterior.mes), kpi: null, loading: true },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = prevMonth(ano, mes);
    const aa = { ano: ano - 1, mes };

    setCols([
      { label: labelPeriodo(ano, mes), kpi: null, loading: true },
      { label: labelPeriodo(p.ano, p.mes), kpi: null, loading: true },
      { label: labelPeriodo(aa.ano, aa.mes), kpi: null, loading: true },
    ]);
    setError(null);

    Promise.all([
      dashboardApi.getKpiMensal(ano, mes),
      dashboardApi.getKpiMensal(p.ano, p.mes),
      dashboardApi.getKpiMensal(aa.ano, aa.mes),
    ])
      .then(([atual, anterior, anoAnt]) => {
        setCols([
          { label: labelPeriodo(ano, mes), kpi: atual, loading: false },
          { label: labelPeriodo(p.ano, p.mes), kpi: anterior, loading: false },
          { label: labelPeriodo(aa.ano, aa.mes), kpi: anoAnt, loading: false },
        ]);
      })
      .catch((e) => {
        setError(e.message);
        setCols(c => c.map(col => ({ ...col, loading: false })));
      });
  }, [ano, mes]);

  const atual = cols[0].kpi;
  const anterior = cols[1].kpi;
  const anoAnt = cols[2].kpi;

  const rows: { label: string; fmt: (k: KpiMensal) => string; getValue: (k: KpiMensal) => number }[] = [
    { label: 'Fluxo Total', fmt: k => INT(k.fluxo_total), getValue: k => k.fluxo_total },
    { label: 'Arrecadação', fmt: k => BRL(k.receita_total), getValue: k => k.receita_total },
    { label: 'Pagantes', fmt: k => INT(k.pagantes_total), getValue: k => k.pagantes_total },
    { label: 'Ticket Médio', fmt: k => BRL(k.ticket_medio), getValue: k => k.ticket_medio },
    { label: 'Dias c/ Dados', fmt: k => String(k.dias_com_dados ?? 0), getValue: k => k.dias_com_dados ?? 0 },
  ];

  const loading = cols.some(c => c.loading);

  return (
    <FeatureGate funcionalidade="desempenho-anual">
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Comparativo de Períodos</h1>
            <p className="text-slate-500 text-sm mt-1">Compare o mês selecionado com o mês anterior e o mesmo mês do ano passado</p>
          </div>
          <MonthSelector ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m); }} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Erro ao carregar dados: {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Carregando comparativo..." />
        ) : (
          <>
            {/* Period header cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {cols.map((col, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3 sm:p-4 text-center ${
                    i === 0
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-slate-100 text-slate-600 shadow-sm'
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${i === 0 ? 'text-blue-100' : 'text-slate-400'}`}>
                    {i === 0 ? 'Período Selecionado' : i === 1 ? 'Mês Anterior' : 'Mesmo Mês Ano Ant.'}
                  </p>
                  <p className={`text-sm sm:text-base font-bold mt-1 ${i === 0 ? 'text-white' : 'text-slate-700'}`}>
                    {col.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${i === 0 ? 'text-blue-200' : 'text-slate-400'}`}>
                    {col.kpi ? `${col.kpi.dias_com_dados ?? 0} dias com dados` : 'Sem dados'}
                  </p>
                </div>
              ))}
            </div>

            {/* Comparison table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">
                      Métrica
                    </th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {cols[0].label}
                    </th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {cols[1].label}
                      <span className="block normal-case font-normal text-slate-400 text-xs">vs atual</span>
                    </th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {cols[2].label}
                      <span className="block normal-case font-normal text-slate-400 text-xs">vs atual</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((row) => (
                    <tr key={row.label} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3.5 text-sm font-medium text-slate-700">
                        {row.label}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right text-sm font-bold text-slate-800">
                        {atual ? row.fmt(atual) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm text-slate-600">
                            {anterior ? row.fmt(anterior) : <span className="text-slate-300">—</span>}
                          </span>
                          {atual && anterior && (
                            <Delta current={row.getValue(atual)} compare={row.getValue(anterior)} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm text-slate-600">
                            {anoAnt ? row.fmt(anoAnt) : <span className="text-slate-300">—</span>}
                          </span>
                          {atual && anoAnt && (
                            <Delta current={row.getValue(atual)} compare={row.getValue(anoAnt)} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary callout */}
            {atual && anterior && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    vs {cols[1].label}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Fluxo</span>
                      <Delta current={atual.fluxo_total} compare={anterior.fluxo_total} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Receita</span>
                      <Delta current={atual.receita_total} compare={anterior.receita_total} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Ticket Médio</span>
                      <Delta current={atual.ticket_medio} compare={anterior.ticket_medio} />
                    </div>
                  </div>
                </div>
                {anoAnt && (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                      vs {cols[2].label}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Fluxo</span>
                        <Delta current={atual.fluxo_total} compare={anoAnt.fluxo_total} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Receita</span>
                        <Delta current={atual.receita_total} compare={anoAnt.receita_total} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Ticket Médio</span>
                        <Delta current={atual.ticket_medio} compare={anoAnt.ticket_medio} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </FeatureGate>
  );
}
