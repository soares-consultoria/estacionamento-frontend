import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const G_B = '#f59e0b'; // âmbar — período B
const G_LIGHT = '#3b82f6';
const INT = (v: number) => new Intl.NumberFormat('pt-BR').format(v);
const fmtPct = (v: number) => v.toFixed(2).replace('.', ',') + '%';

interface Props {
  valorA: number;
  valorB: number;
  labelA: string;
  labelB: string;
}

export default function GraficoPizza({ valorA, valorB, labelA, labelB }: Props) {
  const total = valorA + valorB || 1;
  const pctA = (valorA / total) * 100;
  const pctB = (valorB / total) * 100;
  const data = [{ value: valorA }, { value: valorB }];
  return (
    <div>
      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            <Cell fill={G_LIGHT} />
            <Cell fill={G_B} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1 mt-1 text-xs">
        {[
          { label: labelA, val: valorA, pct: pctA, cor: G_LIGHT },
          { label: labelB, val: valorB, pct: pctB, cor: G_B },
        ].map((d, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: d.cor }}
              />
              <span className="font-semibold">{d.label}</span>
            </div>
            <span className="font-bold">
              {INT(d.val)} ({fmtPct(d.pct)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
