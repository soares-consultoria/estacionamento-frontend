import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

const G_LIGHT = '#3b82f6';
const G_B = '#f59e0b'; // âmbar — período B

const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

interface CumulPoint {
  hora: string;
  cumA: number | null;
  cumB: number | null;
}

interface Props {
  data: CumulPoint[];
  labelA: string;
  labelB: string;
}

export default function GraficoLinhaComparativa({ data, labelA, labelB }: Props) {
  // Com muitas horas (operação de dia inteiro), rótulos em todos os pontos ficam
  // ilegíveis. Mostra rótulos inline só quando há poucos pontos; caso contrário,
  // os valores ficam no tooltip (hover) e na tabela comparativa.
  const mostrarRotulos = data.length <= 8;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={data}
        margin={{ top: 30, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="hora"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tickFormatter={INT}
          tick={{ fontSize: 10 }}
          width={55}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v, name) => [
            typeof v === 'number' ? INT(v) : String(v ?? ''),
            name,
          ]}
        />
        <Line
          type="monotone"
          dataKey="cumA"
          name={labelA}
          stroke={G_LIGHT}
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={{ r: 3, fill: G_LIGHT }}
          connectNulls={false}
        >
          {mostrarRotulos && (
            <LabelList
              dataKey="cumA"
              position="top"
              style={{ fontSize: 9, fill: G_LIGHT, fontWeight: 600 }}
              formatter={(v: unknown) => (typeof v === 'number' ? INT(v) : '')}
            />
          )}
        </Line>
        <Line
          type="monotone"
          dataKey="cumB"
          name={labelB}
          stroke={G_B}
          strokeWidth={2}
          dot={{ r: 3, fill: G_B }}
          connectNulls={false}
        >
          {mostrarRotulos && (
            <LabelList
              dataKey="cumB"
              position="bottom"
              style={{ fontSize: 9, fill: G_B, fontWeight: 600 }}
              formatter={(v: unknown) => (typeof v === 'number' ? INT(v) : '')}
            />
          )}
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}
