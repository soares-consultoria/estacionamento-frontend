import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useInstituicao } from '../hooks/useInstituicao';
import { permanenciaApi, type Permanencia } from '../api/permanencia';

const nfInt = new Intl.NumberFormat('pt-BR');
const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const ANOS = (() => {
  const atual = new Date().getFullYear();
  return [atual + 1, atual, atual - 1, atual - 2];
})();

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default function PermanenciaPage() {
  const { selectedId } = useInstituicao();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [dados, setDados] = useState<Permanencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refaz ao trocar ano/instituição; ignora respostas obsoletas (evita race entre requests).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const d = await permanenciaApi.get(ano);
        if (!cancelled) setDados(d);
      } catch {
        if (!cancelled) setError('Erro ao carregar a permanência.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ano, selectedId]);

  const faixas = dados?.faixas ?? [];
  const maxTotal = faixas.reduce((mx, f) => Math.max(mx, f.total), 0);
  const temDados = !!dados && dados.total_veiculos > 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Permanência Média</h1>
            <p className="text-slate-500 text-sm mt-1">
              Quanto tempo, em média, os veículos ficam no estacionamento — e como isso se distribui.
            </p>
          </div>
          <select
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        {error ? null : loading ? (
          <LoadingSpinner label="Carregando permanência..." />
        ) : !temDados ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 text-center">
            <Clock className="mx-auto text-slate-300" size={40} />
            <p className="text-slate-600 font-medium mt-3">Sem dados de permanência para {ano}</p>
            <p className="text-slate-400 text-sm mt-1">
              Importe relatórios financeiros (RFE) do ano para ver a distribuição por tempo de estadia.
            </p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <p className="text-slate-500 text-sm font-medium">Permanência média</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{dados!.permanencia_media_label ?? '—'}</p>
                <p className="text-xs text-slate-400 mt-1">Estimativa (ponto médio das faixas)</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <p className="text-slate-500 text-sm font-medium">Rotativo</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{dados!.rotativo_media_label ?? '—'}</p>
                <p className="text-xs text-slate-400 mt-1">Tempo médio do rotativo</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <p className="text-slate-500 text-sm font-medium">Cred./Mensalista</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{dados!.cred_mens_media_label ?? '—'}</p>
                <p className="text-xs text-slate-400 mt-1">Credenciado + mensalista</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                <p className="text-slate-500 text-sm font-medium">Faixa mais comum</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{dados!.faixa_mais_comum ?? '—'}</p>
                <p className="text-xs text-slate-400 mt-1">{nfInt.format(dados!.total_veiculos)} veículos no total</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Distribuição por faixa */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="text-base font-semibold text-slate-700">Distribuição por faixa de permanência</h2>
                <p className="text-xs text-slate-400 mb-4">{ano} — quantidade de veículos por tempo de permanência.</p>
                <div className="space-y-3">
                  {faixas.map(f => (
                    <div key={f.faixa}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">{f.faixa}</span>
                        <span className="text-slate-800 font-semibold tabular-nums">
                          {nfInt.format(f.total)} <span className="text-slate-400 font-normal">({nf1.format(f.pct)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${maxTotal > 0 ? Math.round((f.total / maxTotal) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Composição */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="text-base font-semibold text-slate-700">Composição</h2>
                <p className="text-xs text-slate-400 mb-4">Participação por categoria no total de veículos.</p>
                <div className="space-y-4">
                  {[
                    { label: 'Rotativo', valor: dados!.total_rotativo, cor: 'bg-blue-500' },
                    { label: 'Cred./Mensalista', valor: dados!.total_cred_mens, cor: 'bg-emerald-500' },
                    { label: 'Cartão débito', valor: dados!.total_cartao_debito, cor: 'bg-amber-500' },
                  ].map(c => (
                    <div key={c.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <span className={`w-2.5 h-2.5 rounded-full ${c.cor}`} /> {c.label}
                        </span>
                        <span className="text-slate-800 font-semibold tabular-nums">
                          {nfInt.format(c.valor)} <span className="text-slate-400 font-normal">({pct(c.valor, dados!.total_veiculos)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full ${c.cor}`} style={{ width: `${pct(c.valor, dados!.total_veiculos)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                  As categorias seguem exatamente como o relatório (RFE) fornece a permanência:
                  <b> Rotativo</b> e <b>Cred./Mensalista</b> (tipo de cliente) e <b>Cartão débito</b> (forma de pagamento avulsa).
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              As faixas vêm da estatística de permanência já extraída dos relatórios (RFE). A permanência média é uma
              <b> estimativa</b>, pelo ponto médio de cada faixa ponderado pela quantidade de veículos.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
