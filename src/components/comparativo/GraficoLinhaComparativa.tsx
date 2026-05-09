import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { SerieTemporal } from '../../api/client';

const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

interface Props {
  serieA: SerieTemporal[];
  serieB: SerieTemporal[];
  labelA: string;
  labelB: string;
}

export default function GraficoLinhaComparativa({ serieA, serieB, labelA, labelB }: Props) {
  // Merge por índice para comparação
  const max = Math.max(serieA.length, serieB.length);
  const data = Array.from({ length: max }, (_, i) => ({
    chave: serieA[i]?.chave ?? serieB[i]?.chave ?? String(i),
    valorA: serieA[i]?.valor ?? null,
    valorB: serieB[i]?.valor ?? null,
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Evolução Comparativa</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="chave" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis tickFormatter={INT} tick={{ fontSize: 11 }} width={60} />
          <Tooltip formatter={(v) => (typeof v === 'number' ? INT(v) : String(v ?? ''))} />
          <Legend />
          <Line type="monotone" dataKey="valorA" name={labelA} stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="valorB" name={labelB} stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
