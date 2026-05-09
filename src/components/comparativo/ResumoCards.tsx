import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { ResumoComparativo, DeltaResumo } from '../../api/client';

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v ?? 0);

function PilulaDelta({ pct }: { pct: number | null | undefined }) {
  if (pct == null) return <span className="text-slate-400 text-xs">—</span>;
  const up = pct >= 0;
  const zero = pct === 0;
  const color = up ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
  const Icon = zero ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold ${color}`}>
      <Icon size={10} />{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

interface Props {
  resumoA: ResumoComparativo;
  resumoB: ResumoComparativo;
  delta: DeltaResumo;
  labelA: string;
  labelB: string;
}

export default function ResumoCards({ resumoA, resumoB, delta, labelA }: Props) {
  const cards = [
    { title: 'Fluxo Total', valueB: INT(resumoB.fluxo_total), valueA: INT(resumoA.fluxo_total), deltaPct: delta.fluxo_total_pct },
    { title: 'Média/hora', valueB: INT(resumoB.media_por_hora), valueA: INT(resumoA.media_por_hora), deltaPct: delta.media_por_hora_pct },
    { title: 'Hora Pico', valueB: resumoB.hora_pico ?? '—', valueA: resumoA.hora_pico ?? '—', deltaPct: null },
    { title: 'Hora Vale', valueB: resumoB.hora_vale ?? '—', valueA: resumoA.hora_vale ?? '—', deltaPct: null },
    { title: 'Crescimento Geral', valueB: BRL(resumoB.receita), valueA: BRL(resumoA.receita), deltaPct: delta.receita_pct },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(card => (
        <div key={card.title} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{card.title}</p>
          <p className="text-lg font-bold text-slate-800">{card.valueB}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{labelA}: {card.valueA}</span>
            <PilulaDelta pct={card.deltaPct} />
          </div>
        </div>
      ))}
    </div>
  );
}
