import { useEffect, useMemo, useState } from 'react';
import { Coins } from 'lucide-react';
import { adminApi, type AiConsumoResumo, type AiConsumoUsuarioResumo } from '../../api/client';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const INT = (v: number) => v.toLocaleString('pt-BR');

type Visao = 'instituicao' | 'usuario';

function OrigemBadge({ origem }: { origem: 'chat' | 'pdf' }) {
  const chat = origem === 'chat';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${chat ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>
      {chat ? 'Assistente' : 'Extração PDF'}
    </span>
  );
}

export default function ConsumoIAPage() {
  const agora = new Date();
  const [ano, setAno] = useState(agora.getFullYear());
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [visao, setVisao] = useState<Visao>('instituicao');
  const [porInst, setPorInst] = useState<AiConsumoResumo | null>(null);
  const [porUser, setPorUser] = useState<AiConsumoUsuarioResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periodo = useMemo(() => `${ano}-${String(mes).padStart(2, '0')}`, [ano, mes]);
  const anos = useMemo(() => {
    const y = agora.getFullYear();
    return [y, y - 1, y - 2];
  }, [agora]);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setError(null);
    const req = visao === 'instituicao'
      ? adminApi.getConsumoIA(periodo).then((r) => vivo && (setPorInst(r), setPorUser(null)))
      : adminApi.getConsumoIAPorUsuario(periodo).then((r) => vivo && (setPorUser(r), setPorInst(null)));
    req.catch(() => vivo && setError('Não foi possível carregar o consumo.')).finally(() => vivo && setLoading(false));
    return () => { vivo = false; };
  }, [periodo, visao]);

  const resumo = visao === 'instituicao' ? porInst : porUser;

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <div className="flex items-center gap-3">
            <Coins size={22} className="text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800">Consumo de IA</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
              {(['instituicao', 'usuario'] as Visao[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisao(v)}
                  className={`px-3 py-2 font-medium transition-colors ${visao === v ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {v === 'instituicao' ? 'Por instituição' : 'Por usuário'}
                </button>
              ))}
            </div>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MESES.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
            </select>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {anos.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          {visao === 'instituicao'
            ? 'Tokens consumidos por instituição e origem (Assistente e extração de PDF), com custo, preço e margem.'
            : 'Consumo de IA por usuário (auditoria), com custo, preço e margem.'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
        ) : resumo ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <Kpi titulo="Preço do mês" valor={BRL(resumo.totais.preco_brl)} destaque />
              <Kpi titulo="Custo (OpenAI)" valor={BRL(resumo.totais.custo_brl)} />
              <Kpi titulo="Margem" valor={BRL(resumo.totais.margem_brl)} cor="text-emerald-600" />
              <Kpi titulo="Tokens / Requisições" valor={INT(resumo.totais.tokens_total)} sub={`${INT(resumo.totais.requisicoes)} requisições`} />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                {visao === 'instituicao' && porInst ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Conta</th>
                        <th className="text-left px-4 py-3">Instituição</th>
                        <th className="text-left px-4 py-3">Origem</th>
                        <th className="text-right px-4 py-3">Requisições</th>
                        <th className="text-right px-4 py-3">Tokens</th>
                        <th className="text-right px-4 py-3">Custo</th>
                        <th className="text-right px-4 py-3">Preço</th>
                        <th className="text-right px-4 py-3">Margem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {porInst.linhas.length === 0 ? (
                        <tr><td colSpan={8} className="text-center text-slate-400 py-8">Nenhum consumo no período.</td></tr>
                      ) : (
                        porInst.linhas.map((l) => (
                          <tr key={`${l.instituicao_id}-${l.origem}`} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-500">{l.conta_nome}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{l.instituicao_nome}</td>
                            <td className="px-4 py-3"><OrigemBadge origem={l.origem} /></td>
                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{INT(l.requisicoes)}</td>
                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{INT(l.tokens_total)}</td>
                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{BRL(l.custo_brl)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">{BRL(l.preco_brl)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 tabular-nums">{BRL(l.margem_brl)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {porInst.linhas.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-800">
                          <td className="px-4 py-3" colSpan={3}>Total</td>
                          <td className="px-4 py-3 text-right tabular-nums">{INT(porInst.totais.requisicoes)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{INT(porInst.totais.tokens_total)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{BRL(porInst.totais.custo_brl)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{BRL(porInst.totais.preco_brl)}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 tabular-nums">{BRL(porInst.totais.margem_brl)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                ) : porUser ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Usuário</th>
                        <th className="text-left px-4 py-3">Instituição</th>
                        <th className="text-right px-4 py-3">Requisições</th>
                        <th className="text-right px-4 py-3">Tokens</th>
                        <th className="text-right px-4 py-3">Custo</th>
                        <th className="text-right px-4 py-3">Preço</th>
                        <th className="text-right px-4 py-3">Margem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {porUser.usuarios.length === 0 ? (
                        <tr><td colSpan={7} className="text-center text-slate-400 py-8">Nenhum consumo no período.</td></tr>
                      ) : (
                        porUser.usuarios.map((u, idx) => (
                          <tr key={`${u.usuario_id ?? 'sem'}-${idx}`} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">{u.usuario_nome}</div>
                              {u.usuario_email && <div className="text-xs text-slate-400">{u.usuario_email}</div>}
                            </td>
                            <td className="px-4 py-3 text-slate-500">{u.instituicao_nome}</td>
                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{INT(u.requisicoes)}</td>
                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{INT(u.tokens_total)}</td>
                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{BRL(u.custo_brl)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">{BRL(u.preco_brl)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 tabular-nums">{BRL(u.margem_brl)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {porUser.usuarios.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-800">
                          <td className="px-4 py-3" colSpan={2}>Total</td>
                          <td className="px-4 py-3 text-right tabular-nums">{INT(porUser.totais.requisicoes)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{INT(porUser.totais.tokens_total)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{BRL(porUser.totais.custo_brl)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{BRL(porUser.totais.preco_brl)}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 tabular-nums">{BRL(porUser.totais.margem_brl)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                ) : null}
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Precificação: preço = custo × {resumo.markup} (markup) · câmbio USD→BRL {BRL(resumo.usd_to_brl)} ({resumo.fonte_cambio}). Custo estimado pelas tarifas públicas da OpenAI por modelo.
            </p>
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
      <p className={`text-xl font-bold mt-1 tabular-nums ${cor ?? 'text-slate-800'}`}>{valor}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
