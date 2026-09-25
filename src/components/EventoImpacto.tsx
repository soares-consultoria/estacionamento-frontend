import { useEffect, useState } from 'react';
import {
  Area, CartesianGrid, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useInstituicao } from '../hooks/useInstituicao';
import { eventosApi, type EventoImpacto } from '../api/eventos';

const nfInt = new Intl.NumberFormat('pt-BR');
const nfBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const ANOS = (() => { const a = new Date().getFullYear(); return [a + 1, a, a - 1, a - 2]; })();

function fmtData(iso: string | null): string {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { dia: number; fluxo: number; tem_evento: boolean; eventos: string[] } }>;
}
function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700">Dia {String(p.dia).padStart(2, '0')}</p>
      <p className="text-slate-600">Fluxo: <b>{nfInt.format(p.fluxo)}</b></p>
      {p.tem_evento && p.eventos.map((e, i) => (
        <p key={i} className="text-violet-600">🎬 {e}</p>
      ))}
    </div>
  );
}

export default function EventoImpactoSection() {
  const { selectedId } = useInstituicao();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [dados, setDados] = useState<EventoImpacto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const d = await eventosApi.impacto(ano, mes);
        if (!cancelled) setDados(d);
      } catch {
        if (!cancelled) setError('Erro ao carregar o impacto.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ano, mes, selectedId]);

  const dias = dados?.dias ?? [];
  const eventoDias = dias.filter(d => d.tem_evento);
  const temFluxo = dias.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <div>
          <h2 className="text-base font-semibold text-slate-700">Impacto no fluxo</h2>
          <p className="text-xs text-slate-400">Fluxo diário e os dias com evento — para justificar variações.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mt-3">{error}</div>
      ) : loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Carregando...</div>
      ) : !temFluxo ? (
        <div className="h-40 flex flex-col items-center justify-center text-center">
          <p className="text-slate-500 text-sm">Sem dados de fluxo em {MESES[mes - 1]}/{ano}.</p>
          <p className="text-slate-400 text-xs mt-1">Importe os relatórios do mês para ver o impacto dos eventos.</p>
        </div>
      ) : (
        <>
          {/* KPIs de impacto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Maior pico de fluxo</p>
              <p className="text-lg font-bold text-slate-800 tabular-nums">{nfInt.format(dados!.maior_pico_fluxo)}</p>
              <p className="text-[11px] text-slate-400 truncate">
                {fmtData(dados!.maior_pico_data)}{dados!.maior_pico_evento ? ` · ${dados!.maior_pico_evento}` : ''}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Impacto médio no fluxo</p>
              <p className={`text-lg font-bold tabular-nums ${(dados!.impacto_medio_pct ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {dados!.impacto_medio_pct == null ? '—' : `${dados!.impacto_medio_pct >= 0 ? '+' : ''}${String(dados!.impacto_medio_pct).replace('.', ',')}%`}
              </p>
              <p className="text-[11px] text-slate-400">Nos dias com evento vs. base</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Receita extra estimada</p>
              <p className="text-lg font-bold text-emerald-700 tabular-nums">{nfBRL.format(dados!.receita_extra_estimada)}</p>
              <p className="text-[11px] text-slate-400">Atribuída aos eventos</p>
            </div>
          </div>

          {/* Gráfico fluxo diário × eventos */}
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={dias} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gImpacto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={dados!.media_fluxo_base} stroke="#cbd5e1" strokeDasharray="5 4"
                label={{ value: 'média', position: 'right', fontSize: 10, fill: '#94a3b8' }} />
              {eventoDias.map(d => (
                <ReferenceLine key={d.dia} x={d.dia} stroke="#8b5cf6" strokeDasharray="4 3" strokeOpacity={0.7} />
              ))}
              <Area type="monotone" dataKey="fluxo" stroke="#3b82f6" strokeWidth={2.2} fill="url(#gImpacto)" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex gap-4 flex-wrap mt-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><i className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Fluxo diário</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><i className="w-2.5 h-0.5 bg-violet-500 inline-block" /> Dia com evento</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><i className="w-2.5 h-0.5 bg-slate-300 inline-block" /> Média (dias sem evento)</span>
          </div>

          {eventoDias.length === 0 && (
            <p className="text-xs text-slate-400 mt-3">
              Nenhum evento cadastrado em {MESES[mes - 1]}/{ano}. Cadastre eventos para medir o impacto no fluxo.
            </p>
          )}
        </>
      )}
    </div>
  );
}
