import { useEffect, useState } from 'react';
import { Download, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import { exportarFeedback, obterResumoFeedback, type FeedbackResumo } from '../../api/chatAi';

function pct(v: number | null): string {
  return v == null ? '—' : `${Math.round(v * 100)}%`;
}

function dataBr(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Escapa um campo para CSV (aspas duplas, quebras de linha, ponto-e-vírgula). */
function csvCampo(v: string | number | null): string {
  const s = v == null ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export default function ChatFeedbackPage() {
  const [resumo, setResumo] = useState<FeedbackResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    obterResumoFeedback()
      .then((r) => vivo && setResumo(r))
      .catch(() => vivo && setError('Não foi possível carregar o feedback.'))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, []);

  async function handleExport() {
    setExportando(true);
    setError(null);
    try {
      const itens = await exportarFeedback();
      const cabecalho = ['Avaliacao', 'Pergunta', 'Resposta', 'Data'];
      const linhas = itens.map((i) => [
        i.feedback === 1 ? '👍 Positivo' : '👎 Negativo',
        i.pergunta ?? '',
        i.resposta,
        dataBr(i.criado_em),
      ].map(csvCampo).join(';'));
      // BOM p/ Excel abrir acentos corretamente
      const csv = '﻿' + [cabecalho.map(csvCampo).join(';'), ...linhas].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback-assistente-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Não foi possível exportar o feedback.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-3 min-w-0">
            <MessageSquare size={22} className="text-blue-500 flex-shrink-0" />
            <h1 className="text-xl font-bold text-slate-800">Feedback do Assistente</h1>
          </div>
          <button
            onClick={handleExport}
            disabled={exportando || !resumo || resumo.avaliadas === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0"
            title="Exportar as respostas avaliadas (CSV)"
          >
            <Download size={16} />
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Avaliações 👍/👎 das respostas do assistente — base para melhorar a qualidade ao longo do tempo.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
        ) : resumo ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Kpi titulo="Taxa de aprovação" valor={pct(resumo.taxa_aprovacao)} destaque />
              <Kpi titulo="Respostas avaliadas" valor={`${resumo.avaliadas}`} sub={`de ${resumo.total_respostas} (${pct(resumo.percentual_avaliado)})`} />
              <Kpi titulo="👍 Positivos" valor={`${resumo.positivos}`} cor="text-green-600" />
              <Kpi titulo="👎 Negativos" valor={`${resumo.negativos}`} cor="text-red-500" />
            </div>

            {/* Respostas mal avaliadas */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
                <ThumbsDown size={15} className="text-red-500" />
                <h2 className="font-semibold text-slate-800 text-sm">Respostas mal avaliadas</h2>
                <span className="text-xs text-slate-400">({resumo.piores.length})</span>
              </div>
              {resumo.piores.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                  <ThumbsUp size={22} className="text-green-400" />
                  <p className="text-sm">Nenhuma resposta avaliada como negativa. 🎉</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {resumo.piores.map((p) => {
                    const pergunta = p.pergunta ?? p.titulo;
                    return (
                      <li key={p.mensagem_id} className="px-5 py-3">
                        {pergunta && (
                          <p className="text-xs font-medium text-slate-500 mb-1">
                            Pergunta: <span className="text-slate-700">{pergunta}</span>
                          </p>
                        )}
                        <p className="text-sm text-slate-800 whitespace-pre-wrap break-words line-clamp-4">{p.conteudo}</p>
                        <p className="text-xs text-slate-400 mt-1">{dataBr(p.criado_em)}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Kpi({ titulo, valor, sub, cor, destaque }: { titulo: string; valor: string; sub?: string; cor?: string; destaque?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${destaque ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'} shadow-sm`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{titulo}</p>
      <p className={`text-2xl font-bold mt-1 ${cor ?? 'text-slate-800'}`}>{valor}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
