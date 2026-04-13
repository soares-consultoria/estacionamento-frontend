import { useEffect, useState } from 'react';
import { FeatureGate } from '../components/FeatureGate';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardApi, type FluxoHorarioVeiculo, type MovimentacaoHoraria } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const INT = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0);

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Visao = 'categoria' | 'veiculo';

export default function MovimentacaoHorariaPage() {
  const [data, setData] = useState(toDateString(new Date()));
  const [visao, setVisao] = useState<Visao>('categoria');
  const [rows, setRows] = useState<MovimentacaoHoraria[]>([]);
  const [veicRows, setVeicRows] = useState<FluxoHorarioVeiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setLoading(true);
    setError(null);
    Promise.all([
      dashboardApi.getMovimentacaoHoraria(data),
      dashboardApi.getFluxoHorarioVeiculo(data),
    ])
      .then(([cat, veic]) => {
        setRows(cat);
        setVeicRows(veic);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [data]);

  const chartData = rows.map((r) => ({
    faixa: r.faixa_horaria,
    'Entradas Rot.': r.rotativo_entradas,
    'Entradas Cred.': r.credenciado_entradas,
    'Entradas Mensal.': r.mensalista_entradas,
    'Total Entradas': r.total_entradas,
    'Total Saídas': r.total_saidas,
  }));

  const veicChartData = veicRows.map((r) => ({
    faixa: r.faixa_horaria,
    'Carros E': r.total_carros_ent,
    'Motos E': r.total_motos_ent,
    'Carros S': r.total_carros_sai,
    'Motos S': r.total_motos_sai,
  }));

  const peakEntry = rows.reduce((max, r) => (r.total_entradas > (max?.total_entradas ?? 0) ? r : max), rows[0]);
  const peakExit = rows.reduce((max, r) => (r.total_saidas > (max?.total_saidas ?? 0) ? r : max), rows[0]);

  const isEmpty = visao === 'categoria' ? rows.length === 0 : veicRows.length === 0;

  return (
    <FeatureGate funcionalidade="movimentacao-horaria">
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Movimentação Horária</h1>
            <p className="text-slate-500 text-sm mt-1">Fluxo de entradas e saídas por faixa horária</p>
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
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            <p>Nenhuma movimentação encontrada para {data}.</p>
            <p className="text-sm mt-1">Selecione outra data ou importe os relatórios.</p>
          </div>
        ) : visao === 'categoria' ? (
          <>
            {/* Peak info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {peakEntry && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Pico de Entradas</p>
                  <p className="text-xl font-bold text-blue-800 mt-1">{peakEntry.faixa_horaria}</p>
                  <p className="text-sm text-blue-600">{INT(peakEntry.total_entradas)} entradas</p>
                </div>
              )}
              {peakExit && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Pico de Saídas</p>
                  <p className="text-xl font-bold text-amber-800 mt-1">{peakExit.faixa_horaria}</p>
                  <p className="text-sm text-amber-600">{INT(peakExit.total_saidas)} saídas</p>
                </div>
              )}
            </div>

            {/* Area chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Entradas e Saídas por Faixa Horária</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => INT(v as number)} />
                  <Legend />
                  <Area type="monotone" dataKey="Total Entradas" stroke="#3b82f6" fill="url(#gradE)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Total Saídas" stroke="#f59e0b" fill="url(#gradS)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stacked by category chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Entradas por Categoria</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => INT(v as number)} />
                  <Legend />
                  <Area type="monotone" dataKey="Entradas Rot." stroke="#3b82f6" fill="#dbeafe" strokeWidth={1.5} stackId="1" />
                  <Area type="monotone" dataKey="Entradas Cred." stroke="#10b981" fill="#d1fae5" strokeWidth={1.5} stackId="1" />
                  <Area type="monotone" dataKey="Entradas Mensal." stroke="#f59e0b" fill="#fef3c7" strokeWidth={1.5} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-700">Detalhamento por Faixa Horária</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-left">
                      <th className="px-4 py-3 font-medium">Faixa</th>
                      <th className="px-4 py-3 font-medium text-right">Rot. E</th>
                      <th className="px-4 py-3 font-medium text-right">Rot. S</th>
                      <th className="px-4 py-3 font-medium text-right">Cred. E</th>
                      <th className="px-4 py-3 font-medium text-right">Cred. S</th>
                      <th className="px-4 py-3 font-medium text-right">Mens. E</th>
                      <th className="px-4 py-3 font-medium text-right">Mens. S</th>
                      <th className="px-4 py-3 font-medium text-right">CDEB E</th>
                      <th className="px-4 py-3 font-medium text-right">CDEB S</th>
                      <th className="px-4 py-3 font-medium text-right bg-blue-50 text-blue-700">Total E</th>
                      <th className="px-4 py-3 font-medium text-right bg-amber-50 text-amber-700">Total S</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.faixa_horaria} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-700">{r.faixa_horaria}</td>
                        <td className="px-4 py-2.5 text-right">{INT(r.rotativo_entradas)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{INT(r.rotativo_saidas)}</td>
                        <td className="px-4 py-2.5 text-right">{INT(r.credenciado_entradas)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{INT(r.credenciado_saidas)}</td>
                        <td className="px-4 py-2.5 text-right">{INT(r.mensalista_entradas)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{INT(r.mensalista_saidas)}</td>
                        <td className="px-4 py-2.5 text-right">{INT(r.cdeb_entradas)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{INT(r.cdeb_saidas)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-blue-700 bg-blue-50">{INT(r.total_entradas)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-amber-700 bg-amber-50">{INT(r.total_saidas)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* ---- Visão Por Tipo de Veículo ---- */
          <>
            {/* Bar chart Carros vs Motos entradas */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Entradas e Saídas por Tipo de Veículo</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={veicChartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => INT(v as number)} />
                  <Legend />
                  <Bar dataKey="Carros E" fill="#3b82f6" />
                  <Bar dataKey="Motos E" fill="#10b981" />
                  <Bar dataKey="Carros S" fill="#93c5fd" />
                  <Bar dataKey="Motos S" fill="#6ee7b7" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed vehicle table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-700">Detalhamento por Tipo de Veículo</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-center text-xs uppercase tracking-wide">
                      <th className="px-4 py-2 text-left" rowSpan={2}>Faixa</th>
                      <th className="px-3 py-2 bg-blue-50 text-blue-700 border-x border-blue-100" colSpan={4}>Rotativo</th>
                      <th className="px-3 py-2 bg-emerald-50 text-emerald-700 border-x border-emerald-100" colSpan={4}>Credenciado</th>
                      <th className="px-3 py-2 bg-amber-50 text-amber-700 border-x border-amber-100" colSpan={4}>Mensalista</th>
                      <th className="px-3 py-2 bg-violet-50 text-violet-700 border-x border-violet-100" colSpan={2}>Total</th>
                    </tr>
                    <tr className="bg-slate-50 text-xs text-center">
                      <th className="px-2 py-2 bg-blue-50 text-blue-600 border-l border-blue-100">Car.E</th>
                      <th className="px-2 py-2 bg-blue-50 text-blue-600">Mot.E</th>
                      <th className="px-2 py-2 bg-blue-50 text-blue-400">Car.S</th>
                      <th className="px-2 py-2 bg-blue-50 text-blue-400 border-r border-blue-100">Mot.S</th>
                      <th className="px-2 py-2 bg-emerald-50 text-emerald-600 border-l border-emerald-100">Car.E</th>
                      <th className="px-2 py-2 bg-emerald-50 text-emerald-600">Mot.E</th>
                      <th className="px-2 py-2 bg-emerald-50 text-emerald-400">Car.S</th>
                      <th className="px-2 py-2 bg-emerald-50 text-emerald-400 border-r border-emerald-100">Mot.S</th>
                      <th className="px-2 py-2 bg-amber-50 text-amber-600 border-l border-amber-100">Car.E</th>
                      <th className="px-2 py-2 bg-amber-50 text-amber-600">Mot.E</th>
                      <th className="px-2 py-2 bg-amber-50 text-amber-400">Car.S</th>
                      <th className="px-2 py-2 bg-amber-50 text-amber-400 border-r border-amber-100">Mot.S</th>
                      <th className="px-2 py-2 bg-violet-50 text-violet-700 font-semibold border-l border-violet-100">Ent.</th>
                      <th className="px-2 py-2 bg-violet-50 text-violet-500 border-r border-violet-100">Saí.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {veicRows.map((r) => (
                      <tr key={r.faixa_horaria} className="border-t border-slate-50 hover:bg-slate-50 transition-colors text-center">
                        <td className="px-4 py-2 font-medium text-slate-700 text-left">{r.faixa_horaria}</td>
                        <td className="px-2 py-2 bg-blue-50/40">{INT(r.rot_carros_ent)}</td>
                        <td className="px-2 py-2 bg-blue-50/40">{INT(r.rot_motos_ent)}</td>
                        <td className="px-2 py-2 bg-blue-50/30 text-slate-400">{INT(r.rot_carros_sai)}</td>
                        <td className="px-2 py-2 bg-blue-50/30 text-slate-400">{INT(r.rot_motos_sai)}</td>
                        <td className="px-2 py-2 bg-emerald-50/40">{INT(r.cred_carros_ent)}</td>
                        <td className="px-2 py-2 bg-emerald-50/40">{INT(r.cred_motos_ent)}</td>
                        <td className="px-2 py-2 bg-emerald-50/30 text-slate-400">{INT(r.cred_carros_sai)}</td>
                        <td className="px-2 py-2 bg-emerald-50/30 text-slate-400">{INT(r.cred_motos_sai)}</td>
                        <td className="px-2 py-2 bg-amber-50/40">{INT(r.mens_carros_ent)}</td>
                        <td className="px-2 py-2 bg-amber-50/40">{INT(r.mens_motos_ent)}</td>
                        <td className="px-2 py-2 bg-amber-50/30 text-slate-400">{INT(r.mens_carros_sai)}</td>
                        <td className="px-2 py-2 bg-amber-50/30 text-slate-400">{INT(r.mens_motos_sai)}</td>
                        <td className="px-2 py-2 bg-violet-50/40 font-semibold text-violet-700">{INT(r.total_entradas)}</td>
                        <td className="px-2 py-2 bg-violet-50/30 text-slate-500">{INT(r.total_saidas)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </FeatureGate>
  );
}
