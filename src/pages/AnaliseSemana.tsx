import { FeatureGate } from '../components/FeatureGate';
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
import { dashboardApi, type AnaliseDiaSemana } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const BRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const INT = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0);

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIA_ORDER: Record<string, number> = {
  'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Domingo': 7,
};

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

export default function AnaliseSemana() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [dados, setDados] = useState<AnaliseDiaSemana[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardApi.getAnaliseDiaSemana(ano, mes)
      .then(d => {
        const sorted = [...d].sort((a, b) => (DIA_ORDER[a.dia_semana] ?? 9) - (DIA_ORDER[b.dia_semana] ?? 9));
        setDados(sorted);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ano, mes]);

  const fluxoData = dados.map(d => ({
    dia: d.dia_semana,
    'Média Fluxo': Math.round(d.media_fluxo),
    'Média Pagantes': Math.round(d.media_pagantes),
  }));

  const receitaData = dados.map(d => ({
    dia: d.dia_semana,
    'Média Receita': Number(d.media_receita.toFixed(2)),
  }));

  // Best and worst day by flux
  const best = dados.length ? dados.reduce((a, b) => a.media_fluxo > b.media_fluxo ? a : b) : null;
  const worst = dados.length ? dados.reduce((a, b) => a.media_fluxo < b.media_fluxo ? a : b) : null;

  return (
    <FeatureGate funcionalidade="analise-dia-semana">
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Análise por Dia da Semana</h1>
            <p className="text-slate-500 text-sm mt-1">Médias de fluxo e receita por dia da semana no período</p>
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
        ) : dados.length === 0 ? (
          <div className="text-center text-slate-400 py-16">Nenhum dado disponível para o período.</div>
        ) : (
          <>
            {/* Insight cards */}
            {best && worst && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Dia mais movimentado</p>
                  <p className="text-lg font-bold text-emerald-700 mt-1">{best.dia_semana}</p>
                  <p className="text-sm text-emerald-600">{INT(Math.round(best.media_fluxo))} veíc./dia em média</p>
                  <p className="text-xs text-emerald-500 mt-0.5">{BRL(best.media_receita)} em média</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dia menos movimentado</p>
                  <p className="text-lg font-bold text-slate-700 mt-1">{worst.dia_semana}</p>
                  <p className="text-sm text-slate-600">{INT(Math.round(worst.media_fluxo))} veíc./dia em média</p>
                  <p className="text-xs text-slate-400 mt-0.5">{BRL(worst.media_receita)} em média</p>
                </div>
              </div>
            )}

            {/* Flux chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Média de Fluxo por Dia da Semana</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={fluxoData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => INT(v as number)} />
                  <Legend />
                  <Bar dataKey="Média Fluxo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Média Pagantes" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Média de Receita por Dia da Semana</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={receitaData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => BRL(v as number)} />
                  <Bar dataKey="Média Receita" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detail table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dia</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dias</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Média Fluxo</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fluxo</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Média Receita</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Total Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dados.map((d) => (
                    <tr key={d.dia_semana} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{d.dia_semana}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">{d.qtd_dias}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">{INT(Math.round(d.media_fluxo))}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">{INT(d.total_fluxo)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">{BRL(d.media_receita)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 hidden sm:table-cell">{BRL(d.total_receita)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
    </FeatureGate>
  );
}
