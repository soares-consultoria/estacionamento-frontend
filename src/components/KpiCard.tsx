import { TrendingDown, TrendingUp } from 'lucide-react';
import { type ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  variacao?: number | null;
  subtitle?: string;
  icon?: ReactNode;
  colorClass?: string;
}

export default function KpiCard({ title, value, variacao, subtitle, icon, colorClass = 'text-blue-600' }: KpiCardProps) {
  const isPositive = variacao !== null && variacao !== undefined && variacao >= 0;
  const hasVariacao = variacao !== null && variacao !== undefined;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-slate-50 ${colorClass}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        {hasVariacao && (
          <div className={`flex items-center gap-0.5 text-sm font-medium mb-0.5 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{isPositive ? '▲' : '▼'} {Math.abs(variacao!).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {subtitle && (
        <span className="text-xs text-slate-400">{subtitle}</span>
      )}
    </div>
  );
}
