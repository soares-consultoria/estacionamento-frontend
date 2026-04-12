import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileUp, Loader2, UploadCloud, XCircle } from 'lucide-react';
import { importacaoApi, type ProcessamentoResultado } from '../api/client';

export default function ImportacaoPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ProcessamentoResultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErro('Apenas arquivos PDF são aceitos.');
      return;
    }
    setFile(f);
    setResultado(null);
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
    setResultado(null);
    setErro(null);
    try {
      const res = await importacaoApi.importarPdf(file);
      setResultado(res);
      setFile(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { mensagem?: string } } };
      setErro(e?.response?.data?.mensagem ?? 'Erro ao processar o arquivo.');
    } finally {
      setLoading(false);
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
                Processando...
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                Importar PDF
              </>
            )}
          </button>
        </form>

        {resultado && <ResultadoCard resultado={resultado} />}
      </div>
    </div>
  );
}

const STATUS_OK = ['SUCESSO', 'PROCESSADO', 'IA_PROCESSADA'];
const STATUS_WARN = ['DUPLICADO', 'JA_IMPORTADO'];

function ResultadoCard({ resultado }: { resultado: ProcessamentoResultado }) {
  const isOk = STATUS_OK.includes(resultado.status);
  const isDuplicate = STATUS_WARN.includes(resultado.status);

  return (
    <div className={[
      'rounded-xl border p-5 space-y-3',
      isOk ? 'border-green-200 bg-green-50' : isDuplicate ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50',
    ].join(' ')}>
      <div className="flex items-start gap-3">
        {isOk ? (
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
        ) : isDuplicate ? (
          <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={[
              'text-xs font-bold px-2 py-0.5 rounded-full',
              isOk ? 'bg-green-100 text-green-700' : isDuplicate ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700',
            ].join(' ')}>
              {resultado.status}
            </span>
            {resultado.nome_arquivo && (
              <span className="text-xs text-slate-500 truncate">{resultado.nome_arquivo}</span>
            )}
          </div>
          <p className={[
            'text-sm mt-1',
            isOk ? 'text-green-800' : isDuplicate ? 'text-yellow-800' : 'text-red-800',
          ].join(' ')}>
            {resultado.mensagem ?? (isOk ? 'Arquivo processado com sucesso.' : isDuplicate ? 'Arquivo já importado anteriormente.' : 'Erro ao processar o arquivo.')}
          </p>
          {(resultado.quantidade_erros > 0 || resultado.quantidade_avisos > 0) && (
            <p className="text-xs text-slate-500 mt-1">
              {resultado.quantidade_erros > 0 && <span className="text-red-600">{resultado.quantidade_erros} erro(s) </span>}
              {resultado.quantidade_avisos > 0 && <span className="text-yellow-600">{resultado.quantidade_avisos} aviso(s)</span>}
            </p>
          )}
        </div>
      </div>

      {resultado.ocorrencias?.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-200">
          {resultado.ocorrencias.map((oc, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={[
                'flex-shrink-0 font-semibold uppercase',
                oc.severidade === 'ERRO' ? 'text-red-600' : 'text-yellow-600',
              ].join(' ')}>
                {oc.severidade}
              </span>
              <span className="text-slate-600">
                {oc.campo && <span className="font-medium text-slate-700">[{oc.campo}] </span>}
                {oc.mensagem}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
