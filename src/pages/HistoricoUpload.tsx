import { useContext, useEffect, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronRight,
  FileText, Loader2, RefreshCw, SearchX,
} from 'lucide-react';
import { importacaoApi, type ArquivoUploadItem, type DiaUpload, type HistoricoUpload } from '../api/client';
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

/** Formata "2026-06-18" → "18/06/2026". */
function fmtDataNome(iso: string | null): string {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.split('T')[0].split('-');
  return dia ? `${dia}/${mes}/${ano}` : iso;
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
  const [malDatados, setMalDatados] = useState<ArquivoUploadItem[]>([]);

  const canSearch = !needsInstituicao || !!selectedId;

  async function carregarMalDatados() {
    if (!canSearch) return;
    try {
      const lista = await importacaoApi.arquivosMalDatados(
        needsInstituicao ? selectedId : undefined,
      );
      setMalDatados(lista);
    } catch {
      // silencioso: o painel é auxiliar e não deve quebrar a tela
    }
  }

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
    if (canSearch) {
      buscar();
      carregarMalDatados();
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleDia(data: string) {
    setExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(data)) { next.delete(data); } else { next.add(data); }
      return next;
    });
  }

  const [corrigindoId, setCorrigindoId] = useState<number | null>(null);
  // Dia bloqueado para correção simples (tem outro arquivo legítimo) → oferece apagar o dia.
  const [bloqueioDia, setBloqueioDia] = useState<{ data: string; nome: string } | null>(null);
  const [apagandoDia, setApagandoDia] = useState(false);

  async function corrigirData(arq: { id: number; nome_arquivo: string; data_referencia: string | null }) {
    const ok = window.confirm(
      `Remover o registro mal-datado de "${arq.nome_arquivo}"?\n\n` +
      `Os dados gravados na data errada serão apagados e o hash liberado. ` +
      `Em seguida, reenvie o arquivo na tela de Upload para reimportar na data correta.\n\n` +
      `A operação é bloqueada se a data atual tiver outro arquivo (para não afetar aquele dia).`,
    );
    if (!ok) return;
    setCorrigindoId(arq.id);
    setErro(null);
    setBloqueioDia(null);
    try {
      const r = await importacaoApi.corrigirDataArquivo(
        arq.id,
        needsInstituicao ? selectedId : undefined,
      );
      await buscar();
      await carregarMalDatados();
      window.alert(r.mensagem ?? 'Registro removido. Reenvie o arquivo na tela de Upload.');
    } catch (e: unknown) {
      const data =
        (e as { response?: { data?: { message?: string; mensagem?: string } } })?.response?.data;
      const msg = data?.message ?? data?.mensagem ?? 'Não foi possível corrigir. Tente manualmente.';
      setErro(msg);
      // Dia compartilhado (tem outro arquivo): oferece apagar o dia inteiro e reenviar.
      if (/possui outro|manualmente/i.test(msg) && arq.data_referencia) {
        setBloqueioDia({ data: arq.data_referencia, nome: arq.nome_arquivo });
      }
    } finally {
      setCorrigindoId(null);
    }
  }

  async function apagarDiaInteiro() {
    if (!bloqueioDia) return;
    const dataFmt = fmtDataNome(bloqueioDia.data);
    const ok = window.confirm(
      `APAGAR TODOS os arquivos de ${dataFmt} (REM e RFE) e seus dados?\n\n` +
      `Isso limpa o dia inteiro e libera os hashes. Você precisará REENVIAR cada ` +
      `arquivo desse dia na tela de Upload para reimportar nas datas corretas.\n\n` +
      `Tenha os arquivos em mãos antes de continuar.`,
    );
    if (!ok) return;
    setApagandoDia(true);
    setErro(null);
    try {
      const r = await importacaoApi.apagarDia(
        bloqueioDia.data,
        needsInstituicao ? selectedId : undefined,
      );
      await buscar();
      await carregarMalDatados();
      setBloqueioDia(null);
      window.alert(
        `${r.removidos} arquivo(s) removido(s) de ${dataFmt}.\n\n` +
        `Agora reenvie os arquivos na tela de Upload (cada um vai para a data correta do nome).`,
      );
    } catch (e: unknown) {
      const data =
        (e as { response?: { data?: { message?: string; mensagem?: string } } })?.response?.data;
      setErro(data?.message ?? data?.mensagem ?? 'Não foi possível apagar o dia.');
    } finally {
      setApagandoDia(false);
    }
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

        {/* Correção bloqueada (dia compartilhado) → oferece apagar o dia inteiro */}
        {bloqueioDia && (
          <div className="border border-red-300 bg-red-50 rounded-xl p-4 space-y-2">
            <p className="text-sm font-bold text-red-800">
              {fmtDataNome(bloqueioDia.data)} tem outro arquivo legítimo
            </p>
            <p className="text-xs text-red-700">
              Não dá para remover só "{bloqueioDia.nome}" sem afetar o outro arquivo do dia
              (os dados são compartilhados por data). Para corrigir, apague o dia inteiro e
              reenvie cada arquivo — eles voltam para as datas corretas do nome.
            </p>
            <button
              onClick={apagarDiaInteiro}
              disabled={apagandoDia}
              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md px-3 py-1.5 transition-colors"
            >
              {apagandoDia
                ? <Loader2 size={13} className="animate-spin" />
                : <AlertTriangle size={13} />}
              Apagar {fmtDataNome(bloqueioDia.data)} inteiro e reenviar
            </button>
          </div>
        )}

        {/* Localizador de arquivos mal-datados (todas as datas) */}
        {malDatados.length > 0 && (
          <MalDatadosPanel
            itens={malDatados}
            onCorrigir={corrigirData}
            corrigindoId={corrigindoId}
          />
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
                    onCorrigir={corrigirData}
                    corrigindoId={corrigindoId}
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

function MalDatadosPanel({ itens, onCorrigir, corrigindoId }: {
  itens: ArquivoUploadItem[];
  onCorrigir: (arq: { id: number; nome_arquivo: string; data_referencia: string | null }) => void;
  corrigindoId: number | null;
}) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-red-200">
        <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-red-800">
            {itens.length} arquivo{itens.length !== 1 ? 's' : ''} mal-datado{itens.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-red-600">
            Importação antiga gravou a data errada — o arquivo "sumiu" do dia correto. Corrija e reenvie.
          </p>
        </div>
      </div>
      <div className="divide-y divide-red-100 bg-white">
        {itens.map(arq => (
          <div key={arq.id} className="flex items-start gap-3 px-4 py-3">
            <FileText size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{arq.nome_arquivo}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Deveria estar em <strong className="text-slate-700">{fmtDataNome(arq.data_nome_arquivo)}</strong>
                {' '}· gravado em{' '}
                <strong className="text-red-600">{fmtDataNome(arq.data_referencia)}</strong>
              </p>
            </div>
            <button
              onClick={() => onCorrigir({ id: arq.id, nome_arquivo: arq.nome_arquivo, data_referencia: arq.data_referencia })}
              disabled={corrigindoId === arq.id}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 border border-red-200 rounded-md px-2 py-1 transition-colors flex-shrink-0"
            >
              {corrigindoId === arq.id
                ? <Loader2 size={12} className="animate-spin" />
                : <RefreshCw size={12} />}
              Corrigir data
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

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

function DiaCard({ dia, expandido, onToggle, onCorrigir, corrigindoId }: {
  dia: DiaUpload; expandido: boolean; onToggle: () => void;
  onCorrigir: (arq: { id: number; nome_arquivo: string; data_referencia: string | null }) => void;
  corrigindoId: number | null;
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
                {arq.data_divergente && (
                  <div className="mt-1 space-y-1">
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle size={12} className="flex-shrink-0" />
                      <span>
                        Data divergente: o nome indica{' '}
                        <strong>{fmtDataNome(arq.data_nome_arquivo)}</strong>, mas foi gravado neste dia.
                      </span>
                    </p>
                    <button
                      onClick={() => onCorrigir({ id: arq.id, nome_arquivo: arq.nome_arquivo, data_referencia: arq.data_referencia })}
                      disabled={corrigindoId === arq.id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 border border-red-200 rounded-md px-2 py-1 transition-colors"
                    >
                      {corrigindoId === arq.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <RefreshCw size={12} />}
                      Corrigir data (apagar e reenviar)
                    </button>
                  </div>
                )}
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
