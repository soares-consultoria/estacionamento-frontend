import { useEffect, useState } from 'react';
import {
  CheckCircle, ChevronDown, ChevronUp, Clock, Crown,
  History, Lock, Shield, TrendingDown, TrendingUp, Users, Zap
} from 'lucide-react';
import api from '../../lib/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

type PlanoNome = 'ESSENCIAL' | 'PROFISSIONAL' | 'ENTERPRISE';
type CicloNome = 'MENSAL' | 'ANUAL';
type MotivoNome = 'UPGRADE' | 'DOWNGRADE' | 'NOVO_CLIENTE' | 'CANCELAMENTO';

interface ContaResumo {
  id: number;
  nome: string;
  plano: PlanoNome;
  planoPendente: PlanoNome | null;
  maxInstituicoes: number;
  maxUsuariosTotal: number;
  dataInicioPlano: string;
  dataVencimento: string;
  ciclo: CicloNome;
  ativo: boolean;
  qtdInstituicoes: number;
  qtdUsuarios: number;
}

interface HistoricoItem {
  id: number;
  planoAnterior: PlanoNome;
  planoNovo: PlanoNome;
  motivo: MotivoNome;
  dataAlteracao: string;
  alteradoPor: string | null;
  valorCobrado: number | null;
}

interface PlanoConfig {
  nome: PlanoNome;
  label: string;
  descricao: string;
  maxInstituicoes: string;
  maxUsuarios: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
}

const PLANOS: PlanoConfig[] = [
  {
    nome: 'ESSENCIAL',
    label: 'Essencial',
    descricao: 'Gestão básica do dia a dia',
    maxInstituicoes: '1 estacionamento',
    maxUsuarios: 'Até 5 usuários',
    icon: Zap,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    nome: 'PROFISSIONAL',
    label: 'Profissional',
    descricao: 'Análises avançadas e múltiplos locais',
    maxInstituicoes: 'Até 5 estacionamentos',
    maxUsuarios: 'Até 20 usuários',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    nome: 'ENTERPRISE',
    label: 'Enterprise',
    descricao: 'Escala ilimitada com ranking entre unidades',
    maxInstituicoes: 'Ilimitados',
    maxUsuarios: 'Ilimitados',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
];

function PlanoBadge({ plano }: { plano: PlanoNome }) {
  const cfg = PLANOS.find(p => p.nome === plano)!;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badgeClass}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function PlanoGestao() {
  const [contas, setContas] = useState<ContaResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [historico, setHistorico] = useState<Record<number, HistoricoItem[]>>({});
  const [loadingHistorico, setLoadingHistorico] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get<ContaResumo[]>('/api/admin/contas')
      .then(r => setContas(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleExpandir(contaId: number) {
    if (expandido === contaId) {
      setExpandido(null);
      return;
    }
    setExpandido(contaId);
    if (!historico[contaId]) {
      setLoadingHistorico(contaId);
      try {
        const { data } = await api.get<HistoricoItem[]>(`/api/admin/contas/${contaId}/historico`);
        setHistorico(prev => ({ ...prev, [contaId]: data }));
      } finally {
        setLoadingHistorico(null);
      }
    }
  }

  async function handleChangePlano(contaId: number, novoPlano: PlanoNome) {
    setSaving(contaId);
    setError(null);
    try {
      const { data } = await api.put<ContaResumo>(`/api/admin/contas/${contaId}/plano`, { plano: novoPlano });
      setContas(prev => prev.map(c => c.id === contaId ? { ...c, ...data } : c));
      // Invalida histórico para recarregar
      setHistorico(prev => { const n = { ...prev }; delete n[contaId]; return n; });
      setSuccessId(contaId);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(null);
    }
  }

  const motivoLabel: Record<MotivoNome, { label: string; icon: React.ElementType; color: string }> = {
    UPGRADE:       { label: 'Upgrade',       icon: TrendingUp,   color: 'text-emerald-600' },
    DOWNGRADE:     { label: 'Downgrade',     icon: TrendingDown, color: 'text-orange-500'  },
    NOVO_CLIENTE:  { label: 'Novo cliente',  icon: CheckCircle,  color: 'text-blue-500'    },
    CANCELAMENTO:  { label: 'Cancelamento',  icon: Lock,         color: 'text-red-500'     },
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Gestão de Contas</h1>
          <p className="text-slate-500 text-sm mt-1">Planos, limites e histórico de faturamento por empresa</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        {/* Comparativo de planos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANOS.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.nome} className={`rounded-xl border ${p.borderColor} ${p.bgColor} p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} className={p.color} />
                  <span className={`font-bold text-sm ${p.color}`}>{p.label}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{p.descricao}</p>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5"><CheckCircle size={10} className="text-emerald-500" />{p.maxInstituicoes}</div>
                  <div className="flex items-center gap-1.5"><Users size={10} className="text-emerald-500" />{p.maxUsuarios}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lista de contas */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Empresas cadastradas</h2>
            <span className="text-xs text-slate-400">{contas.length} conta(s)</span>
          </div>

          {loading ? (
            <div className="p-8"><LoadingSpinner label="Carregando contas..." /></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {contas.map(conta => {
                const isExpanded = expandido === conta.id;
                const isSaving = saving === conta.id;
                const isSuccess = successId === conta.id;
                const hist = historico[conta.id] ?? [];

                return (
                  <div key={conta.id}>
                    {/* Linha principal */}
                    <div className={`px-4 py-3 ${!conta.ativo ? 'opacity-50' : ''}`}>
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Nome + badges */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{conta.nome}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <PlanoBadge plano={conta.plano} />
                            {conta.planoPendente && (
                              <span className="text-xs text-orange-500 flex items-center gap-0.5">
                                <Clock size={10} />
                                Downgrade para {conta.planoPendente} em {formatDate(conta.dataVencimento)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
                          <span title="Estacionamentos">{conta.qtdInstituicoes}/{conta.maxInstituicoes >= 999999 ? '∞' : conta.maxInstituicoes} unid.</span>
                          <span title="Usuários">{conta.qtdUsuarios}/{conta.maxUsuariosTotal >= 999999 ? '∞' : conta.maxUsuariosTotal} usuários</span>
                          <span title="Vencimento">Vence {formatDate(conta.dataVencimento)}</span>
                        </div>

                        {/* Alterar plano */}
                        <div className="flex items-center gap-2">
                          <select
                            value={conta.plano}
                            onChange={e => handleChangePlano(conta.id, e.target.value as PlanoNome)}
                            disabled={isSaving}
                            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                          >
                            {PLANOS.map(p => <option key={p.nome} value={p.nome}>{p.label}</option>)}
                          </select>
                          {isSaving && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                          {isSuccess && <CheckCircle size={16} className="text-emerald-500" />}
                        </div>

                        {/* Expandir histórico */}
                        <button
                          onClick={() => toggleExpandir(conta.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Ver histórico"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Histórico expandido */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-2 mb-3">
                          <History size={13} className="text-slate-400" />
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Histórico de plano</span>
                        </div>
                        {loadingHistorico === conta.id ? (
                          <p className="text-xs text-slate-400">Carregando...</p>
                        ) : hist.length === 0 ? (
                          <p className="text-xs text-slate-400">Nenhum registro.</p>
                        ) : (
                          <div className="space-y-2">
                            {hist.map(h => {
                              const m = motivoLabel[h.motivo];
                              const MIcon = m.icon;
                              return (
                                <div key={h.id} className="flex items-start gap-3 text-xs">
                                  <MIcon size={13} className={`mt-0.5 flex-shrink-0 ${m.color}`} />
                                  <div className="flex-1">
                                    <span className="font-medium text-slate-700">{m.label}: </span>
                                    <PlanoBadge plano={h.planoAnterior} />
                                    <span className="text-slate-400 mx-1">→</span>
                                    <PlanoBadge plano={h.planoNovo} />
                                    {h.valorCobrado && (
                                      <span className="ml-2 text-emerald-600 font-medium">
                                        R$ {h.valorCobrado.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-400 flex-shrink-0">
                                    <span>{formatDate(h.dataAlteracao)}</span>
                                    {h.alteradoPor && <span className="ml-1">· {h.alteradoPor}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 text-xs text-slate-500">
          <strong>Upgrade</strong> é aplicado imediatamente.{' '}
          <strong>Downgrade</strong> é agendado para o próximo vencimento — o cliente mantém os benefícios atuais até lá.
        </div>
      </div>
    </div>
  );
}
