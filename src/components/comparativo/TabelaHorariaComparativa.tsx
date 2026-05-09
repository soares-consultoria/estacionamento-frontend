import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { HoraComparativo } from '../../api/client';

const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

function Seta({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-slate-400">—</span>;
  const up = pct > 0;
  const zero = pct === 0;
  if (zero) return <><Minus size={12} className="inline text-slate-400" /> 0,0%</>;
  const cls = up ? 'text-emerald-600' : 'text-red-500';
  const Icon = up ? ArrowUp : ArrowDown;
  return <span className={cls}><Icon size={12} className="inline" /> {Math.abs(pct).toFixed(1)}%</span>;
}

interface Props {
  dados: HoraComparativo[];
  labelA: string;
  labelB: string;
}

export default function TabelaHorariaComparativa({ dados, labelA, labelB }: Props) {
  const totalA = dados.reduce((s, h) => s + h.valor_a, 0);
  const totalB = dados.reduce((s, h) => s + h.valor_b, 0);
  const totalDelta = totalA > 0 ? ((totalB - totalA) / totalA) * 100 : null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm" aria-label="Tabela horária comparativa">
        <caption className="sr-only">Comparativo por faixa horária — {labelA} vs {labelB}</caption>
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Faixa</th>
            <th scope="col" className="text-right px-4 py-3 text-xs font-semibold text-blue-600 uppercase tracking-wider">{labelA}</th>
            <th scope="col" className="text-right px-4 py-3 text-xs font-semibold text-orange-500 uppercase tracking-wider">{labelB}</th>
            <th scope="col" className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Variação %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {dados.map((h, i) => (
            <tr key={h.faixa_horaria} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              <td className="px-4 py-2.5 font-medium text-slate-700">{h.faixa_horaria}</td>
              <td className="px-4 py-2.5 text-right text-slate-700">{h.valor_a > 0 ? INT(h.valor_a) : '—'}</td>
              <td className="px-4 py-2.5 text-right text-slate-700">{h.valor_b > 0 ? INT(h.valor_b) : '—'}</td>
              <td className="px-4 py-2.5 text-right font-semibold"><Seta pct={h.delta_pct} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-slate-200 bg-slate-50">
          <tr>
            <td className="px-4 py-2.5 font-bold text-slate-800">Total</td>
            <td className="px-4 py-2.5 text-right font-bold text-slate-800">{INT(totalA)}</td>
            <td className="px-4 py-2.5 text-right font-bold text-slate-800">{INT(totalB)}</td>
            <td className="px-4 py-2.5 text-right font-bold"><Seta pct={totalDelta} /></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
