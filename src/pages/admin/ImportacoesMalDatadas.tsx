import { useEffect, useState } from 'react';
import { AlertTriangle, FileWarning } from 'lucide-react';
import { importacaoApi, type MalDatadoGlobal } from '../../api/client';

const TIPO_LABEL: Record<string, string> = {
  FINANCEIRO_ESTATISTICO: 'Financeiro (RFE)',
  EST_MOVIMENTACAO: 'Movimentação (REM)',
};

function dataBr(iso: string | null): string {
  if (!iso) return '—';
  const [d] = iso.split('T');
  const [a, m, dia] = d.split('-');
  return dia ? `${dia}/${m}/${a}` : iso;
}

export default function ImportacoesMalDatadasPage() {
  const [linhas, setLinhas] = useState<MalDatadoGlobal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    importacaoApi
      .malDatadosGlobal()
      .then((r) => vivo && setLinhas(r))
      .catch(() => vivo && setError('Não foi possível carregar o relatório.'))
      .finally(() => vivo && setLoading(false));
    return () => { vivo = false; };
  }, []);

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <FileWarning size={22} className="text-amber-500" />
          <h1 className="text-xl font-bold text-slate-800">Importações mal-datadas</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Relatório consolidado (todas as instituições) de arquivos potencialmente na data errada —
          divergência entre a data do nome e a data gravada, ou órfãos processados <strong>sem data</strong>.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
        ) : linhas ? (
          linhas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <AlertTriangle size={22} className="text-green-400" />
              <p className="text-sm">Nenhum arquivo mal-datado encontrado. 🎉</p>
            </div>
          ) : (
            <>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Instituição</th>
                        <th className="text-left px-4 py-3">Arquivo</th>
                        <th className="text-left px-4 py-3">Tipo</th>
                        <th className="text-left px-4 py-3">Data (nome)</th>
                        <th className="text-left px-4 py-3">Data (gravada)</th>
                        <th className="text-left px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {linhas.map((l) => {
                        const orfao = !l.data_referencia;
                        return (
                          <tr key={l.arquivo_id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">{l.instituicao_nome}</td>
                            <td className="px-4 py-3 text-slate-600">{l.nome_arquivo}</td>
                            <td className="px-4 py-3 text-slate-500">{l.tipo_relatorio ? TIPO_LABEL[l.tipo_relatorio] ?? l.tipo_relatorio : '—'}</td>
                            <td className="px-4 py-3 text-slate-700">{dataBr(l.data_nome_arquivo)}</td>
                            <td className="px-4 py-3">
                              <span className={orfao ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700' : 'text-red-600 font-medium'}>
                                {orfao ? 'sem data (órfão)' : dataBr(l.data_referencia)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">{l.status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                {linhas.length} arquivo{linhas.length !== 1 ? 's' : ''} · Para corrigir: entre em <strong>Importação → Histórico de Uploads</strong> da instituição
                (selecione-a no topo) e use <strong>"Corrigir data (apagar e reenviar)"</strong> no painel de mal-datados.
              </p>
            </>
          )
        ) : null}
      </div>
    </div>
  );
}
