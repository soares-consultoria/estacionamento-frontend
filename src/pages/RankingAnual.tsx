import { useCallback, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useInstituicao } from '../hooks/useInstituicao';
import { rankingAnualApi, type MetricaRanking, type RankingAnual } from '../api/rankingAnual';

const nfInt = new Intl.NumberFormat('pt-BR');
const nfBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function fmtData(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
function capitalize(s: string): string {
  if (!s) return s;
  const t = s.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const ANOS = (() => {
  const atual = new Date().getFullYear();
  return [atual + 1, atual, atual - 1, atual - 2];
})();

const MEDALHAS = ['🥇', '🥈', '🥉'];

export default function RankingAnualPage() {
  const { selectedId } = useInstituicao();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [metrica, setMetrica] = useState<MetricaRanking>('FLUXO');
  const [dados, setDados] = useState<RankingAnual | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDados(await rankingAnualApi.get(ano, metrica, 10));
    } catch {
      setError('Erro ao carregar o ranking.');
    } finally {
      setLoading(false);
    }
  }, [ano, metrica]);

  useEffect(() => { load(); }, [load, selectedId]);

  const itens = dados?.itens ?? [];
  const maxValor = itens.reduce((mx, it) => Math.max(mx, metrica === 'FLUXO' ? it.fluxo : it.receita), 0);
  const melhorDia = itens[0];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Ranking Anual</h1>
            <p className="text-slate-500 text-sm mt-1">
              Os maiores dias do ano em fluxo e em receita — para reconhecer padrões e planejar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
              {(['FLUXO', 'RECEITA'] as MetricaRanking[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMetrica(m)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    metrica === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m === 'FLUXO' ? 'Fluxo' : 'Receita'}
                </button>
              ))}
            </div>
            <select
              value={ano}
              onChange={e => setAno(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <LoadingSpinner label="Carregando ranking..." />
        ) : !dados || itens.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 text-center">
            <Trophy className="mx-auto text-slate-300" size={40} />
            <p className="text-slate-600 font-medium mt-3">Sem dados para {ano}</p>
            <p className="text-slate-400 text-sm mt-1">Importe relatórios do ano para ver o ranking dos maiores dias.</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <p className="text-slate-500 text-sm font-medium">
                  {metrica === 'FLUXO' ? 'Melhor dia (fluxo)' : 'Melhor dia (receita)'}
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">
                  {melhorDia ? (metrica === 'FLUXO' ? nfInt.format(melhorDia.fluxo) : nfBRL.format(melhorDia.receita)) : '—'}
                </p>
                {melhorDia && (
                  <p className="text-xs text-slate-400 mt-1">{fmtData(melhorDia.data)} · {capitalize(melhorDia.dia_semana)}</p>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <p className="text-slate-500 text-sm font-medium">Média diária do ano</p>
                <p className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">
                  {metrica === 'FLUXO' ? nfInt.format(dados.media_diaria_fluxo) : nfBRL.format(dados.media_diaria_receita)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Base de comparação</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <p className="text-slate-500 text-sm font-medium">Melhor mês</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{dados.melhor_mes_nome ?? '—'}</p>
                <p className="text-xs text-slate-400 mt-1 tabular-nums">
                  {metrica === 'FLUXO'
                    ? `${nfInt.format(dados.melhor_mes_fluxo)} veículos`
                    : nfBRL.format(dados.melhor_mes_receita)}
                </p>
              </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-14">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Dia</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Fluxo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Receita</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell w-44">Participação</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map(it => {
                    const valor = metrica === 'FLUXO' ? it.fluxo : it.receita;
                    const pct = maxValor > 0 ? Math.round((valor / maxValor) * 100) : 0;
                    return (
                      <tr key={it.data} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                            it.posicao === 1 ? 'bg-amber-100 text-amber-700'
                            : it.posicao === 2 ? 'bg-slate-100 text-slate-600'
                            : it.posicao === 3 ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-50 text-slate-400'
                          }`}>
                            {it.posicao <= 3 ? MEDALHAS[it.posicao - 1] : it.posicao}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{fmtData(it.data)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 text-center hidden sm:table-cell">{capitalize(it.dia_semana)}</td>
                        <td className={`px-4 py-3 text-sm text-right tabular-nums ${metrica === 'FLUXO' ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                          {nfInt.format(it.fluxo)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right tabular-nums font-bold ${metrica === 'RECEITA' ? 'text-emerald-700' : 'text-slate-600'}`}>
                          {nfBRL.format(it.receita)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[80px]">
                            <div
                              className={`h-1.5 rounded-full ${metrica === 'FLUXO' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-400">
              Ranking dos {itens.length} maiores dias de <b>{metrica === 'FLUXO' ? 'fluxo' : 'receita'}</b> em {ano},
              na instituição selecionada. Alterne o critério nas abas acima.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
