interface Props {
  percentual: number | null;
}

/** Barra fina de consumo de cota de IA. Verde/gradiente < 80%, âmbar 80-99%, vermelho >= 100%. */
export default function ChatAiUsoBar({ percentual }: Props) {
  if (percentual == null) return null;
  const pct = Math.min(100, Math.max(0, percentual));
  const cor =
    pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-violet-500 to-blue-500';

  return (
    <div className="px-3 pb-2 pt-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-500">
          Você usou {pct.toFixed(0)}% da sua cota de IA
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${cor}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
