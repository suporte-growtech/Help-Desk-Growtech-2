import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loading } from '../../components/ui/Loading'
import { Plus, Search, Edit, Trash2, Wrench, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface Notebook {
  id: string
  patrimonio_number: string
  brand: string
  model: string
  department: string
  processor: string
  ram_memory: string
  storage_memory: string
  responsible: string
  city: string
  signed_term: boolean
  created_at: string
}

interface Maintenance {
  id: string
  notebook_id: string
  description: string
  date: string
}

export function AdminNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null)
  const [showMaintenance, setShowMaintenance] = useState<string | null>(null)
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [formData, setFormData] = useState({
    patrimonio_number: '',
    brand: '',
    model: '',
    department: '',
    processor: '',
    ram_memory: '',
    storage_memory: '',
    responsible: '',
    city: '',
    signed_term: false,
  })

  useEffect(() => {
    loadNotebooks()
  }, [])

  async function loadNotebooks() {
    try {
      const { data } = await supabase
        .from('notebooks')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setNotebooks(data)
    } catch (err) {
      toast.error('Erro ao carregar notebooks')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingNotebook) {
        const { error } = await supabase
          .from('notebooks')
          .update(formData)
          .eq('id', editingNotebook.id)
        if (error) throw error
        toast.success('Notebook atualizado!')
      } else {
        const { error } = await supabase
          .from('notebooks')
          .insert([formData])
        if (error) throw error
        toast.success('Notebook cadastrado!')
      }
      setShowForm(false)
      setEditingNotebook(null)
      resetForm()
      loadNotebooks()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este notebook?')) return
    try {
      await supabase.from('notebooks').delete().eq('id', id)
      toast.success('Notebook excluído!')
      loadNotebooks()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  async function handleAddMaintenance(notebookId: string) {
    const desc = prompt('Descreva a manutenção realizada:')
    if (!desc) return
    try {
      await supabase.from('maintenance_history').insert([
        { notebook_id: notebookId, description: desc, date: new Date().toISOString() }
      ])
      toast.success('Manutenção registrada!')
    } catch {
      toast.error('Erro ao registrar manutenção')
    }
  }

  async function loadMaintenance(notebookId: string) {
    const { data } = await supabase
      .from('maintenance_history')
      .select('*')
      .eq('notebook_id', notebookId)
      .order('date', { ascending: false })
    if (data) setMaintenances(data)
    setShowMaintenance(notebookId)
  }

  function editNotebook(n: Notebook) {
    setFormData({
      patrimonio_number: n.patrimonio_number,
      brand: n.brand,
      model: n.model,
      department: n.department,
      processor: n.processor,
      ram_memory: n.ram_memory,
      storage_memory: n.storage_memory,
      responsible: n.responsible,
      city: n.city,
      signed_term: n.signed_term,
    })
    setEditingNotebook(n)
    setShowForm(true)
  }

  function resetForm() {
    setFormData({
      patrimonio_number: '', brand: '', model: '', department: '',
      processor: '', ram_memory: '', storage_memory: '', responsible: '',
      city: '', signed_term: false,
    })
  }

  const filtered = notebooks.filter(n =>
    Object.values(n).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  )

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notebooks</h2>
        <button
          onClick={() => { resetForm(); setEditingNotebook(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus size={18} />
          Novo Notebook
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Buscar notebooks..."
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl p-6 mt-8 mb-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {editingNotebook ? 'Editar Notebook' : 'Novo Notebook'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº Patrimônio</label>
                <input type="text" value={formData.patrimonio_number} onChange={e => setFormData({...formData, patrimonio_number: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo</label>
                <input type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departamento</label>
                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Processador</label>
                <input type="text" value={formData.processor} onChange={e => setFormData({...formData, processor: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Memória RAM</label>
                <input type="text" value={formData.ram_memory} onChange={e => setFormData({...formData, ram_memory: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: 8GB" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Armazenamento</label>
                <input type="text" value={formData.storage_memory} onChange={e => setFormData({...formData, storage_memory: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: 256GB SSD" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
                <input type="text" value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.signed_term} onChange={e => setFormData({...formData, signed_term: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Termo de Responsabilidade assinado</span>
                </label>
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all">
                  {editingNotebook ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingNotebook(null) }}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all hover:bg-gray-200 dark:hover:bg-gray-700">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(notebook => (
          <div key={notebook.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  #{notebook.patrimonio_number}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => editNotebook(notebook)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary transition-all">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(notebook.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-danger transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{notebook.brand} {notebook.model}</h3>
              
              <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">Departamento:</span> {notebook.department}</p>
                <p><span className="font-medium">Processador:</span> {notebook.processor}</p>
                <p><span className="font-medium">RAM:</span> {notebook.ram_memory}</p>
                <p><span className="font-medium">Armazenamento:</span> {notebook.storage_memory}</p>
                <p><span className="font-medium">Responsável:</span> {notebook.responsible}</p>
                <p><span className="font-medium">Cidade:</span> {notebook.city}</p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${notebook.signed_term ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {notebook.signed_term ? 'Termo assinado' : 'Sem termo'}
                </span>
                <button onClick={() => loadMaintenance(notebook.id)} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-all">
                  <Wrench size={14} />
                  Histórico
                </button>
              </div>
            </div>

            {showMaintenance === notebook.id && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                    <FileText size={14} /> Histórico de Manutenções
                  </h4>
                  <button onClick={() => handleAddMaintenance(notebook.id)} className="text-xs text-primary hover:text-primary-dark transition-all">
                    + Adicionar
                  </button>
                </div>
                {maintenances.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nenhuma manutenção registrada</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {maintenances.map(m => (
                      <div key={m.id} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-gray-400 whitespace-nowrap">{new Date(m.date).toLocaleDateString('pt-BR')}:</span>
                        <span>{m.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            Nenhum notebook encontrado
          </div>
        )}
      </div>
    </div>
  )
}
