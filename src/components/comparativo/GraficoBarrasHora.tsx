import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { HoraComparativo } from '../../api/client';

const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

interface Props {
  dados: HoraComparativo[];
  labelA: string;
  labelB: string;
}

export default function GraficoBarrasHora({ dados, labelA, labelB }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Fluxo por Hora</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={dados} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="faixaHoraria" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tickFormatter={INT} tick={{ fontSize: 11 }} width={55} />
          <Tooltip formatter={(v) => (typeof v === 'number' ? INT(v) : String(v ?? ''))} />
          <Legend />
          <Bar dataKey="valorA" name={labelA} fill="#3b82f6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="valorB" name={labelB} fill="#f59e0b" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
