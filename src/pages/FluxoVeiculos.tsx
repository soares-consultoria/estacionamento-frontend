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
import {
  dashboardApi,
  type FluxoDiario,
  type FluxoDiarioVeiculo,
} from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const INT = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0);

const BRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v ?? 0,
  );

const PCT = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) : '0.0';

const MESES = [
  '',
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type Visao = 'categoria' | 'veiculo';

/* ------------------------------------------------------------------ */
/* CategoriaView                                                         */
/* ------------------------------------------------------------------ */
function CategoriaView({ data, mes, ano }: { data: FluxoDiario[]; mes: number; ano: number }) {
  const chartData = data.map((d) => ({
    dia: d.data.slice(8, 10),
    Rotativo: d.rotativo_entradas,
    Credenciado: d.credenciado_entradas,
    Mensalista: d.mensalista_entradas,
    Tolerância: d.tolerancia,
  }));

  const totals = data.reduce(
    (acc, d) => ({
      rotativo: acc.rotativo + (d.rotativo_entradas ?? 0),
      credenciado: acc.credenciado + (d.credenciado_entradas ?? 0),
      mensalista: acc.mensalista + (d.mensalista_entradas ?? 0),
      total: acc.total + (d.total_entradas ?? 0),
      pagantes: acc.pagantes + (d.pagantes ?? 0),
      faturamento: acc.faturamento + Number(d.faturamento ?? 0),
      arrecadacao: acc.arrecadacao + Number(d.arrecadacao ?? 0),
    }),
    { rotativo: 0, credenciado: 0, mensalista: 0, total: 0, pagantes: 0, faturamento: 0, arrecadacao: 0 },
  );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Rotativo', value: INT(totals.rotativo), color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Credenciado', value: INT(totals.credenciado), color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Mensalista', value: INT(totals.mensalista), color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Total Entradas', value: INT(totals.total), color: 'bg-violet-50 text-violet-700 border-violet-100' },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border p-3 sm:p-4 ${c.color}`}>
            <p className="text-xs font-medium opacity-70">{c.label}</p>
            <p className="text-lg sm:text-xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-700 mb-4">
          Entradas por Dia — {MESES[mes]} {ano}
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => INT(v as number)} />
            <Legend />
            <Bar dataKey="Rotativo" stackId="a" fill="#3b82f6" />
            <Bar dataKey="Credenciado" stackId="a" fill="#10b981" />
            <Bar dataKey="Mensalista" stackId="a" fill="#f59e0b" />
            <Bar dataKey="Tolerância" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">Tabela Detalhada</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Dia</th>
                <th className="px-4 py-3 font-medium text-right">Rotativo</th>
                <th className="px-4 py-3 font-medium text-right">Credenciado</th>
                <th className="px-4 py-3 font-medium text-right">Mensalista</th>
                <th className="px-4 py-3 font-medium text-right">Tolerância</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Pagantes</th>
                <th className="px-4 py-3 font-medium text-right">Faturamento</th>
                <th className="px-4 py-3 font-medium text-right">Arrecadação</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.data} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{d.data}</td>
                  <td className="px-4 py-2.5 text-slate-500 capitalize">{d.dia_semana}</td>
                  <td className="px-4 py-2.5 text-right">{INT(d.rotativo_entradas)}</td>
                  <td className="px-4 py-2.5 text-right">{INT(d.credenciado_entradas)}</td>
                  <td className="px-4 py-2.5 text-right">{INT(d.mensalista_entradas)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400">{INT(d.tolerancia)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{INT(d.total_entradas)}</td>
                  <td className="px-4 py-2.5 text-right">{INT(d.pagantes)}</td>
                  <td className="px-4 py-2.5 text-right">{BRL(Number(d.faturamento))}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-emerald-600">
                    {BRL(Number(d.arrecadacao))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t border-slate-200 font-semibold">
                <td className="px-4 py-3" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-right">{INT(totals.rotativo)}</td>
                <td className="px-4 py-3 text-right">{INT(totals.credenciado)}</td>
                <td className="px-4 py-3 text-right">{INT(totals.mensalista)}</td>
                <td className="px-4 py-3 text-right text-slate-500">—</td>
                <td className="px-4 py-3 text-right">{INT(totals.total)}</td>
                <td className="px-4 py-3 text-right">{INT(totals.pagantes)}</td>
                <td className="px-4 py-3 text-right">{BRL(totals.faturamento)}</td>
                <td className="px-4 py-3 text-right text-emerald-700">{BRL(totals.arrecadacao)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MiniBar                                                               */
/* ------------------------------------------------------------------ */
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* VeiculoView                                                           */
/* ------------------------------------------------------------------ */
function VeiculoView({ data, mes, ano }: { data: FluxoDiarioVeiculo[]; mes: number; ano: number }) {
  const totals = data.reduce(
    (acc, d) => ({
      carros: acc.carros + (d.total_carros ?? 0),
      motos: acc.motos + (d.total_motos ?? 0),
      caminhoes: acc.caminhoes + (d.total_caminhoes ?? 0),
      total: acc.total + (d.total_entradas ?? 0),
      rotCarros: acc.rotCarros + (d.rot_carros ?? 0),
      rotMotos: acc.rotMotos + (d.rot_motos ?? 0),
      credCarros: acc.credCarros + (d.cred_carros ?? 0),
      credMotos: acc.credMotos + (d.cred_motos ?? 0),
      mensCarros: acc.mensCarros + (d.mens_carros ?? 0),
      mensMotos: acc.mensMotos + (d.mens_motos ?? 0),
    }),
    { carros: 0, motos: 0, caminhoes: 0, total: 0, rotCarros: 0, rotMotos: 0, credCarros: 0, credMotos: 0, mensCarros: 0, mensMotos: 0 },
  );

  const kpiCards = [
    {
      label: 'Carros',
      value: totals.carros,
      color: 'bg-blue-50 border-blue-100 text-blue-700',
      bar: 'bg-blue-500',
      pct: Number(PCT(totals.carros, totals.total)),
    },
    {
      label: 'Motos',
      value: totals.motos,
      color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      bar: 'bg-emerald-500',
      pct: Number(PCT(totals.motos, totals.total)),
    },
    {
      label: 'Caminhões',
      value: totals.caminhoes,
      color: 'bg-amber-50 border-amber-100 text-amber-700',
      bar: 'bg-amber-500',
      pct: Number(PCT(totals.caminhoes, totals.total)),
    },
    {
      label: 'Total',
      value: totals.total,
      color: 'bg-violet-50 border-violet-100 text-violet-700',
      bar: 'bg-violet-500',
      pct: 100,
    },
  ];

  const chartData = data.map((d) => ({
    dia: d.data.slice(8, 10),
    Carros: d.total_carros,
    Motos: d.total_motos,
    Caminhões: d.total_caminhoes,
  }));

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((c) => (
          <div key={c.label} className={`rounded-xl border p-3 sm:p-4 ${c.color}`}>
            <p className="text-xs font-medium opacity-70">{c.label}</p>
            <p className="text-lg sm:text-xl font-bold mt-1">{INT(c.value)}</p>
            <p className="text-xs mt-0.5 opacity-60">{c.pct.toFixed(1)}% do total</p>
            <MiniBar pct={c.pct} color={c.bar} />
          </div>
        ))}
      </div>

      {/* Category breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: 'Rotativo',
            carros: totals.rotCarros,
            motos: totals.rotMotos,
            color: 'border-blue-100',
            hdr: 'text-blue-700 bg-blue-50',
          },
          {
            label: 'Credenciado',
            carros: totals.credCarros,
            motos: totals.credMotos,
            color: 'border-emerald-100',
            hdr: 'text-emerald-700 bg-emerald-50',
          },
          {
            label: 'Mensalista',
            carros: totals.mensCarros,
            motos: totals.mensMotos,
            color: 'border-amber-100',
            hdr: 'text-amber-700 bg-amber-50',
          },
        ].map((cat) => {
          const sub = cat.carros + cat.motos;
          return (
            <div key={cat.label} className={`bg-white rounded-xl border ${cat.color} overflow-hidden shadow-sm`}>
              <div className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${cat.hdr}`}>
                {cat.label}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Carros</span>
                  <span className="font-semibold">{INT(cat.carros)}</span>
                </div>
                <MiniBar pct={Number(PCT(cat.carros, sub))} color="bg-blue-400" />
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-600">Motos</span>
                  <span className="font-semibold">{INT(cat.motos)}</span>
                </div>
                <MiniBar pct={Number(PCT(cat.motos, sub))} color="bg-emerald-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stacked bar chart by vehicle type */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-700 mb-4">
          Entradas por Tipo de Veículo — {MESES[mes]} {ano}
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => INT(v as number)} />
            <Legend />
            <Bar dataKey="Carros" stackId="a" fill="#3b82f6" />
            <Bar dataKey="Motos" stackId="a" fill="#10b981" />
            <Bar dataKey="Caminhões" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed table grouped by category */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">Tabela por Tipo de Veículo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-center text-xs uppercase tracking-wide">
                <th className="px-4 py-2 text-left" rowSpan={2}>Data</th>
                <th className="px-4 py-2 text-left" rowSpan={2}>Dia</th>
                <th className="px-3 py-2 bg-blue-50 text-blue-700 border-x border-blue-100" colSpan={2}>Rotativo</th>
                <th className="px-3 py-2 bg-emerald-50 text-emerald-700 border-x border-emerald-100" colSpan={2}>Credenciado</th>
                <th className="px-3 py-2 bg-amber-50 text-amber-700 border-x border-amber-100" colSpan={2}>Mensalista</th>
                <th className="px-3 py-2 bg-violet-50 text-violet-700 border-x border-violet-100" colSpan={3}>Total</th>
              </tr>
              <tr className="bg-slate-50 text-slate-500 text-xs text-center">
                <th className="px-3 py-2 bg-blue-50 text-blue-600 border-l border-blue-100">Carros</th>
                <th className="px-3 py-2 bg-blue-50 text-blue-600 border-r border-blue-100">Motos</th>
                <th className="px-3 py-2 bg-emerald-50 text-emerald-600 border-l border-emerald-100">Carros</th>
                <th className="px-3 py-2 bg-emerald-50 text-emerald-600 border-r border-emerald-100">Motos</th>
                <th className="px-3 py-2 bg-amber-50 text-amber-600 border-l border-amber-100">Carros</th>
                <th className="px-3 py-2 bg-amber-50 text-amber-600 border-r border-amber-100">Motos</th>
                <th className="px-3 py-2 bg-violet-50 text-violet-600 border-l border-violet-100">Carros</th>
                <th className="px-3 py-2 bg-violet-50 text-violet-600">Motos</th>
                <th className="px-3 py-2 bg-violet-50 text-violet-700 font-semibold border-r border-violet-100">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.data} className="border-t border-slate-50 hover:bg-slate-50 transition-colors text-center">
                  <td className="px-4 py-2.5 font-medium text-left">{d.data}</td>
                  <td className="px-4 py-2.5 text-slate-500 capitalize text-left">{d.dia_semana}</td>
                  <td className="px-3 py-2.5 bg-blue-50/40">{INT(d.rot_carros)}</td>
                  <td className="px-3 py-2.5 bg-blue-50/40">{INT(d.rot_motos)}</td>
                  <td className="px-3 py-2.5 bg-emerald-50/40">{INT(d.cred_carros)}</td>
                  <td className="px-3 py-2.5 bg-emerald-50/40">{INT(d.cred_motos)}</td>
                  <td className="px-3 py-2.5 bg-amber-50/40">{INT(d.mens_carros)}</td>
                  <td className="px-3 py-2.5 bg-amber-50/40">{INT(d.mens_motos)}</td>
                  <td className="px-3 py-2.5 bg-violet-50/40 font-medium">{INT(d.total_carros)}</td>
                  <td className="px-3 py-2.5 bg-violet-50/40 font-medium">{INT(d.total_motos)}</td>
                  <td className="px-3 py-2.5 bg-violet-50/40 font-semibold text-violet-700">{INT(d.total_entradas)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t border-slate-200 font-semibold text-center">
                <td className="px-4 py-3 text-left" colSpan={2}>Total</td>
                <td className="px-3 py-3 bg-blue-100/60">{INT(totals.rotCarros)}</td>
                <td className="px-3 py-3 bg-blue-100/60">{INT(totals.rotMotos)}</td>
                <td className="px-3 py-3 bg-emerald-100/60">{INT(totals.credCarros)}</td>
                <td className="px-3 py-3 bg-emerald-100/60">{INT(totals.credMotos)}</td>
                <td className="px-3 py-3 bg-amber-100/60">{INT(totals.mensCarros)}</td>
                <td className="px-3 py-3 bg-amber-100/60">{INT(totals.mensMotos)}</td>
                <td className="px-3 py-3 bg-violet-100/60">{INT(totals.carros)}</td>
                <td className="px-3 py-3 bg-violet-100/60">{INT(totals.motos)}</td>
                <td className="px-3 py-3 bg-violet-100/60 text-violet-800">{INT(totals.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                             */
/* ------------------------------------------------------------------ */
export default function FluxoVeiculos() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [visao, setVisao] = useState<Visao>('categoria');

  const [catData, setCatData] = useState<FluxoDiario[]>([]);
  const [veicData, setVeicData] = useState<FluxoDiarioVeiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const catPromise = dashboardApi.getFluxoDiario(ano, mes);
    const veicPromise = dashboardApi.getFluxoDiarioVeiculo(ano, mes);

    Promise.all([catPromise, veicPromise])
      .then(([cat, veic]) => {
        setCatData(cat);
        setVeicData(veic);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ano, mes]);

  const isEmpty = visao === 'categoria' ? catData.length === 0 : veicData.length === 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Fluxo de Veículos</h1>
            <p className="text-slate-500 text-sm mt-1">Detalhamento diário por categoria e tipo de veículo</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {/* Toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm bg-white">
              <button
                onClick={() => setVisao('categoria')}
                className={`px-3 sm:px-4 py-1.5 font-medium transition-colors ${
                  visao === 'categoria'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Por Categoria
              </button>
              <button
                onClick={() => setVisao('veiculo')}
                className={`px-3 sm:px-4 py-1.5 font-medium transition-colors ${
                  visao === 'veiculo'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Por Tipo
              </button>
            </div>
            <select
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
            >
              {MESES.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
            >
              {[2024, 2025, 2026].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Erro: {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : isEmpty ? (
          <div className="text-center text-slate-400 py-16">
            Sem dados para o período selecionado.
          </div>
        ) : visao === 'categoria' ? (
          <CategoriaView data={catData} mes={mes} ano={ano} />
        ) : (
          <VeiculoView data={veicData} mes={mes} ano={ano} />
        )}
      </div>
    </div>
  );
}
