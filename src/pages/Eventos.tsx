import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarRange, Pencil, Plus, Trash2, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useInstituicao } from '../hooks/useInstituicao';
import {
  eventosApi,
  CATEGORIAS,
  CATEGORIA_INFO,
  type CategoriaEvento,
  type Evento,
  type EventoInput,
} from '../api/eventos';

function fmtData(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function diasEntre(inicio: string, fim: string): number {
  const a = new Date(inicio + 'T00:00:00');
  const b = new Date(fim + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

function periodo(e: Evento): string {
  if (e.data_inicio === e.data_fim) return fmtData(e.data_inicio);
  return `${fmtData(e.data_inicio)} – ${fmtData(e.data_fim)}`;
}

interface FormState {
  titulo: string;
  categoria: CategoriaEvento;
  data_inicio: string;
  data_fim: string;
  descricao: string;
}

const emptyForm: FormState = {
  titulo: '',
  categoria: 'CINEMA',
  data_inicio: '',
  data_fim: '',
  descricao: '',
};

export default function EventosPage() {
  const { selectedId } = useInstituicao();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Evento | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setEventos(await eventosApi.listar());
    } catch {
      setError('Erro ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarrega ao montar e ao trocar a instituição selecionada (SISTEMA_ADMIN).
  useEffect(() => { load(); }, [load, selectedId]);

  const kpis = useMemo(() => {
    const hoje = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD no fuso local (evita erro de UTC)
    const futuros = eventos.filter(e => e.data_fim >= hoje).length;
    const categorias = new Set(eventos.map(e => e.categoria)).size;
    return { total: eventos.length, futuros, categorias };
  }, [eventos]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(e: Evento) {
    setEditingId(e.id);
    setForm({
      titulo: e.titulo,
      categoria: e.categoria,
      data_inicio: e.data_inicio,
      data_fim: e.data_fim,
      descricao: e.descricao ?? '',
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.titulo.trim()) { setFormError('Informe o título do evento.'); return; }
    if (!form.data_inicio || !form.data_fim) { setFormError('Informe a data de início e a data de fim.'); return; }
    if (form.data_fim < form.data_inicio) { setFormError('A data de fim não pode ser anterior à data de início.'); return; }

    const payload: EventoInput = {
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      descricao: form.descricao.trim() || null,
    };
    setSaving(true);
    try {
      if (editingId != null) {
        await eventosApi.atualizar(editingId, payload);
      } else {
        await eventosApi.criar(payload);
      }
      setShowForm(false);
      await load();
    } catch {
      setFormError('Erro ao salvar o evento.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmarExclusao() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventosApi.excluir(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch {
      setError('Erro ao excluir o evento.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Eventos</h1>
            <p className="text-slate-500 text-sm mt-1">
              Registre acontecimentos (com período) que ajudam a explicar variações no fluxo.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> Novo evento
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
            <p className="text-slate-500 text-sm font-medium">Total de eventos</p>
            <p className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">{kpis.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
            <p className="text-slate-500 text-sm font-medium">Vigentes ou futuros</p>
            <p className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">{kpis.futuros}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
            <p className="text-slate-500 text-sm font-medium">Categorias usadas</p>
            <p className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">{kpis.categorias}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Lista (não mostra empty-state quando há erro, para não confundir com "sem dados") */}
        {error ? null : loading ? (
          <LoadingSpinner label="Carregando eventos..." />
        ) : eventos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 text-center">
            <CalendarRange className="mx-auto text-slate-300" size={40} />
            <p className="text-slate-600 font-medium mt-3">Nenhum evento cadastrado</p>
            <p className="text-slate-400 text-sm mt-1">
              Cadastre eventos como lançamentos de cinema, exposições e shows para justificar picos de fluxo.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Evento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map(e => {
                  const info = CATEGORIA_INFO[e.categoria];
                  const dias = diasEntre(e.data_inicio, e.data_fim);
                  return (
                    <tr key={e.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {periodo(e)}
                        {dias > 1 && <span className="ml-1 font-normal text-slate-400">({dias} dias)</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {e.titulo}
                        {e.descricao && <span className="block text-xs text-slate-400 truncate max-w-md">{e.descricao}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${info.chip}`}>
                          {info.emoji} {info.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => openEdit(e)}
                          className="border border-slate-200 rounded-lg p-1.5 hover:bg-slate-50 text-slate-600"
                          title="Editar" aria-label="Editar evento"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(e)}
                          className="border border-slate-200 rounded-lg p-1.5 ml-1.5 hover:bg-red-50 hover:border-red-200 text-red-600"
                          title="Excluir" aria-label="Excluir evento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-400 leading-relaxed">
          Os eventos são específicos da instituição selecionada. Em breve, os marcadores aparecerão nos gráficos de fluxo
          para medir o impacto de cada evento.
        </p>
      </div>

      {/* Modal criar/editar */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
            onClick={ev => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingId != null ? 'Editar evento' : 'Novo evento'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Título do evento</span>
                <input
                  type="text" maxLength={160} value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex.: Lançamento de filme, exposição, show..."
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Categoria</span>
                <select
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value as CategoriaEvento })}
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIAS.map(c => (
                    <option key={c.valor} value={c.valor}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Data de início</span>
                  <input
                    type="date" value={form.data_inicio}
                    onChange={e => setForm({ ...form, data_inicio: e.target.value, data_fim: form.data_fim || e.target.value })}
                    className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Data de fim</span>
                  <input
                    type="date" value={form.data_fim} min={form.data_inicio || undefined}
                    onChange={e => setForm({ ...form, data_fim: e.target.value })}
                    className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Descrição (opcional)</span>
                <textarea
                  rows={3} maxLength={1000} value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Detalhes do evento..."
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {formError && <p className="text-red-600 text-xs font-semibold">{formError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  {saving ? 'Salvando...' : 'Salvar evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão (modal padrão, substitui o window.confirm) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { if (!deleting) setDeleteTarget(null); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={ev => ev.stopPropagation()}>
            <div className="p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800">Excluir evento</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tem certeza que deseja excluir <b className="text-slate-700">"{deleteTarget.titulo}"</b>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button" onClick={confirmarExclusao} disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
              >
                <Trash2 size={15} /> {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
