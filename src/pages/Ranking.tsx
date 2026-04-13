import { FeatureGate } from '../components/FeatureGate';
import { useEffect, useState } from 'react';
import { dashboardApi, type RankingInstituicao } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { Medal, Trophy } from 'lucide-react';

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

const MEDAL_COLORS = ['text-amber-400', 'text-slate-400', 'text-amber-600'];

export default function Ranking() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [dados, setDados] = useState<RankingInstituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardApi.getRankingInstituicoes(ano, mes)
      .then(setDados)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ano, mes]);

  const comDados = dados.filter(d => d.dias_com_dados > 0);
  const top3 = comDados.slice(0, 3);
  const maxReceita = comDados.length ? Math.max(...comDados.map(d => d.receita_total), 1) : 1;

  return (
    <FeatureGate funcionalidade="ranking">
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Ranking de Instituições</h1>
            <p className="text-slate-500 text-sm mt-1">Comparativo de desempenho entre todas as instituições</p>
          </div>
          <MonthSelector ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m); }} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Erro ao carregar dados: {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Carregando ranking..." />
        ) : comDados.length === 0 ? (
          <div className="text-center text-slate-400 py-16">Nenhuma instituição com dados para o período selecionado.</div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {top3.map((inst, i) => (
                  <div
                    key={inst.instituicao_id}
                    className={`rounded-xl border p-4 ${
                      i === 0
                        ? 'bg-amber-50 border-amber-200 shadow-md'
                        : 'bg-white border-slate-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {i < 3 ? (
                        <Trophy size={18} className={MEDAL_COLORS[i]} />
                      ) : (
                        <Medal size={18} className="text-slate-400" />
                      )}
                      <span className={`text-xs font-bold uppercase tracking-wide ${MEDAL_COLORS[i] ?? 'text-slate-400'}`}>
                        {i + 1}º lugar
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">{inst.nome_instituicao}</p>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{BRL(inst.receita_total)}</p>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs text-slate-500">{INT(inst.fluxo_total)} veículos</p>
                      <p className="text-xs text-slate-500">Ticket médio: {BRL(inst.ticket_medio)}</p>
                      <p className="text-xs text-slate-400">{inst.dias_com_dados} dias com dados</p>
                    </div>
                    {/* Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${(inst.receita_total / maxReceita) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-10">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Instituição</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Receita</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Fluxo</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Pagantes</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Ticket Médio</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Dias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {comDados.map((inst) => (
                    <tr key={inst.instituicao_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center">
                        {inst.posicao <= 3 ? (
                          <Trophy size={16} className={MEDAL_COLORS[inst.posicao - 1]} />
                        ) : (
                          <span className="text-sm text-slate-400 font-medium">{inst.posicao}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{inst.nome_instituicao}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">{BRL(inst.receita_total)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 hidden sm:table-cell">{INT(inst.fluxo_total)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 hidden md:table-cell">{INT(inst.pagantes_total)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 hidden lg:table-cell">{BRL(inst.ticket_medio)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-400 hidden lg:table-cell">{inst.dias_com_dados}</td>
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
