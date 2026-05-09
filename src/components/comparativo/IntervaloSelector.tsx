import { useMemo } from 'react';

interface Props {
  label: string;
  inicio: string;
  fim: string;
  onChangeInicio: (v: string) => void;
  onChangeFim: (v: string) => void;
}

function atalhos(hoje: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const inicioMesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const fimMesAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

  const inicioMesAnoAnt = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1);
  const fimMesAnoAnt = new Date(hoje.getFullYear() - 1, hoje.getMonth() + 1, 0);

  return [
    { label: 'Hoje', inicio: fmt(hoje), fim: fmt(hoje) },
    { label: 'Esta semana', inicio: fmt(inicioSemana), fim: fmt(fimSemana) },
    { label: 'Este mês', inicio: fmt(inicioMes), fim: fmt(fimMes) },
    { label: 'Mês anterior', inicio: fmt(inicioMesAnt), fim: fmt(fimMesAnt) },
    { label: 'Mesmo mês ano passado', inicio: fmt(inicioMesAnoAnt), fim: fmt(fimMesAnoAnt) },
  ];
}

export default function IntervaloSelector({ label, inicio, fim, onChangeInicio, onChangeFim }: Props) {
  const hoje = useMemo(() => new Date(), []);
  const shortcuts = useMemo(() => atalhos(hoje), [hoje]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-slate-400">Início</label>
          <input
            type="date"
            value={inicio}
            onChange={e => onChangeInicio(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-slate-400">Fim</label>
          <input
            type="date"
            value={fim}
            onChange={e => onChangeFim(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {shortcuts.map(s => (
          <button
            key={s.label}
            type="button"
            onClick={() => { onChangeInicio(s.inicio); onChangeFim(s.fim); }}
            className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
