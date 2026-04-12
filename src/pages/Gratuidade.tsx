import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardApi, type ResumoTolerancia } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const INT = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0);

const PCT = (v: number | null | undefined) =>
  `${(v ?? 0).toFixed(1)}%`;

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

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

export default function Gratuidade() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [dados, setDados] = useState<ResumoTolerancia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardApi.getAnaliseTolerancia(ano, mes)
      .then(setDados)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ano, mes]);

  const pieData = dados
    ? [
        { name: 'Pagantes', value: dados.total_pagantes },
        { name: 'Tolerância', value: dados.total_tolerancia },
      ]
    : [];

  const barData = (dados?.detalhe ?? []).map(d => ({
    dia: d.data.slice(8, 10),
    Pagantes: d.pagantes,
    Tolerância: d.tolerancia,
    Credenciado: d.credenciado,
    Mensalista: d.mensalista,
  }));

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Gratuidade e Tolerância</h1>
            <p className="text-slate-500 text-sm mt-1">Análise de veículos com gratuidade/tolerância versus pagantes</p>
          </div>
          <MonthSelector ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m); }} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Erro ao carregar dados: {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Carregando análise..." />
        ) : !dados ? (
          <div className="text-center text-slate-400 py-16">Nenhum dado disponível.</div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total Entradas</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{INT(dados.total_entradas)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl border border-blue-100 shadow-sm p-4">
                <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Pagantes</p>
                <p className="text-xl font-bold text-blue-700 mt-1">{INT(dados.total_pagantes)}</p>
                <p className="text-xs text-blue-400 mt-0.5">{PCT(dados.pct_pagantes)} do total</p>
              </div>
              <div className="bg-amber-50 rounded-xl border border-amber-100 shadow-sm p-4">
                <p className="text-xs text-amber-500 font-semibold uppercase tracking-wide">Tolerância</p>
                <p className="text-xl font-bold text-amber-700 mt-1">{INT(dados.total_tolerancia)}</p>
                <p className="text-xs text-amber-400 mt-0.5">{PCT(dados.pct_tolerancia)} do total</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Índice Tolerância</p>
                <p className={`text-xl font-bold mt-1 ${dados.pct_tolerancia > 30 ? 'text-red-600' : 'text-slate-800'}`}>
                  {PCT(dados.pct_tolerancia)}
                </p>
              </div>
            </div>

            {/* Pie + bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <h2 className="text-base font-semibold text-slate-700 mb-3">Distribuição do Fluxo</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => INT(v as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <h2 className="text-base font-semibold text-slate-700 mb-3">Tolerância por Dia</h2>
                {barData.length === 0 ? (
                  <div className="text-center text-slate-400 py-12 text-sm">Sem detalhe diário.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} margin={{ top: 0, right: 5, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => INT(v as number)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Pagantes" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="Tolerância" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Credenciado" stackId="a" fill="#10b981" />
                      <Bar dataKey="Mensalista" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Detail table */}
            {barData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Dia</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagantes</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tolerância</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">% Tol.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(dados.detalhe ?? []).map((d) => (
                      <tr key={d.data} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 text-sm text-slate-700">{d.data.slice(0, 10)}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-500 hidden sm:table-cell">{d.dia_semana}</td>
                        <td className="px-4 py-2.5 text-right text-sm font-medium text-slate-800">{INT(d.total_entradas)}</td>
                        <td className="px-4 py-2.5 text-right text-sm text-blue-600">{INT(d.pagantes)}</td>
                        <td className="px-4 py-2.5 text-right text-sm text-amber-600">{INT(d.tolerancia)}</td>
                        <td className={`px-4 py-2.5 text-right text-sm hidden md:table-cell ${d.tolerancia_pct > 30 ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                          {PCT(d.tolerancia_pct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
