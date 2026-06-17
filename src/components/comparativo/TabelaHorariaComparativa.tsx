const G_DARK = '#1e293b';
const G_MED = '#10b981';
const G_RED = '#ef4444';

const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v);
const fmtPct = (v: number | null) =>
  v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%';

export interface CumulRow {
  hora: string;
  cumA: number;
  cumB: number;
  difAbs: number;
  difPct: number | null;
  hasA: boolean;
  hasB: boolean;
}

interface Props {
  linhas: CumulRow[];
  labelA: string;
  labelB: string;
}

export default function TabelaHorariaComparativa({
  linhas,
  labelA,
  labelB,
}: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      {/* Header da tabela */}
      <div
        className="text-white text-xs font-bold uppercase px-3 py-2 tracking-wider"
        style={{ background: G_DARK }}
      >
        TABELA COMPARATIVA
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Tabela comparativa cumulativa">
          <thead>
            <tr style={{ background: G_DARK }}>
              <th className="text-left px-3 py-2 text-xs font-semibold text-white uppercase tracking-wider">
                HORÁRIO
              </th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-white uppercase tracking-wider">
                {labelA}
              </th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-white uppercase tracking-wider">
                {labelB}
              </th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-white uppercase tracking-wider">
                DIFERENÇA
              </th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-white uppercase tracking-wider">
                DIF. (%)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {linhas.map((row, i) => {
              const positivo = row.difAbs >= 0;
              const corDif = positivo ? G_MED : G_RED;
              return (
                <tr key={row.hora} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 font-medium text-slate-700 text-xs">
                    {row.hora}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-slate-700">
                    {row.hasA ? INT(row.cumA) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-slate-700">
                    {row.hasB ? INT(row.cumB) : '—'}
                  </td>
                  <td
                    className="px-3 py-2 text-right text-xs font-semibold"
                    style={{ color: row.hasA && row.hasB ? corDif : '#94a3b8' }}
                  >
                    {row.hasA && row.hasB
                      ? (positivo ? '+' : '') + INT(row.difAbs)
                      : '—'}
                  </td>
                  <td
                    className="px-3 py-2 text-right text-xs font-semibold"
                    style={{ color: row.hasA && row.hasB ? corDif : '#94a3b8' }}
                  >
                    {row.hasA && row.hasB ? fmtPct(row.difPct) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: G_MED }} />
          Crescimento
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: G_RED }} />
          Queda
        </span>
        <span className="flex items-center gap-1">
          <span className="font-bold text-slate-400">---</span>
          Dados não informados
        </span>
      </div>
    </div>
  );
}
