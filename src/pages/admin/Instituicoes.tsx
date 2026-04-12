import { useEffect, useState } from 'react';
import { Building2, CheckCircle, Edit2, Plus, XCircle } from 'lucide-react';
import { adminApi, type Instituicao } from '../../api/client';

interface FormState {
  nome: string;
  cnpj: string;
  ativo: boolean;
}

const emptyForm: FormState = { nome: '', cnpj: '', ativo: true };

export default function InstituicoesPage() {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setInstituicoes(await adminApi.listInstituicoes());
    } catch {
      setError('Erro ao carregar instituições.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(inst: Instituicao) {
    setEditingId(inst.id);
    setForm({ nome: inst.nome, cnpj: inst.cnpj ?? '', ativo: inst.ativo });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { nome: form.nome, cnpj: form.cnpj || undefined, ativo: form.ativo };
      if (editingId != null) {
        await adminApi.updateInstituicao(editingId, payload);
      } else {
        await adminApi.createInstituicao(payload);
      }
      setShowForm(false);
      await load();
    } catch {
      setError('Erro ao salvar instituição.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building2 size={22} className="text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800">Instituições</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Nova instituição
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">
              {editingId != null ? 'Editar instituição' : 'Nova instituição'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Nome *</label>
                <input
                  required
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome da instituição"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">CNPJ</label>
                <input
                  value={form.cnpj}
                  onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00.000.000/0000-00"
                />
              </div>
              {editingId != null && (
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  Ativa
                </label>
              )}
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
                  onClick={() => setShowForm(false)}
                  className="text-slate-600 hover:text-slate-800 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
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
            {instituicoes.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">Nenhuma instituição cadastrada.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {instituicoes.map(inst => (
                  <li key={inst.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{inst.nome}</p>
                      {inst.cnpj && <p className="text-slate-400 text-xs mt-0.5">{inst.cnpj}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {inst.ativo
                        ? <CheckCircle size={15} className="text-green-500" />
                        : <XCircle size={15} className="text-slate-400" />
                      }
                      <button
                        onClick={() => openEdit(inst)}
                        className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
