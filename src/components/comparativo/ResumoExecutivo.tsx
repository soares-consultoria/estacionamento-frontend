import { TrendingUp, Clock, BarChart2, CheckCircle2 } from 'lucide-react';

const G_DARK = '#1e293b';

const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

interface Props {
  fluxoA: number;
  fluxoB: number;
  crescPct: number | null;
  ultimaHora: string;
  labelA: string;
  labelB: string;
  diaCompleto?: boolean;
  totalB?: number;
}

export default function ResumoExecutivo({
  crescPct,
  ultimaHora,
  labelA,
  labelB,
  diaCompleto = false,
  totalB = 0,
}: Props) {
  const sinal = (crescPct ?? 0) >= 0 ? 'acima' : 'abaixo';
  const pctFormatado =
    crescPct == null
      ? null
      : Math.abs(crescPct).toFixed(2).replace('.', ',') + '%';
  // "Até Xh" só faz sentido quando parcial; no dia completo, fala do dia inteiro.
  const prefixoComparacao = diaCompleto ? 'No dia completo' : `Até ${ultimaHora}`;

  const bullets = [
    {
      Icon: TrendingUp,
      texto:
        pctFormatado == null ? (
          <>
            Dados insuficientes para calcular o crescimento de{' '}
            <strong>{labelB}</strong> em relação a <strong>{labelA}</strong>.
          </>
        ) : (
          <>
            {prefixoComparacao}, o fluxo de <strong>{labelB}</strong> está{' '}
            <strong>
              {pctFormatado} {sinal}
            </strong>{' '}
            de <strong>{labelA}</strong>.
          </>
        ),
    },
    diaCompleto
      ? {
          Icon: CheckCircle2,
          texto: (
            <>
              Dia completo: a importação cobriu o dia inteiro (até as{' '}
              <strong>23h</strong>) — resultado final, não parcial.
            </>
          ),
        }
      : {
          Icon: Clock,
          texto: (
            <>
              Comparativo parcial realizado até o último horário informado (
              <strong>{ultimaHora}</strong>).
            </>
          ),
        },
    diaCompleto
      ? {
          Icon: BarChart2,
          texto: (
            <>
              Total geral de <strong>{labelB}</strong>:{' '}
              <strong>{INT(totalB)}</strong> veículos no período.
            </>
          ),
        }
      : {
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
