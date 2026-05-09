import { useState, useMemo } from 'react';
import type { HeatmapItem } from '../../api/client';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

type Modo = 'A' | 'B' | 'Diff';

function corA(v: number, max: number) {
  const ratio = max > 0 ? v / max : 0;
  const alpha = 0.1 + ratio * 0.85;
  return `rgba(59, 130, 246, ${alpha.toFixed(2)})`;
}

function corB(v: number, max: number) {
  const ratio = max > 0 ? v / max : 0;
  const alpha = 0.1 + ratio * 0.85;
  return `rgba(245, 158, 11, ${alpha.toFixed(2)})`;
}

function corDiff(diff: number, maxAbs: number) {
  if (diff === 0 || maxAbs === 0) return '#f8fafc';
  const ratio = Math.abs(diff) / maxAbs;
  const alpha = 0.2 + ratio * 0.7;
  return diff > 0
    ? `rgba(16, 185, 129, ${alpha.toFixed(2)})`
    : `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
}

interface Props {
  dados: HeatmapItem[];
  labelA: string;
  labelB: string;
}

export default function Heatmap({ dados, labelA, labelB }: Props) {
  const [modo, setModo] = useState<Modo>('B');

  const faixas = useMemo(() => {
    const s = new Set(dados.map(d => d.faixaHoraria));
    return Array.from(s).sort();
  }, [dados]);

  const matriz = useMemo(() => {
    const m: Record<string, HeatmapItem> = {};
    dados.forEach(d => { m[`${d.diaSemana}:${d.faixaHoraria}`] = d; });
    return m;
  }, [dados]);

  const maxA = useMemo(() => Math.max(...dados.map(d => d.valorA), 1), [dados]);
  const maxB = useMemo(() => Math.max(...dados.map(d => d.valorB), 1), [dados]);
  const maxDiff = useMemo(() => Math.max(...dados.map(d => Math.abs(d.valorB - d.valorA)), 1), [dados]);

  const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Heatmap — Dia × Hora</h3>
        <div className="flex gap-1">
          {(['A', 'B', 'Diff'] as Modo[]).map(m => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${modo === m ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {m === 'A' ? labelA.slice(0, 8) : m === 'B' ? labelB.slice(0, 8) : 'Diff'}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs" style={{ borderCollapse: 'separate', borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="w-8" />
              {DIAS.map((d, i) => (
                <th key={i} className="text-center text-slate-500 font-medium pb-1 px-1" style={{ minWidth: 36 }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {faixas.map(faixa => (
              <tr key={faixa}>
                <td className="text-right pr-1 text-slate-400 font-mono" style={{ fontSize: 10 }}>{faixa}</td>
                {[1, 2, 3, 4, 5, 6, 7].map(dia => {
                  const cell = matriz[`${dia}:${faixa}`];
                  const va = cell?.valorA ?? 0;
                  const vb = cell?.valorB ?? 0;
                  const diff = vb - va;
                  const bg = modo === 'A' ? corA(va, maxA) : modo === 'B' ? corB(vb, maxB) : corDiff(diff, maxDiff);
                  const valor = modo === 'A' ? va : modo === 'B' ? vb : diff;
                  const label = modo === 'Diff'
                    ? `${DIAS[dia - 1]} às ${faixa}: Δ${diff > 0 ? '+' : ''}${INT(diff)}`
                    : `${DIAS[dia - 1]} às ${faixa}: ${INT(valor)} entradas (Período ${modo})`;
                  return (
                    <td
                      key={dia}
                      data-cell={`${dia}-${faixa}`}
                      aria-label={label}
                      title={label}
                      style={{ background: bg, width: 36, height: 20, borderRadius: 3 }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
