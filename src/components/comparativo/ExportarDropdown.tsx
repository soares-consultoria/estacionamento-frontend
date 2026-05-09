import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Loader2 } from 'lucide-react';
import { dashboardApi } from '../../api/client';
import type { Granularidade } from '../../api/client';

interface Props {
  inicioA: string; fimA: string;
  inicioB: string; fimB: string;
  granularidade: Granularidade;
}

export default function ExportarDropdown({ inicioA, fimA, inicioB, fimB, granularidade }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function exportar(formato: 'XLSX' | 'PDF' | 'CSV') {
    setOpen(false);
    setLoading(formato);
    try {
      const blob = await dashboardApi.exportarComparativo({ inicioA, fimA, inicioB, fimB, granularidade, formato });
      const ext = formato === 'CSV' ? 'zip' : formato.toLowerCase();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparativo-${inicioA}_${fimA}_vs_${inicioB}_${fimB}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao exportar', e);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={loading != null}
        className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Exportar
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[120px]">
          {(['XLSX', 'PDF', 'CSV'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => exportar(fmt)}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
            >
              {fmt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
