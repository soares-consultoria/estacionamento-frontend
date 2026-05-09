import { TrendingUp, Clock, BarChart2 } from 'lucide-react';

const G_DARK = '#1e293b';

interface Props {
  fluxoA: number;
  fluxoB: number;
  crescPct: number;
  ultimaHora: string;
  labelA: string;
  labelB: string;
}

export default function ResumoExecutivo({
  crescPct,
  ultimaHora,
  labelA,
  labelB,
}: Props) {
  const sinal = crescPct >= 0 ? 'acima' : 'abaixo';
  const pctFormatado = Math.abs(crescPct).toFixed(2).replace('.', ',') + '%';

  const bullets = [
    {
      Icon: TrendingUp,
      texto: (
        <>
          Até {ultimaHora}, o fluxo de <strong>{labelB}</strong> está{' '}
          <strong>
            {pctFormatado} {sinal}
          </strong>{' '}
          de <strong>{labelA}</strong>.
        </>
      ),
    },
    {
      Icon: Clock,
      texto: (
        <>
          Comparativo parcial realizado até o último horário informado (
          <strong>{ultimaHora}</strong>).
        </>
      ),
    },
    {
      Icon: BarChart2,
      texto: (
        <>
          Aguardamos o fechamento para apresentação do total geral de{' '}
          <strong>{labelB}</strong>.
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {bullets.map(({ Icon, texto }, i) => (
        <div key={i} className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: G_DARK }}
          >
            <Icon size={14} color="white" />
          </div>
          <p className="text-xs text-slate-700 leading-relaxed pt-0.5">{texto}</p>
        </div>
      ))}
    </div>
  );
}
