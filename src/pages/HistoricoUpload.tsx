import { useContext, useEffect, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronRight,
  FileText, Loader2, SearchX,
} from 'lucide-react';
import { importacaoApi, type DiaUpload, type HistoricoUpload } from '../api/client';
import { InstituicaoContext } from '../contexts/InstituicaoContext';
import { useAuth } from '../hooks/useAuth';

const TIPO_LABEL: Record<string, string> = {
  FINANCEIRO_ESTATISTICO: 'Financeiro Estatístico',
  EST_MOVIMENTACAO: 'Estatístico por Movimentação',
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  TEXTO_EXTRAIDO: 'Texto extraído',
  IA_PROCESSADA: 'IA processada',
  PROCESSANDO: 'Processando',
  PROCESSADO: 'Processado',
  PROCESSADO_COM_AVISOS: 'Processado c/ avisos',
  ERRO_VALIDACAO: 'Erro de validação',
  ERRO_PROCESSAMENTO: 'Erro de processamento',
};

function mesAtual() {
  const now = new Date();
  return { ano: now.getFullYear(), mes: now.getMonth() + 1 };
}

export default function HistoricoUploadPage() {
  const { user } = useAuth();
  const { selectedId } = useContext(InstituicaoContext);
  const needsInstituicao = user?.role === 'SISTEMA_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [ano, setAno] = useState(mesAtual().ano);
  const [mes, setMes] = useState(mesAtual().mes);
  const [historico, setHistorico] = useState<HistoricoUpload | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const canSearch = !needsInstituicao || !!selectedId;

  async function buscar() {
    if (!canSearch) return;
    setLoading(true);
    setErro(null);
    try {
      const data = await importacaoApi.historico(
        ano, mes,
        needsInstituicao ? selectedId : undefined,
      );
      setHistorico(data);
      // Expande automaticamente dias pendentes
      const pendentes = new Set(
        data.dias.filter(d => d.status_dia === 'PENDENTE').map(d => d.data_referencia),
      );
      setExpandidos(pendentes);
    } catch {
      setErro('Erro ao buscar histórico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Busca automática ao montar (ou ao selectedId carregar para admins)
  useEffect(() => {
    if (canSearch) buscar();
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleDia(data: string) {
    setExpandidos(prev => {
      const next = new Set(prev);
      next.has(data) ? next.delete(data) : next.add(data);
      return next;
    });
  }

  const anos = Array.from({ length: 3 }, (_, i) => mesAtual().ano - i);
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  return (
    <div className="h-full overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">Histórico de Uploads</h1>
          <p className="text-slate-500 text-sm mt-1">
            Consulte os arquivos enviados por dia e identifique pendências de envio.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Ano</label>
            <select
              value={ano}
              onChange={e => setAno(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Mês</label>
            <select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {meses.map((nome, i) => (
                <option key={i + 1} value={i + 1}>{nome}</option>
              ))}
            </select>
          </div>
          <button
            onClick={buscar}
            disabled={loading || !canSearch}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Pesquisar
          </button>
        </div>

        {/* Erro */}
        {erro && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {/* Aguardando instituição */}
        {needsInstituicao && !selectedId && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Aguardando seleção de instituição...
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Buscando...
          </div>
        )}

        {/* Resultado */}
        {!loading && historico && (
          <div className="space-y-4">
            {/* Cards de resumo */}
            <div className="grid grid-cols-3 gap-3">
              <ResumoCard label="Dias com dados" value={historico.resumo.total_dias} color="slate" />
              <ResumoCard label="Completos" value={historico.resumo.dias_completos} color="green" />
              <ResumoCard label="Pendentes" value={historico.resumo.dias_pendentes} color="amber" />
            </div>

            {/* Lista de dias */}
            {historico.dias.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                <SearchX size={32} />
                <p className="text-sm">Nenhum arquivo enviado neste período.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {historico.dias.map(dia => (
                  <DiaCard
                    key={dia.data_referencia}
                    dia={dia}
                    expandido={expandidos.has(dia.data_referencia)}
                    onToggle={() => toggleDia(dia.data_referencia)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── Componentes internos ─── */

function ResumoCard({ label, value, color }: {
  label: string; value: number; color: 'slate' | 'green' | 'amber';
}) {
  const colors = {
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  const numColors = {
    slate: 'text-slate-800',
    green: 'text-green-800',
    amber: 'text-amber-800',
  };
  return (
    <div className={`border rounded-xl p-4 text-center ${colors[color]}`}>
      <p className={`text-2xl font-bold ${numColors[color]}`}>{value}</p>
      <p className="text-xs mt-1">{label}</p>
    </div>
  );
}

function DiaCard({ dia, expandido, onToggle }: {
  dia: DiaUpload; expandido: boolean; onToggle: () => void;
}) {
  const isCompleto = dia.status_dia === 'COMPLETO';

  const [datePart] = (dia.data_referencia ?? '').split('T');
  const [anoStr, mesStr, diaStr] = datePart.split('-');
  const dataFormatada = diaStr ? `${diaStr}/${mesStr}/${anoStr}` : dia.data_referencia;

  return (
    <div className={[
      'border rounded-xl overflow-hidden',
      isCompleto ? 'border-green-200' : 'border-amber-200',
    ].join(' ')}>
      {/* Cabeçalho do dia — clicável */}
      <button
        onClick={onToggle}
        className={[
          'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
          isCompleto ? 'bg-green-50 hover:bg-green-100' : 'bg-amber-50 hover:bg-amber-100',
        ].join(' ')}
      >
        <div className="flex items-center gap-3">
          {isCompleto
            ? <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
            : <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />}
          <span className="font-semibold text-slate-800 text-sm">{dataFormatada}</span>
          <span className={[
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            isCompleto ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
          ].join(' ')}>
            {isCompleto ? 'Completo' : 'Pendente'}
          </span>
          <span className="text-xs text-slate-500">
            {dia.arquivos.length} de 2 arquivo{dia.arquivos.length !== 1 ? 's' : ''}
          </span>
        </div>
        {expandido
          ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
          : <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}
      </button>

      {/* Detalhes dos arquivos */}
      {expandido && (
        <div className="divide-y divide-slate-100 bg-white">
          {dia.arquivos.map(arq => (
            <div key={arq.id} className="flex items-start gap-3 px-4 py-3">
              <FileText size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{arq.nome_arquivo}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {arq.tipo_relatorio ? TIPO_LABEL[arq.tipo_relatorio] ?? arq.tipo_relatorio : '—'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <StatusBadge status={arq.status_processamento} />
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(arq.criado_em).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Faltando RFE */}
          {!dia.arquivos.some(a => a.tipo_relatorio === 'FINANCEIRO_ESTATISTICO') && (
            <ArquivoFaltando tipo="Financeiro Estatístico (RFE)" />
          )}
          {/* Faltando REM */}
          {!dia.arquivos.some(a => a.tipo_relatorio === 'EST_MOVIMENTACAO') && (
            <ArquivoFaltando tipo="Estatístico por Movimentação (REM)" />
          )}
        </div>
      )}
    </div>
  );
}

function ArquivoFaltando({ tipo }: { tipo: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50/50">
      <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
      <p className="text-sm text-amber-700">
        <span className="font-medium">Faltando:</span> {tipo}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isOk = status === 'PROCESSADO' || status === 'PROCESSADO_COM_AVISOS';
  const isErr = status.startsWith('ERRO');
  return (
    <span className={[
      'text-xs font-semibold px-2 py-0.5 rounded-full',
      isOk ? 'bg-green-100 text-green-700'
        : isErr ? 'bg-red-100 text-red-700'
          : 'bg-slate-100 text-slate-600',
    ].join(' ')}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
