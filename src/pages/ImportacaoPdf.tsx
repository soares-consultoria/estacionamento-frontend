import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileUp, Loader2, UploadCloud, XCircle } from 'lucide-react';
import { importacaoApi, type ImportacaoJob } from '../api/client';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 60; // 3 min máx

export default function ImportacaoPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Processando...');
  const [job, setJob] = useState<ImportacaoJob | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErro('Apenas arquivos PDF são aceitos.');
      return;
    }
    setFile(f);
    setJob(null);
    setErro(null);
  }, []);

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setJob(null);
    setErro(null);
    setLoadingMsg('Enviando arquivo...');

    try {
      const { jobId } = await importacaoApi.criarJob(file);
      setLoadingMsg('Processando com IA...');
      setFile(null);

      // Polling
      let attempts = 0;
      while (attempts < POLL_MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        attempts++;
        const jobData = await importacaoApi.consultarJob(jobId);
        setJob(jobData);
        if (jobData.status === 'CONCLUIDO' || jobData.status === 'ERRO') {
          break;
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { mensagem?: string } } };
      setErro(e?.response?.data?.mensagem ?? 'Erro ao processar o arquivo.');
    } finally {
      setLoading(false);
      setLoadingMsg('Processando...');
    }
  }

  return (
    <div className="h-full overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Importação de PDF</h1>
          <p className="text-slate-500 text-sm mt-1">
            Importe relatórios financeiros em PDF para processar e consolidar os dados.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => !file && inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={[
              'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors',
              file
                ? 'border-blue-300 bg-blue-50'
                : dragging
                ? 'border-blue-400 bg-blue-50 cursor-copy'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 cursor-pointer',
            ].join(' ')}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              onChange={onInputChange}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileUp size={22} className="text-blue-500 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800 truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); setResultado(null); setErro(null); }}
                  className="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <XCircle size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud size={32} className="mx-auto text-slate-300" />
                <p className="text-sm text-slate-500">
                  Arraste um arquivo PDF aqui ou <span className="text-blue-500 font-medium">clique para selecionar</span>
                </p>
                <p className="text-xs text-slate-400">Somente arquivos .pdf</p>
              </div>
            )}
          </div>

          {erro && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {loadingMsg}
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                Importar PDF
              </>
            )}
          </button>
        </form>

        {job && <JobResultadoCard job={job} />}
      </div>
    </div>
  );
}

function JobResultadoCard({ job }: { job: ImportacaoJob }) {
  const isOk = job.status === 'CONCLUIDO';
  const isProcessing = job.status === 'PENDENTE' || job.status === 'PROCESSANDO';

  return (
    <div className={[
      'rounded-xl border p-5 space-y-3',
      isOk ? 'border-green-200 bg-green-50' : isProcessing ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50',
    ].join(' ')}>
      <div className="flex items-start gap-3">
        {isOk ? (
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
        ) : isProcessing ? (
          <Loader2 size={20} className="text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
        ) : (
          <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={[
              'text-xs font-bold px-2 py-0.5 rounded-full',
              isOk ? 'bg-green-100 text-green-700' : isProcessing ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700',
            ].join(' ')}>
              {job.status}
            </span>
            {job.nomeArquivo && (
              <span className="text-xs text-slate-500 truncate">{job.nomeArquivo}</span>
            )}
          </div>
          <p className={[
            'text-sm mt-1',
            isOk ? 'text-green-800' : isProcessing ? 'text-blue-800' : 'text-red-800',
          ].join(' ')}>
            {job.mensagem ?? (isOk ? 'Arquivo processado com sucesso.' : isProcessing ? 'Aguardando processamento...' : 'Erro ao processar o arquivo.')}
          </p>
        </div>
      </div>
    </div>
  );
}
