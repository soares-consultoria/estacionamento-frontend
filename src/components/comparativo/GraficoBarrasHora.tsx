import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';

const G_MED = '#10b981';
const G_RED = '#ef4444';

interface DifPctPoint {
  hora: string;
  difPct: number | null;
}

interface Props {
  data: DifPctPoint[];
}

export default function GraficoBarrasHora({ data }: Props) {
  const filtrado = data.filter((d) => d.difPct != null);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={filtrado}
        margin={{ top: 25, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="hora"
          tick={{ fontSize: 9 }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tickFormatter={(v) => v.toFixed(0) + '%'}
          tick={{ fontSize: 10 }}
          width={40}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) =>
            typeof v === 'number'
              ? (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%'
              : String(v ?? '')
          }
          labelFormatter={(l) => `Hora: ${l}`}
        />
        <Bar dataKey="difPct" radius={[3, 3, 0, 0]}>
          {filtrado.map((d, i) => (
            <Cell
              key={i}
              fill={(d.difPct ?? 0) >= 0 ? G_MED : G_RED}
            />
          ))}
          <LabelList
            dataKey="difPct"
            position="top"
            style={{ fontSize: 8, fontWeight: 600 }}
            formatter={(v: unknown) => {
              const n = typeof v === 'number' ? v : null;
              return n != null ? (n >= 0 ? '+' : '') + n.toFixed(2).replace('.', ',') + '%' : '';
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
