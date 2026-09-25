import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { useInstituicao } from '../hooks/useInstituicao';
import { permanenciaApi, type Permanencia, type PermanenciaTendencia } from '../api/permanencia';

const nfInt = new Intl.NumberFormat('pt-BR');
const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const ANOS = (() => {
  const atual = new Date().getFullYear();
  return [atual + 1, atual, atual - 1, atual - 2];
})();

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

interface TendTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { mes: string; label: string | null } }>;
}
function TendenciaTooltip({ active, payload }: TendTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700">{p.mes}</p>
      <p className="text-slate-600">Média: <b>{p.label ?? '—'}</b></p>
    </div>
  );
}

export default function PermanenciaPage() {
  const { selectedId } = useInstituicao();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [dados, setDados] = useState<Permanencia | null>(null);
  const [tendencia, setTendencia] = useState<PermanenciaTendencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refaz ao trocar ano/instituição; ignora respostas obsoletas (evita race entre requests).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [d, t] = await Promise.all([permanenciaApi.get(ano), permanenciaApi.tendencia(ano)]);
        if (!cancelled) { setDados(d); setTendencia(t); }
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
                <p className="text-xs text-slate-400 mb-2">Participação por categoria no total de veículos.</p>
                {(() => {
                  const comp = [
                    { label: 'Rotativo', valor: dados!.total_rotativo, cor: '#3b82f6' },
                    { label: 'Cred./Mensalista', valor: dados!.total_cred_mens, cor: '#10b981' },
                    { label: 'Cartão débito', valor: dados!.total_cartao_debito, cor: '#f59e0b' },
                  ].filter(c => c.valor > 0);
                  return (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative shrink-0" style={{ width: 168, height: 168 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={comp} dataKey="valor" nameKey="label" cx="50%" cy="50%"
                              innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none">
                              {comp.map(c => <Cell key={c.label} fill={c.cor} />)}
                            </Pie>
                            <Tooltip
                              formatter={(v, n) => {
                                const val = Number(v) || 0;
                                return [`${nfInt.format(val)} (${pct(val, dados!.total_veiculos)}%)`, String(n)];
                              }}
                              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-lg font-bold text-slate-800 tabular-nums leading-none">{nfInt.format(dados!.total_veiculos)}</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">veículos</span>
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-2.5">
                        {comp.map(c => (
                          <div key={c.label} className="flex items-center justify-between text-sm">
                            <span className="inline-flex items-center gap-2 text-slate-600">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.cor }} /> {c.label}
                            </span>
                            <span className="text-slate-800 font-semibold tabular-nums">
                              {nfInt.format(c.valor)} <span className="text-slate-400 font-normal">({pct(c.valor, dados!.total_veiculos)}%)</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                  As categorias seguem exatamente como o relatório (RFE) fornece a permanência:
                  <b> Rotativo</b> e <b>Cred./Mensalista</b> (tipo de cliente) e <b>Cartão débito</b> (forma de pagamento avulsa).
                </p>
              </div>
            </div>

            {/* Evolução da permanência média (12 meses) */}
            {tendencia && tendencia.meses.some(m => m.permanencia_media_minutos != null) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="text-base font-semibold text-slate-700">Evolução da permanência média</h2>
                <p className="text-xs text-slate-400 mb-4">{ano} — permanência média estimada por mês (horas).</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart
                    data={tendencia.meses.map(m => ({ mes: m.mes_nome, minutos: m.permanencia_media_minutos, label: m.permanencia_media_label }))}
                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gTend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                      tickFormatter={(v: number) => `${(v / 60).toFixed(1).replace('.', ',')}h`} />
                    <Tooltip content={<TendenciaTooltip />} />
                    <Area type="monotone" dataKey="minutos" stroke="#10b981" strokeWidth={2.2}
                      fill="url(#gTend)" connectNulls dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

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
