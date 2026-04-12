import { useEffect, useState } from 'react';
import { dashboardApi, type MetaMensal } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, Target, XCircle } from 'lucide-react';

const BRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const INT = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0);

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function MonthSelector({ ano, mes, onChange }: { ano: number; mes: number; onChange: (ano: number, mes: number) => void }) {
  return (
    <div className="flex gap-2 items-center">
      <select
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={mes}
        onChange={(e) => onChange(ano, Number(e.target.value))}
      >
        {MESES.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={ano}
        onChange={(e) => onChange(Number(e.target.value), mes)}
      >
        {[2024, 2025, 2026].map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number | null; color: string }) {
  const value = Math.min(pct ?? 0, 150);
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5">
      <div
        className={`h-2 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export default function Metas() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [meta, setMeta] = useState<MetaMensal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  const [metaFluxo, setMetaFluxo] = useState('');
  const [metaReceita, setMetaReceita] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSaveOk(false);
    dashboardApi.getMeta(ano, mes)
      .then(d => {
        setMeta(d);
        setMetaFluxo(d.meta_fluxo != null ? String(d.meta_fluxo) : '');
        setMetaReceita(d.meta_receita != null ? String(d.meta_receita) : '');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ano, mes]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveOk(false);
    setError(null);
    try {
      const saved = await dashboardApi.salvarMeta({
        ano,
        mes,
        meta_fluxo: metaFluxo ? Number(metaFluxo) : null,
        meta_receita: metaReceita ? Number(metaReceita) : null,
      });
      setMeta(saved);
      setSaveOk(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const pctFluxoOk = meta?.pct_fluxo != null && meta.pct_fluxo >= 100;
  const pctReceitaOk = meta?.pct_receita != null && meta.pct_receita >= 100;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Metas Mensais</h1>
            <p className="text-slate-500 text-sm mt-1">Defina e acompanhe as metas de fluxo e receita</p>
          </div>
          <MonthSelector ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m); }} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}
        {saveOk && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> Meta salva com sucesso!
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Carregando metas..." />
        ) : (
          <>
            {/* Progress cards */}
            {meta && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Fluxo */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-blue-500" />
                      <span className="text-sm font-semibold text-slate-700">Fluxo de Veículos</span>
                    </div>
                    {meta.meta_fluxo != null ? (
                      pctFluxoOk
                        ? <CheckCircle size={18} className="text-emerald-500" />
                        : <XCircle size={18} className="text-red-400" />
                    ) : null}
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{INT(meta.fluxo_realizado)}</p>
                  <p className="text-xs text-slate-400">realizado</p>
                  {meta.meta_fluxo != null ? (
                    <>
                      <p className="text-xs text-slate-500 mt-2">Meta: {INT(meta.meta_fluxo)}</p>
                      <ProgressBar pct={meta.pct_fluxo} color={pctFluxoOk ? 'bg-emerald-500' : 'bg-blue-500'} />
                      <p className={`text-xs font-semibold mt-1.5 ${pctFluxoOk ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {meta.pct_fluxo?.toFixed(1) ?? '0.0'}% da meta
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2">Meta não definida</p>
                  )}
                </div>

                {/* Receita */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-emerald-500" />
                      <span className="text-sm font-semibold text-slate-700">Receita</span>
                    </div>
                    {meta.meta_receita != null ? (
                      pctReceitaOk
                        ? <CheckCircle size={18} className="text-emerald-500" />
                        : <XCircle size={18} className="text-red-400" />
                    ) : null}
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{BRL(meta.receita_realizada)}</p>
                  <p className="text-xs text-slate-400">realizado</p>
                  {meta.meta_receita != null ? (
                    <>
                      <p className="text-xs text-slate-500 mt-2">Meta: {BRL(meta.meta_receita)}</p>
                      <ProgressBar pct={meta.pct_receita} color={pctReceitaOk ? 'bg-emerald-500' : 'bg-emerald-400'} />
                      <p className={`text-xs font-semibold mt-1.5 ${pctReceitaOk ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {meta.pct_receita?.toFixed(1) ?? '0.0'}% da meta
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2">Meta não definida</p>
                  )}
                </div>
              </div>
            )}

            {/* Edit form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Definir Metas para {MESES[mes - 1]}/{ano}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">
                      Meta de Fluxo (veículos)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={metaFluxo}
                      onChange={e => setMetaFluxo(e.target.value)}
                      placeholder="Ex: 5000"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">
                      Meta de Receita (R$)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={metaReceita}
                      onChange={e => setMetaReceita(e.target.value)}
                      placeholder="Ex: 25000.00"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Salvando...' : 'Salvar Metas'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
