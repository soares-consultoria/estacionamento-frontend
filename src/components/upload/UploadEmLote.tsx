/**
 * UploadEmLote — seleção múltipla de arquivos PDF (incluindo pasta inteira)
 * com pré-checagem de duplicata por SHA-256, upload paralelo (concorrência 4)
 * e polling do status de cada job.
 *
 * Fase 1 — Upload Múltiplo + Seleção de Pasta
 */
import { useCallback, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, FileText, FolderOpen,
  Loader2, Plus, RefreshCw, XCircle,
} from 'lucide-react';
import { sha256File } from '../../lib/sha256';
import { checkHash } from '../../api/importacaoHashApi';
import { importacaoApi } from '../../api/client';
import { inferirTipo, TIPO_LABEL, type TipoRelatorioHint } from './HeuristicaTipo';

/* ─── Tipos ─── */

type FileStatus =
  | 'idle'
  | 'hashing'
  | 'checking'
  | 'duplicate'
  | 'uploading'
  | 'polling'
  | 'done'
  | 'done_warnings'
  | 'error';

interface FileItem {
  id: string;
  file: File;
  tipoHint: TipoRelatorioHint;
  status: FileStatus;
  mensagem: string | null;
  jobId: number | null;
  progress: number; // 0-100
}

interface Props {
  /** Passado pelo pai para envio multi-tenant (SISTEMA_ADMIN / SUPER_ADMIN) */
  instituicaoId?: number | null;
  /** Callback opcional chamado ao final de cada lote */
  onLoteConcluido?: () => void;
}

const CONCORRENCIA = 4;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_TENTATIVAS = 30; // ~60 s

/* ─── Utilitários ─── */

function uid() {
  return Math.random().toString(36).slice(2);
}

function statusLabel(s: FileStatus): string {
  switch (s) {
    case 'idle': return 'Aguardando';
    case 'hashing': return 'Calculando hash…';
    case 'checking': return 'Verificando duplicata…';
    case 'duplicate': return 'Já enviado';
    case 'uploading': return 'Enviando…';
    case 'polling': return 'Processando…';
    case 'done': return 'Processado';
    case 'done_warnings': return 'Processado c/ avisos';
    case 'error': return 'Erro';
  }
}

function StatusIcon({ status }: { status: FileStatus }) {
  switch (status) {
    case 'hashing':
    case 'checking':
    case 'uploading':
    case 'polling':
      return <Loader2 size={14} className="animate-spin text-blue-500 flex-shrink-0" />;
    case 'duplicate':
      return <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />;
    case 'done':
      return <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />;
    case 'done_warnings':
      return <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />;
    case 'error':
      return <XCircle size={14} className="text-red-500 flex-shrink-0" />;
    default:
      return <Clock size={14} className="text-slate-400 flex-shrink-0" />;
  }
}

function statusBadgeClass(s: FileStatus): string {
  switch (s) {
    case 'done': return 'bg-green-100 text-green-700';
    case 'done_warnings': return 'bg-yellow-100 text-yellow-700';
    case 'duplicate': return 'bg-amber-100 text-amber-700';
    case 'error': return 'bg-red-100 text-red-700';
    case 'idle': return 'bg-slate-100 text-slate-500';
    default: return 'bg-blue-50 text-blue-600';
  }
}

/* ─── Hook interno: pool de concorrência ─── */

async function runPool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<void> {
  const queue = [...tasks];
  const executing: Promise<void>[] = [];

  async function runNext(): Promise<void> {
    if (queue.length === 0) return;
    const task = queue.shift()!;
    const p: Promise<void> = task().then(() => {
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);
    if (executing.length >= limit) {
      await Promise.race(executing);
      await runNext();
    } else {
      await runNext();
    }
  }

  await runNext();
  await Promise.all(executing);
}

/* ─── Componente ─── */

export default function UploadEmLote({ instituicaoId, onLoteConcluido }: Props) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [rodando, setRodando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  /* Atualiza campo(s) de um item pelo id */
  const patch = useCallback((id: string, partial: Partial<FileItem>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...partial } : it));
  }, []);

  /* Adiciona arquivos à lista (dedup por nome+tamanho) */
  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (arr.length === 0) return;

    setItems(prev => {
      const existingKeys = new Set(prev.map(it => `${it.file.name}|${it.file.size}`));
      const novos: FileItem[] = arr
        .filter(f => !existingKeys.has(`${f.name}|${f.size}`))
        .map(f => ({
          id: uid(),
          file: f,
          tipoHint: inferirTipo(f.name),
          status: 'idle' as FileStatus,
          mensagem: null,
          jobId: null,
          progress: 0,
        }));
      return [...prev, ...novos];
    });
  }

  /* Polling do job até terminal */
  async function pollJob(id: string, jobId: number) {
    patch(id, { status: 'polling', jobId });
    let tentativas = 0;
    while (tentativas < POLL_MAX_TENTATIVAS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      try {
        const job = await importacaoApi.consultarJob(jobId);
        if (job.status === 'CONCLUIDO') {
          patch(id, { status: 'done', mensagem: null });
          return;
        }
        if (job.status === 'ERRO') {
          patch(id, { status: 'error', mensagem: job.mensagem ?? 'Erro no processamento' });
          return;
        }
        // PENDENTE / PROCESSANDO — continuar polling
      } catch {
        // falha de rede temporária, continuar
      }
      tentativas++;
    }
    patch(id, { status: 'error', mensagem: 'Tempo esgotado aguardando processamento' });
  }

  /* Processa um item: hash → HEAD → POST jobs → poll */
  async function processarItem(item: FileItem) {
    // 1. Hash
    patch(item.id, { status: 'hashing', progress: 10 });
    let hash: string;
    try {
      hash = await sha256File(item.file);
    } catch {
      patch(item.id, { status: 'error', mensagem: 'Falha ao calcular SHA-256' });
      return;
    }

    // 2. HEAD (verificar duplicata)
    patch(item.id, { status: 'checking', progress: 25 });
    const checkResult = await checkHash(hash, instituicaoId);
    if (checkResult === 'duplicate') {
      patch(item.id, { status: 'duplicate', mensagem: 'Arquivo já processado anteriormente' });
      return;
    }
    // 'error' no HEAD → não bloquear; tentamos enviar mesmo assim

    // 3. Upload via POST /api/importacao/jobs
    patch(item.id, { status: 'uploading', progress: 50 });
    try {
      const { jobId } = await importacaoApi.criarJob(item.file, instituicaoId);
      patch(item.id, { progress: 70 });
      await pollJob(item.id, jobId);
      patch(item.id, { progress: 100 });
    } catch (err: unknown) {
      const msg = extractMessage(err) ?? 'Erro ao enviar arquivo';
      patch(item.id, { status: 'error', mensagem: msg });
    }
  }

  /* Inicia o processamento em lote */
  async function iniciar() {
    const pendentes = items.filter(it => it.status === 'idle' || it.status === 'error');
    if (pendentes.length === 0) return;

    setRodando(true);
    const tasks = pendentes.map(item => () => processarItem(item));
    await runPool(tasks, CONCORRENCIA);
    setRodando(false);
    onLoteConcluido?.();
  }

  /* Drag & Drop */
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }

  function remover(id: string) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  function limpar() {
    setItems([]);
  }

  const pendentesCount = items.filter(it => it.status === 'idle' || it.status === 'error').length;
  const doneCount = items.filter(it => it.status === 'done' || it.status === 'done_warnings').length;
  const dupCount = items.filter(it => it.status === 'duplicate').length;
  const errCount = items.filter(it => it.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Zona de drop */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-default"
      >
        <FileText size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm mb-4">
          Arraste PDFs aqui ou selecione arquivos / pasta
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {/* Selecionar arquivos individuais */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Adicionar arquivos
          </button>
          {/* Selecionar pasta */}
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <FolderOpen size={14} />
            Selecionar pasta
          </button>
        </div>

        {/* Inputs ocultos */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error — atributos não-padrão para seleção de pasta
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Resumo + ações */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 flex gap-4 text-xs text-slate-500">
            <span>{items.length} arquivo{items.length !== 1 ? 's' : ''}</span>
            {doneCount > 0 && <span className="text-green-600">{doneCount} ok</span>}
            {dupCount > 0 && <span className="text-amber-600">{dupCount} duplicado{dupCount !== 1 ? 's' : ''}</span>}
            {errCount > 0 && <span className="text-red-600">{errCount} erro{errCount !== 1 ? 's' : ''}</span>}
          </div>
          <button
            type="button"
            onClick={limpar}
            disabled={rodando}
            className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-40"
          >
            Limpar lista
          </button>
          <button
            type="button"
            onClick={iniciar}
            disabled={rodando || pendentesCount === 0}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {rodando
              ? <><Loader2 size={14} className="animate-spin" /> Enviando…</>
              : <><RefreshCw size={14} /> Enviar {pendentesCount} arquivo{pendentesCount !== 1 ? 's' : ''}</>}
          </button>
        </div>
      )}

      {/* Lista de arquivos */}
      {items.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-white">
              <StatusIcon status={item.status} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{item.file.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.tipoHint && (
                    <span className="text-xs text-slate-400">
                      {TIPO_LABEL[item.tipoHint]}
                    </span>
                  )}
                  {item.mensagem && (
                    <span className="text-xs text-slate-400 truncate">{item.mensagem}</span>
                  )}
                </div>
              </div>

              {/* Barra de progresso (só quando em andamento) */}
              {['hashing', 'checking', 'uploading', 'polling'].includes(item.status) && (
                <div className="w-20 bg-slate-100 rounded-full h-1.5 flex-shrink-0">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusBadgeClass(item.status)}`}>
                {statusLabel(item.status)}
              </span>

              {/* Botão remover (apenas quando não em processamento) */}
              {!rodando && !['hashing', 'checking', 'uploading', 'polling'].includes(item.status) && (
                <button
                  type="button"
                  onClick={() => remover(item.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remover"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function extractMessage(err: unknown): string | null {
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const data = e.response as Record<string, unknown> | undefined;
    if (data?.data && typeof (data.data as Record<string, unknown>).message === 'string') {
      return (data.data as Record<string, unknown>).message as string;
    }
    if (typeof e.message === 'string') return e.message;
  }
  return null;
}
