import { FeatureGate } from '../components/FeatureGate';
import { useEffect, useRef, useState } from 'react';
import {
  dashboardApi,
  type ComparativoPeriodos,
  type Granularidade,
  type KpiMensal,
  type HoraComparativo,
} from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertTriangle, ArrowDown, ArrowUp, Minus, Settings2 } from 'lucide-react';
import IntervaloSelector from '../components/comparativo/IntervaloSelector';
import ResumoCards from '../components/comparativo/ResumoCards';
import TabelaHorariaComparativa from '../components/comparativo/TabelaHorariaComparativa';
import GraficoLinhaComparativa from '../components/comparativo/GraficoLinhaComparativa';
import GraficoBarrasHora from '../components/comparativo/GraficoBarrasHora';
import GraficoPizza from '../components/comparativo/GraficoPizza';
import ResumoExecutivo from '../components/comparativo/ResumoExecutivo';
import ExportarDropdown from '../components/comparativo/ExportarDropdown';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ── Comparativo Legado (fallback para plano ESSENCIAL) ────────────────────────

const BRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const INT = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0);

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function prevMonth(ano: number, mes: number) {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

function labelPeriodo(ano: number, mes: number) {
  return `${MESES[mes - 1]}/${ano}`;
}

function DeltaLegado({ current, compare }: { current: number; compare: number | null | undefined }) {
  if (!compare || compare === 0) return <span className="text-slate-400 text-xs">—</span>;
  const pct = ((current - compare) / compare) * 100;
  const up = pct >= 0;
  const color = up ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
  const Icon = pct === 0 ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold ${color}`}>
      <Icon size={10} />{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function ComparativoLegado() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const prev = prevMonth(ano, mes);
  const anoAnterior = { ano: ano - 1, mes };

  const [cols, setCols] = useState([
    { label: labelPeriodo(ano, mes), kpi: null as KpiMensal | null, loading: true },
    { label: labelPeriodo(prev.ano, prev.mes), kpi: null as KpiMensal | null, loading: true },
    { label: labelPeriodo(anoAnterior.ano, anoAnterior.mes), kpi: null as KpiMensal | null, loading: true },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = prevMonth(ano, mes);
    const aa = { ano: ano - 1, mes };
    const loadingState = [
      { label: labelPeriodo(ano, mes), kpi: null as KpiMensal | null, loading: true },
      { label: labelPeriodo(p.ano, p.mes), kpi: null as KpiMensal | null, loading: true },
      { label: labelPeriodo(aa.ano, aa.mes), kpi: null as KpiMensal | null, loading: true },
    ];
    let cancelled = false;
    // Aplica loading state + reset error em microtask para evitar setState síncrono no efeito
    Promise.resolve(loadingState)
      .then(loading => { if (!cancelled) { setCols(loading); setError(null); } return Promise.all([
        dashboardApi.getKpiMensal(ano, mes),
        dashboardApi.getKpiMensal(p.ano, p.mes),
        dashboardApi.getKpiMensal(aa.ano, aa.mes),
      ]); })
      .then(([atual, anterior, anoAnt]) => {
        if (!cancelled) setCols([
          { label: labelPeriodo(ano, mes), kpi: atual, loading: false },
          { label: labelPeriodo(p.ano, p.mes), kpi: anterior, loading: false },
          { label: labelPeriodo(aa.ano, aa.mes), kpi: anoAnt, loading: false },
        ]);
      })
      .catch(e => {
        if (!cancelled) {
          setError(e.message);
          setCols(c => c.map(col => ({ ...col, loading: false })));
        }
      });
    return () => { cancelled = true; };
  }, [ano, mes]);

  const atual = cols[0].kpi;
  const anterior = cols[1].kpi;
  const anoAnt = cols[2].kpi;

  const rows: { label: string; fmt: (k: KpiMensal) => string; getValue: (k: KpiMensal) => number }[] = [
    { label: 'Fluxo Total', fmt: k => INT(k.fluxo_total), getValue: k => k.fluxo_total },
    { label: 'Arrecadação', fmt: k => BRL(k.receita_total), getValue: k => k.receita_total },
    { label: 'Pagantes', fmt: k => INT(k.pagantes_total), getValue: k => k.pagantes_total },
    { label: 'Ticket Médio', fmt: k => BRL(k.ticket_medio), getValue: k => k.ticket_medio },
    { label: 'Dias c/ Dados', fmt: k => String(k.dias_com_dados ?? 0), getValue: k => k.dias_com_dados ?? 0 },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Comparativo de Períodos</h1>
            <p className="text-slate-500 text-sm mt-1">Compare o mês selecionado com o mês anterior e o mesmo mês do ano passado</p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
            >
              {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={ano}
              onChange={e => setAno(Number(e.target.value))}
            >
              {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Erro: {error}
          </div>
        )}

        {cols.some(c => c.loading) ? (
          <LoadingSpinner label="Carregando..." />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {cols.map((col, i) => (
                <div key={i} className={`rounded-xl border p-3 text-center ${i === 0 ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${i === 0 ? 'text-blue-100' : 'text-slate-400'}`}>
                    {i === 0 ? 'Selecionado' : i === 1 ? 'Mês Anterior' : 'Ano Anterior'}
                  </p>
                  <p className={`text-sm font-bold mt-1 ${i === 0 ? 'text-white' : 'text-slate-700'}`}>{col.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Métrica</th>
                    {cols.map((col, i) => (
                      <th key={i} className="text-right px-4 py-3 text-xs font-semibold uppercase" style={{ color: i === 0 ? '#2563eb' : '#64748b' }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map(row => (
                    <tr key={row.label} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-700">{row.label}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">{atual ? row.fmt(atual) : '—'}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm text-slate-600">{anterior ? row.fmt(anterior) : '—'}</span>
                          {atual && anterior && <DeltaLegado current={row.getValue(atual)} compare={row.getValue(anterior)} />}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm text-slate-600">{anoAnt ? row.fmt(anoAnt) : '—'}</span>
                          {atual && anoAnt && <DeltaLegado current={row.getValue(atual)} compare={row.getValue(anoAnt)} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstDayOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function lastDayOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

const STORAGE_KEY = 'comparativo-filtros-v2';

interface Filtros {
  inicioA: string;
  fimA: string;
  inicioB: string;
  fimB: string;
  granularidade: Granularidade;
}

function loadFiltros(): Filtros {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Filtros;
  } catch {
    // ignora erro de parse
  }
  const now = new Date();
  return {
    inicioA: firstDayOfMonth(new Date(now.getFullYear() - 1, now.getMonth(), 1)),
    fimA: lastDayOfMonth(new Date(now.getFullYear() - 1, now.getMonth(), 1)),
    inicioB: firstDayOfMonth(),
    fimB: lastDayOfMonth(),
    granularidade: 'HORA',
  };
}

// ── Interface CumulRow (exportada para ser usada pelos componentes) ────────────

export interface CumulRow {
  hora: string;
  cumA: number;
  cumB: number;
  difAbs: number;
  difPct: number | null;
  hasA: boolean;
  hasB: boolean;
}

function buildCumulative(porHora: HoraComparativo[]): CumulRow[] {
  const sorted = [...porHora].sort((a, b) =>
    a.faixa_horaria.localeCompare(b.faixa_horaria)
  );
  let cumA = 0;
  let cumB = 0;
  return sorted
    .filter((h) => h.valor_a > 0 || h.valor_b > 0)
    .map((h) => {
      cumA += h.valor_a;
      cumB += h.valor_b;
      const dif = cumB - cumA;
      return {
        hora: h.faixa_horaria,
        cumA,
        cumB,
        difAbs: dif,
        difPct: cumA > 0 ? (dif / cumA) * 100 : null,
        hasA: h.valor_a > 0,
        hasB: h.valor_b > 0,
      };
    });
}

function fmtData(iso: string): string {
  // "2025-05-10" -> "10/05/2025"
  if (!iso || iso.length < 10) return iso ?? '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function shortLabel(periodo: { inicio: string }): string {
  if (!periodo?.inicio) return '';
  const parts = periodo.inicio.split('-');
  return parts[0] ?? periodo.inicio;
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-white text-xs font-bold uppercase px-3 py-2 tracking-wider mb-0"
      style={{ background: '#1e293b' }}
    >
      {children}
    </div>
  );
}

// ── Página Principal (Avançado) ───────────────────────────────────────────────

const G_DARK = '#1e293b';

function ComparativoAvancado() {
  const [filtros, setFiltros] = useState<Filtros>(loadFiltros);
  const [dados, setDados] = useState<ComparativoPeriodos | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function updateFiltro<K extends keyof Filtros>(k: K, v: Filtros[K]) {
    setFiltros((f) => {
      const n = { ...f, [k]: v };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(n));
      return n;
    });
  }

  function validar(f: Filtros): string | null {
    const diasA =
      Math.round(
        (new Date(f.fimA).getTime() - new Date(f.inicioA).getTime()) / 86400000
      ) + 1;
    const diasB =
      Math.round(
        (new Date(f.fimB).getTime() - new Date(f.inicioB).getTime()) / 86400000
      ) + 1;
    if (f.granularidade === 'HORA' && (diasA > 31 || diasB > 31))
      return 'Intervalo máximo para HORA é 31 dias';
    if (diasA > 730 || diasB > 730) return 'Intervalo máximo é 730 dias';
    return null;
  }

  async function comparar() {
    const v = validar(filtros);
    if (v) {
      setAviso(v);
      return;
    }
    setAviso(null);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setErro(null);
    try {
      const result = await dashboardApi.comparativo(filtros, abortRef.current.signal);
      setDados(result);
    } catch (e: unknown) {
      if (
        (e as Error).name !== 'CanceledError' &&
        (e as Error).name !== 'AbortError'
      ) {
        const msg =
          (e as { response?: { data?: { mensagem?: string } } })?.response?.data
            ?.mensagem ?? 'Erro ao carregar comparativo';
        setErro(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Cálculos derivados ───────────────────────────────────────────────────────

  const cumulRows = dados ? buildCumulative(dados.por_hora ?? []) : [];

  const ultimaHoraComum =
    cumulRows.filter((r) => r.hasA && r.hasB).slice(-1)[0] ??
    cumulRows.filter((r) => r.hasB).slice(-1)[0] ??
    null;

  const parcialA =
    ultimaHoraComum?.cumA ?? dados?.resumo_a?.fluxo_total ?? 0;
  const parcialB =
    ultimaHoraComum?.cumB ?? dados?.resumo_b?.fluxo_total ?? 0;
  const crescPct = parcialA > 0 ? ((parcialB - parcialA) / parcialA) * 100 : 0;

  const shortLabelA = dados ? shortLabel(dados.periodo_a) : '';
  const shortLabelB = dados ? shortLabel(dados.periodo_b) : '';

  const lineData = cumulRows.map((r) => ({
    hora: r.hora,
    cumA: r.hasA ? r.cumA : null,
    cumB: r.hasB ? r.cumB : null,
  }));

  const barData = cumulRows.map((r) => ({
    hora: r.hora,
    difPct: r.hasA && r.hasB ? r.difPct : null,
  }));

  const isHora =
    dados?.granularidade === 'HORA' && (dados?.por_hora?.length ?? 0) > 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* ── HEADER ── */}
      {dados && !loading ? (
        <div
          className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{ background: G_DARK }}
        >
          <div>
            <h1 className="text-white text-base font-bold uppercase tracking-wider">
              COMPARATIVO DE FLUXO DE AVULSO
            </h1>
            <p className="text-green-200 text-xs mt-1">
              {fmtData(dados.periodo_a?.inicio)} a {fmtData(dados.periodo_a?.fim)}
              {' '}vs{' '}
              {fmtData(dados.periodo_b?.inicio)} a {fmtData(dados.periodo_b?.fim)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDados(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white border border-green-400 rounded px-3 py-1.5 hover:bg-green-800 transition-colors"
            >
              <Settings2 size={13} />
              Reconfigurar
            </button>
            <ExportarDropdown
              inicioA={filtros.inicioA}
              fimA={filtros.fimA}
              inicioB={filtros.inicioB}
              fimB={filtros.fimB}
              granularidade={filtros.granularidade}
            />
          </div>
        </div>
      ) : (
        <div
          className="px-5 py-4"
          style={{ background: G_DARK }}
        >
          <h1 className="text-white text-base font-bold uppercase tracking-wider">
            COMPARATIVO DE FLUXO DE AVULSO
          </h1>
          <p className="text-green-200 text-xs mt-1">Configure os períodos abaixo para comparar</p>
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-5">
        {/* ── PAINEL DE FILTROS (visível apenas quando dados == null) ── */}
        {!dados && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <IntervaloSelector
                label="Período A"
                inicio={filtros.inicioA}
                fim={filtros.fimA}
                onChangeInicio={(v) => updateFiltro('inicioA', v)}
                onChangeFim={(v) => updateFiltro('fimA', v)}
              />
              <IntervaloSelector
                label="Período B"
                inicio={filtros.inicioB}
                fim={filtros.fimB}
                onChangeInicio={(v) => updateFiltro('inicioB', v)}
                onChangeFim={(v) => updateFiltro('fimB', v)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Granularidade
                </label>
                <select
                  value={filtros.granularidade}
                  onChange={(e) =>
                    updateFiltro('granularidade', e.target.value as Granularidade)
                  }
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="HORA">Hora</option>
                  <option value="DIA">Dia</option>
                  <option value="SEMANA">Semana</option>
                  <option value="MES">Mês</option>
                </select>
              </div>
              <button
                type="button"
                onClick={comparar}
                disabled={loading}
                className="flex items-center gap-2 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                style={{ background: G_DARK }}
              >
                {loading ? 'Carregando...' : 'Comparar'}
              </button>
            </div>

            {aviso && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg px-3 py-2 text-sm">
                <AlertTriangle size={14} />
                {aviso}
              </div>
            )}
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        {loading && <LoadingSpinner label="Comparando períodos..." />}

        {/* ── CONTEÚDO PRINCIPAL ── */}
        {dados && !loading && (
          <ErrorBoundary>
            <div className="space-y-5">
              {/* 5 KPI Cards */}
              <ResumoCards
                fluxoA={parcialA}
                fluxoB={parcialB}
                labelA={shortLabelA}
                labelB={shortLabelB}
                ultimaHora={ultimaHoraComum?.hora ?? '—'}
              />

              {isHora ? (
                <>
                  {/* Layout 2 colunas: Tabela | Gráfico de linha */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* Tabela — 40% (~2/5) */}
                    <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      <TabelaHorariaComparativa
                        linhas={cumulRows}
                        totalGeralA={dados.resumo_a?.fluxo_total ?? 0}
                        labelA={shortLabelA}
                        labelB={shortLabelB}
                      />
                    </div>

                    {/* Gráfico de linha — 60% (~3/5) */}
                    <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      <SectionHeader>
                        FLUXO POR HORA (COMPARATIVO CUMULATIVO)
                      </SectionHeader>
                      <div className="p-3">
                        <div className="flex items-center gap-4 mb-2 px-1">
                          <span className="flex items-center gap-1.5 text-xs">
                            <span
                              className="inline-block w-6 border-t-2"
                              style={{ borderColor: '#3b82f6', borderStyle: 'dashed' }}
                            />
                            {shortLabelA}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs">
                            <span
                              className="inline-block w-6 border-t-2"
                              style={{ borderColor: '#111827' }}
                            />
                            {shortLabelB}
                          </span>
                        </div>
                        <GraficoLinhaComparativa
                          data={lineData}
                          labelA={shortLabelA}
                          labelB={shortLabelB}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Layout 3 colunas: Barras | Rosca | Resumo */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Gráfico barras — dif % por hora */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      <SectionHeader>DIF. % POR HORA</SectionHeader>
                      <div className="p-3">
                        <GraficoBarrasHora data={barData} />
                      </div>
                    </div>

                    {/* Gráfico rosca — distribuição */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      <SectionHeader>DISTRIBUIÇÃO DO FLUXO</SectionHeader>
                      <div className="p-3">
                        <GraficoPizza
                          valorA={parcialA}
                          valorB={parcialB}
                          labelA={shortLabelA}
                          labelB={shortLabelB}
                        />
                      </div>
                    </div>

                    {/* Resumo executivo */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      <SectionHeader>RESUMO EXECUTIVO</SectionHeader>
                      <div className="p-3">
                        <ResumoExecutivo
                          fluxoA={parcialA}
                          fluxoB={parcialB}
                          crescPct={crescPct}
                          ultimaHora={ultimaHoraComum?.hora ?? '—'}
                          labelA={shortLabelA}
                          labelB={shortLabelB}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Layout simplificado para granularidades != HORA */
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <SectionHeader>
                    EVOLUÇÃO COMPARATIVA — {dados.periodo_a?.label} vs {dados.periodo_b?.label}
                  </SectionHeader>
                  <div className="p-3">
                    <GraficoLinhaComparativa
                      data={(dados.serie_a ?? []).map((s, i) => ({
                        hora: s.chave,
                        cumA: s.valor,
                        cumB: dados.serie_b?.[i]?.valor ?? null,
                      }))}
                      labelA={dados.periodo_a?.label ?? shortLabelA}
                      labelB={dados.periodo_b?.label ?? shortLabelB}
                    />
                  </div>
                </div>
              )}

              {/* ── FOOTER ── */}
              <div
                className="rounded-lg px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-green-100"
                style={{ background: G_DARK }}
              >
                <span>
                  <span className="font-semibold text-white">Período Comparado:</span>{' '}
                  {fmtData(dados.periodo_a?.inicio)} – {fmtData(dados.periodo_a?.fim)}
                  {' '}vs{' '}
                  {fmtData(dados.periodo_b?.inicio)} – {fmtData(dados.periodo_b?.fim)}
                </span>
                <span>
                  <span className="font-semibold text-white">Atualizado em:</span>{' '}
                  {new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

// ── Export default ────────────────────────────────────────────────────────────

export default function Comparativo() {
  return (
    <FeatureGate funcionalidade="comparativo-avancado" fallback={<ComparativoLegado />}>
      <ComparativoAvancado />
    </FeatureGate>
  );
}
