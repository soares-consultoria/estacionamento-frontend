import { useEffect, useState } from 'react';
import { CheckCircle, Crown, Lock, Shield, Zap } from 'lucide-react';
import api from '../../lib/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

type PlanoNome = 'ESSENCIAL' | 'PROFISSIONAL' | 'ENTERPRISE';

interface InstituicaoPlano {
  id: number;
  nome: string;
  cnpj: string | null;
  plano: PlanoNome;
  maxUsuarios: number;
  ativo: boolean;
}

interface PlanoInfo {
  nome: PlanoNome;
  label: string;
  descricao: string;
  maxUsuarios: number;
  funcionalidades: string[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PLANOS: PlanoInfo[] = [
  {
    nome: 'ESSENCIAL',
    label: 'Essencial',
    descricao: 'Funcionalidades básicas para gestão do dia a dia',
    maxUsuarios: 3,
    funcionalidades: ['Visão Geral (KPI)', 'Fluxo de Veículos', 'Importação PDF'],
    icon: Zap,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
  {
    nome: 'PROFISSIONAL',
    label: 'Profissional',
    descricao: 'Análises avançadas para tomada de decisão',
    maxUsuarios: 10,
    funcionalidades: [
      'Tudo do Essencial',
      'Movimentação Horária',
      'Desempenho Anual',
      'Comparativo de Períodos',
      'Análise por Dia da Semana',
      'Metas Mensais',
      'Gratuidade/Tolerância',
      'Previsão do Próximo Mês',
    ],
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    nome: 'ENTERPRISE',
    label: 'Enterprise',
    descricao: 'Visão completa com ranking entre instituições',
    maxUsuarios: 999999,
    funcionalidades: [
      'Tudo do Profissional',
      'Ranking de Instituições',
      'Usuários ilimitados',
    ],
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
];

export default function PlanoGestao() {
  const [instituicoes, setInstituicoes] = useState<InstituicaoPlano[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get<InstituicaoPlano[]>('/api/admin/planos')
      .then(r => setInstituicoes(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleChangePlano(id: number, plano: PlanoNome) {
    setSaving(id);
    setSuccessId(null);
    try {
      const { data } = await api.put<InstituicaoPlano>(`/api/admin/planos/instituicao/${id}`, { plano });
      setInstituicoes(prev => prev.map(i => i.id === id ? { ...i, plano: data.plano, maxUsuarios: data.maxUsuarios } : i));
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Gestão de Planos</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie o plano de cada instituição</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Plan comparison cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANOS.map(plano => {
            const Icon = plano.icon;
            return (
              <div key={plano.nome} className={`rounded-xl border ${plano.borderColor} ${plano.bgColor} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className={plano.color} />
                  <span className={`font-bold text-sm ${plano.color}`}>{plano.label}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{plano.descricao}</p>
                <ul className="space-y-1">
                  {plano.funcionalidades.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-200">
                  Até {plano.maxUsuarios >= 999999 ? 'ilimitados' : plano.maxUsuarios} usuários
                </p>
              </div>
            );
          })}
        </div>

        {/* Institutions table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Instituições</h2>
          </div>

          {loading ? (
            <div className="p-8">
              <LoadingSpinner label="Carregando instituições..." />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Instituição</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">CNPJ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plano Atual</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Alterar</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {instituicoes.map(inst => {
                  const planoAtual = PLANOS.find(p => p.nome === inst.plano) ?? PLANOS[0];
                  const Icon = planoAtual.icon;
                  const isSavingThis = saving === inst.id;
                  const isSuccessThis = successId === inst.id;
                  return (
                    <tr key={inst.id} className={`hover:bg-slate-50 transition-colors ${!inst.ativo ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-700">{inst.nome}</p>
                        {!inst.ativo && <span className="text-xs text-slate-400">inativa</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 hidden sm:table-cell">
                        {inst.cnpj ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${planoAtual.bgColor} ${planoAtual.color} border ${planoAtual.borderColor}`}>
                          <Icon size={11} />
                          {planoAtual.label}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {inst.maxUsuarios >= 999999 ? 'Ilimitados' : `Até ${inst.maxUsuarios}`} usuários
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={inst.plano}
                          onChange={e => handleChangePlano(inst.id, e.target.value as PlanoNome)}
                          disabled={isSavingThis}
                          className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                        >
                          {PLANOS.map(p => (
                            <option key={p.nome} value={p.nome}>{p.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isSavingThis && (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        )}
                        {isSuccessThis && (
                          <CheckCircle size={16} className="text-emerald-500 mx-auto" />
                        )}
                        {!isSavingThis && !isSuccessThis && inst.plano === 'ENTERPRISE' && (
                          <Lock size={14} className="text-amber-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Legend */}
        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
          <p className="text-xs text-slate-500">
            <strong>Atenção:</strong> Alterar o plano de uma instituição afeta imediatamente o acesso dos usuários às funcionalidades.
            O downgrade para um plano inferior pode bloquear funcionalidades em uso.
          </p>
        </div>
      </div>
    </div>
  );
}
