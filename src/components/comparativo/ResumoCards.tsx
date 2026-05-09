import { Clock } from 'lucide-react';

const G_DARK = '#1e293b';
const G_MED = '#10b981';
const G_RED = '#ef4444';

const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v);
const fmtPct = (v: number) => Math.abs(v).toFixed(2).replace('.', ',') + '%';

interface Props {
  fluxoA: number;
  fluxoB: number;
  labelA: string;
  labelB: string;
  ultimaHora: string;
}

export default function ResumoCards({
  fluxoA,
  fluxoB,
  labelA,
  labelB,
  ultimaHora,
}: Props) {
  const difAbs = fluxoB - fluxoA;
  const crescPct = fluxoA > 0 ? (difAbs / fluxoA) * 100 : 0;
  const positivo = difAbs >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* Card 1 — Parcial A */}
      <div
        className="bg-white rounded-lg border-2 p-4 text-center"
        style={{ borderColor: G_DARK }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wider mb-1"
          style={{ color: G_DARK }}
        >
          PARCIAL {labelA}
        </p>
        <p className="text-2xl font-extrabold text-slate-800">{INT(fluxoA)}</p>
        <p className="text-xs text-slate-400 mt-1">(Até {ultimaHora})</p>
      </div>

      {/* Card 2 — Parcial B */}
      <div
        className="bg-white rounded-lg border-2 p-4 text-center"
        style={{ borderColor: G_DARK }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wider mb-1"
          style={{ color: G_DARK }}
        >
          PARCIAL {labelB}
        </p>
        <p className="text-2xl font-extrabold text-slate-800">{INT(fluxoB)}</p>
        <p className="text-xs text-slate-400 mt-1">(Até {ultimaHora})</p>
      </div>

      {/* Card 3 — Diferença */}
      <div
        className="bg-white rounded-lg border-2 p-4 text-center"
        style={{ borderColor: G_DARK }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wider mb-1"
          style={{ color: G_DARK }}
        >
          DIFERENÇA
        </p>
        <p
          className="text-2xl font-extrabold"
          style={{ color: positivo ? G_MED : G_RED }}
        >
          {positivo ? '+' : '-'}{INT(Math.abs(difAbs))}
        </p>
        <p className="text-xs text-slate-400 mt-1">(Até {ultimaHora})</p>
      </div>

      {/* Card 4 — Crescimento % */}
      <div
        className="bg-white rounded-lg border-2 p-4 text-center"
        style={{ borderColor: G_DARK }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wider mb-1"
          style={{ color: G_DARK }}
        >
          CRESCIMENTO %
        </p>
        <p
          className="text-2xl font-extrabold"
          style={{ color: positivo ? G_MED : G_RED }}
        >
          {positivo ? '+' : '-'}{fmtPct(crescPct)} {positivo ? '↑' : '↓'}
        </p>
        <p className="text-xs text-slate-400 mt-1">(Até {ultimaHora})</p>
      </div>

      {/* Card 5 — Aguardando fechamento */}
      <div
        className="bg-white rounded-lg border-2 p-4 text-center flex flex-col items-center justify-center gap-1"
        style={{ borderColor: G_DARK }}
      >
        <Clock size={22} style={{ color: G_DARK }} />
        <p
          className="text-xs font-bold uppercase tracking-wider leading-tight"
          style={{ color: G_DARK }}
        >
          AGUARDANDO O FECHAMENTO
        </p>
        <p className="text-xs text-slate-400">Valor parcial até {ultimaHora}</p>
      </div>
    </div>
  );
}
