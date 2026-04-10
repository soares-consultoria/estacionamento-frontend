import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
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
import { dashboardApi, type FluxoDiario, type KpiMensal, type ReceitaDiaria } from '../api/client';
import KpiCard from '../components/KpiCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart2, Car, DollarSign, Users } from 'lucide-react';

const BRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const INT = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function MonthSelector({ ano, mes, onChange }: { ano: number; mes: number; onChange: (ano: number, mes: number) => void }) {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return (
    <div className="flex gap-2 items-center">
      <select
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={mes}
        onChange={(e) => onChange(ano, Number(e.target.value))}
      >
        {meses.map((m, i) => (
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

export default function Overview() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  const [kpi, setKpi] = useState<KpiMensal | null>(null);
  const [fluxo, setFluxo] = useState<FluxoDiario[]>([]);
  const [receita, setReceita] = useState<ReceitaDiaria[]>([]);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingKpi(true);
    setLoadingCharts(true);
    setError(null);

    dashboardApi.getKpiMensal(ano, mes)
      .then(setKpi)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingKpi(false));

    Promise.all([
      dashboardApi.getFluxoDiario(ano, mes),
      dashboardApi.getReceitaDiaria(ano, mes),
    ])
      .then(([f, r]) => { setFluxo(f); setReceita(r); })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingCharts(false));
  }, [ano, mes]);

  const fluxoChartData = fluxo.map((d) => ({
    dia: d.data.slice(8, 10),
    Rotativo: d.rotativo_entradas,
    Credenciado: d.credenciado_entradas,
    Mensalista: d.mensalista_entradas,
    Total: d.total_entradas,
  }));

  const receitaChartData = receita.map((d) => ({
    dia: d.data.slice(8, 10),
    Faturamento: Number(d.faturamento),
    Arrecadação: Number(d.arrecadacao),
    Descontos: Number(d.descontos),
  }));

  // Arrecadação por tipo (pie)
  const [tiposData, setTiposData] = useState<{ name: string; value: number }[]>([]);
  useEffect(() => {
    dashboardApi.getArrecadacaoPorTipo(ano, mes)
      .then((data) => setTiposData(data.map((d) => ({ name: d.tipo_pagamento, value: Number(d.valor_total) }))))
      .catch(() => setTiposData([]));
  }, [ano, mes]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
            <p className="text-slate-500 text-sm mt-1">Resumo do desempenho mensal do estacionamento</p>
          </div>
          <MonthSelector ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m); }} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Erro ao carregar dados: {error}
          </div>
        )}

        {/* KPI Cards */}
        {loadingKpi ? (
          <LoadingSpinner label="Carregando KPIs..." />
        ) : kpi ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Fluxo Total"
              value={INT(kpi.fluxo_total)}
              variacao={kpi.fluxo_variacao_pct}
              subtitle="veículos no mês"
              icon={<Car size={18} />}
              colorClass="text-blue-600"
            />
            <KpiCard
              title="Arrecadação"
              value={BRL(kpi.receita_total)}
              variacao={kpi.receita_variacao_pct}
              subtitle="total do mês"
              icon={<DollarSign size={18} />}
              colorClass="text-emerald-600"
            />
            <KpiCard
              title="Pagantes"
              value={INT(kpi.pagantes_total)}
              subtitle="tickets pagos"
              icon={<Users size={18} />}
              colorClass="text-violet-600"
            />
            <KpiCard
              title="Ticket Médio"
              value={BRL(kpi.ticket_medio)}
              subtitle={`${kpi.dias_com_dados ?? 0} dias com dados`}
              icon={<BarChart2 size={18} />}
              colorClass="text-amber-600"
            />
          </div>
        ) : (
          <div className="text-center text-slate-400 py-8">Nenhum dado disponível para o período.</div>
        )}

        {loadingCharts ? (
          <LoadingSpinner label="Carregando gráficos..." />
        ) : (
          <>
            {/* Flow Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Fluxo Diário por Tipo de Veículo</h2>
              {fluxoChartData.length === 0 ? (
                <div className="text-center text-slate-400 py-12">Sem dados de fluxo para o período.</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={fluxoChartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => INT(v as number)} />
                    <Legend />
                    <Bar dataKey="Rotativo" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Credenciado" stackId="a" fill="#10b981" />
                    <Bar dataKey="Mensalista" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Receita Diária</h2>
              {receitaChartData.length === 0 ? (
                <div className="text-center text-slate-400 py-12">Sem dados de receita para o período.</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={receitaChartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradArr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => BRL(v as number)} />
                    <Legend />
                    <Area type="monotone" dataKey="Faturamento" stroke="#3b82f6" fill="url(#gradFat)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Arrecadação" stroke="#10b981" fill="url(#gradArr)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart - arrecadação por tipo */}
            {tiposData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="text-base font-semibold text-slate-700 mb-4">Arrecadação por Forma de Pagamento</h2>
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={tiposData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                        labelLine
                      >
                        {tiposData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => BRL(v as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="text-sm text-slate-600 space-y-2 min-w-[180px]">
                    {tiposData.map((d, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="flex-1">{d.name}</span>
                        <span className="font-medium">{BRL(d.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
