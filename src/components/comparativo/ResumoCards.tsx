import { Clock, CheckCircle2 } from 'lucide-react';

const G_DARK = '#1e293b';
const G_MED = '#10b981';
const G_RED = '#ef4444';

const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v);
const fmtPct = (v: number) => Math.abs(v).toFixed(2).replace('.', ',') + '%';

interface Props {
  fluxoA: number | null; // null = sem dados (≠ 0 veículos)
  fluxoB: number;
  labelA: string;
  labelB: string;
  ultimaHora: string;
  diaCompleto?: boolean;
}

export default function ResumoCards({
  fluxoA,
  fluxoB,
  labelA,
  labelB,
  ultimaHora,
  diaCompleto = false,
}: Props) {
  const semDadosA = fluxoA == null;
  const difAbs = semDadosA ? null : fluxoB - fluxoA!;
  const crescPct: number | null =
    !semDadosA && fluxoA! > 0 ? (difAbs! / fluxoA!) * 100 : null;
  const positivo = (difAbs ?? 0) >= 0;

  // Rótulo dos cards: "TOTAL" quando o dia está completo, "PARCIAL" caso contrário.
  const prefixo = diaCompleto ? 'TOTAL' : 'PARCIAL';
  const sufixo = diaCompleto ? '(dia completo)' : `(Até ${ultimaHora})`;

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
          {prefixo} {labelA}
        </p>
        <p className="text-2xl font-extrabold text-slate-800">
          {semDadosA ? '—' : INT(fluxoA!)}
        </p>
        <p className="text-xs text-slate-400 mt-1">{sufixo}</p>
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
          {prefixo} {labelB}
        </p>
        <p className="text-2xl font-extrabold text-slate-800">{INT(fluxoB)}</p>
        <p className="text-xs text-slate-400 mt-1">{sufixo}</p>
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
          style={{ color: difAbs == null ? G_DARK : positivo ? G_MED : G_RED }}
        >
          {difAbs == null
            ? '—'
            : `${positivo ? '+' : '-'}${INT(Math.abs(difAbs))}`}
        </p>
        <p className="text-xs text-slate-400 mt-1">{sufixo}</p>
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
          style={{ color: crescPct == null ? G_DARK : positivo ? G_MED : G_RED }}
        >
          {crescPct == null
            ? '—'
            : `${positivo ? '+' : '-'}${fmtPct(crescPct)} ${positivo ? '↑' : '↓'}`}
        </p>
        <p className="text-xs text-slate-400 mt-1">{sufixo}</p>
      </div>

      {/* Card 5 — Status do dia (completo vs aguardando fechamento) */}
      <div
        className="bg-white rounded-lg border-2 p-4 text-center flex flex-col items-center justify-center gap-1"
        style={{ borderColor: diaCompleto ? G_MED : G_DARK }}
      >
        {diaCompleto ? (
          <>
            <CheckCircle2 size={22} style={{ color: G_MED }} />
            <p
              className="text-xs font-bold uppercase tracking-wider leading-tight"
              style={{ color: G_MED }}
            >
              DIA COMPLETO
            </p>
            <p className="text-xs text-slate-400">Importação do dia inteiro</p>
          </>
        ) : (
          <>
            <Clock size={22} style={{ color: G_DARK }} />
            <p
              className="text-xs font-bold uppercase tracking-wider leading-tight"
              style={{ color: G_DARK }}
            >
              AGUARDANDO O FECHAMENTO
            </p>
            <p className="text-xs text-slate-400">Valor parcial até {ultimaHora}</p>
          </>
        )}
      </div>
    </div>
  );
}
