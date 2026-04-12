import { useEffect, useState } from 'react';
import { CheckCircle, Edit2, Plus, Users, XCircle } from 'lucide-react';
import type { AxiosError } from 'axios';
import { adminApi, type Instituicao, type UsuarioAdmin } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/admin';

function apiError(err: unknown, fallback: string): string {
  const e = err as AxiosError<{ mensagem?: string; message?: string }>;
  return e?.response?.data?.mensagem ?? e?.response?.data?.message ?? fallback;
}

const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'USER'];
const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  USER: 'Usuário',
};

interface CreateForm {
  instituicaoId: number | null;
  nome: string;
  email: string;
  senha: string;
  role: Role;
}

interface UpdateForm {
  nome: string;
  role: Role;
  ativo: boolean;
}

const emptyCreate: CreateForm = { instituicaoId: null, nome: '', email: '', senha: '', role: 'USER' };

export default function UsuariosPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);

  const [editingUser, setEditingUser] = useState<UsuarioAdmin | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateForm>({ nome: '', role: 'USER', ativo: true });

  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [us, insts] = await Promise.all([
        adminApi.listUsuarios(),
        isSuperAdmin ? adminApi.listInstituicoes() : Promise.resolve([]),
      ]);
      setUsuarios(us);
      setInstituicoes(insts);
    } catch (err) {
      setError(apiError(err, 'Erro ao carregar dados.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (isSuperAdmin && !createForm.instituicaoId) {
      setError('Selecione uma instituição.');
      return;
    }
    setSaving(true);
    try {
      await adminApi.createUsuario({
        instituicaoId: isSuperAdmin ? createForm.instituicaoId! : user!.instituicaoId,
        nome: createForm.nome,
        email: createForm.email,
        senha: createForm.senha,
        role: createForm.role,
      });
      setShowCreate(false);
      setCreateForm(emptyCreate);
      await load();
    } catch (err) {
      setError(apiError(err, 'Erro ao criar usuário.'));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(u: UsuarioAdmin) {
    setEditingUser(u);
    setUpdateForm({ nome: u.nome, role: u.role as Role, ativo: u.ativo });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await adminApi.updateUsuario(editingUser.id, updateForm);
      setEditingUser(null);
      await load();
    } catch (err) {
      setError(apiError(err, 'Erro ao atualizar usuário.'));
    } finally {
      setSaving(false);
    }
  }

  const availableRoles: Role[] = isSuperAdmin ? ROLES : ['ADMIN', 'USER'];

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users size={22} className="text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800">Usuários</h1>
          </div>
          <button
            onClick={() => {
              const defaultInst = isSuperAdmin ? (instituicoes.find(i => i.ativo)?.id ?? null) : null;
              setCreateForm({ ...emptyCreate, instituicaoId: defaultInst });
              setError(null);
              setShowCreate(true);
              setEditingUser(null);
            }}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Novo usuário
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Novo usuário</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Instituição *</label>
                  <select
                    required
                    value={createForm.instituicaoId ?? ''}
                    onChange={e => setCreateForm(f => ({ ...f, instituicaoId: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {instituicoes.filter(i => i.ativo).map(i => (
                      <option key={i.id} value={i.id}>{i.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Nome *</label>
                  <input
                    required
                    value={createForm.nome}
                    onChange={e => setCreateForm(f => ({ ...f, nome: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">E-mail *</label>
                  <input
                    required
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Senha *</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={createForm.senha}
                    onChange={e => setCreateForm(f => ({ ...f, senha: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Perfil *</label>
                  <select
                    value={createForm.role}
                    onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as Role }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                >
                  {saving ? 'Salvando...' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-slate-600 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit form */}
        {editingUser && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Editar: {editingUser.email}</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Nome *</label>
                  <input
                    required
                    value={updateForm.nome}
                    onChange={e => setUpdateForm(f => ({ ...f, nome: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Perfil</label>
                  <select
                    value={updateForm.role}
                    onChange={e => setUpdateForm(f => ({ ...f, role: e.target.value as Role }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateForm.ativo}
                  onChange={e => setUpdateForm(f => ({ ...f, ativo: e.target.checked }))}
                  className="w-4 h-4"
                />
                Ativo
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="text-slate-600 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {usuarios.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">Nenhum usuário encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Nome</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">E-mail</th>
                      {isSuperAdmin && (
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Instituição</th>
                      )}
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Perfil</th>
                      <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Ativo</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuarios.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{u.nome}</td>
                        <td className="px-5 py-3 text-slate-500">{u.email}</td>
                        {isSuperAdmin && (
                          <td className="px-5 py-3 text-slate-500">{u.nomeInstituicao}</td>
                        )}
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ROLE_LABELS[u.role as Role] ?? u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {u.ativo
                            ? <CheckCircle size={15} className="text-green-500 inline" />
                            : <XCircle size={15} className="text-slate-400 inline" />
                          }
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => openEdit(u)}
                            className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
