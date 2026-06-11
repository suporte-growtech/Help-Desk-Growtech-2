import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loading } from '../../components/ui/Loading'
import { Plus, Search, Edit, Trash2, Server, Eye, EyeOff, Copy, Key, LayoutGrid, List, Filter, Monitor, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface ServerAccount {
  id: string
  server_name: string
  username: string
  password_enc: string
  server_type: string
  owner_name: string
  notes: string
  created_at: string
}

function enc(txt: string) {
  return btoa(txt)
}
function dec(txt: string) {
  try { return atob(txt) } catch { return txt }
}

export function AdminServers() {
  const [accounts, setAccounts] = useState<ServerAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [sortBy, setSortBy] = useState<'server_name' | 'username' | 'server_type' | 'owner_name' | 'created_at'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ServerAccount | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState({
    server_name: '',
    username: '',
    password: '',
    server_type: 'Windows Server',
    owner_name: '',
    notes: '',
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      const { data } = await supabase
        .from('server_accounts')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setAccounts(data as ServerAccount[])
    } catch (err) {
      toast.error('Erro ao carregar servidores')
    } finally {
      setLoading(false)
    }
  }

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = {
        server_name: formData.server_name,
        username: formData.username,
        password_enc: enc(formData.password),
        server_type: formData.server_type,
        owner_name: formData.owner_name,
        notes: formData.notes,
      }

      if (editing) {
        const { error } = await supabase.from('server_accounts').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Servidor atualizado!')
      } else {
        const { error } = await supabase.from('server_accounts').insert([payload])
        if (error) throw error
        toast.success('Servidor cadastrado!')
      }
      setShowForm(false)
      setEditing(null)
      resetForm()
      loadAccounts()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este servidor?')) return
    try {
      await supabase.from('server_accounts').delete().eq('id', id)
      toast.success('Servidor excluído!')
      loadAccounts()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  function editAccount(a: ServerAccount) {
    setFormData({
      server_name: a.server_name,
      username: a.username,
      password: dec(a.password_enc),
      server_type: a.server_type || '',
      owner_name: a.owner_name || '',
      notes: a.notes || '',
    })
    setEditing(a)
    setShowForm(true)
  }

  function resetForm() {
    setFormData({ server_name: '', username: '', password: '', server_type: 'Windows Server', owner_name: '', notes: '' })
    setEditing(null)
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copiado!')
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  const types = [...new Set(accounts.map(a => a.server_type).filter(Boolean))].sort()

  let filtered = accounts.filter(a =>
    (a.server_name.toLowerCase().includes(search.toLowerCase()) ||
    a.username.toLowerCase().includes(search.toLowerCase()) ||
    (a.owner_name || '').toLowerCase().includes(search.toLowerCase())) &&
    (!typeFilter || a.server_type === typeFilter)
  )

  filtered.sort((a, b) => {
    const aVal = (a[sortBy] || '').toString().toLowerCase()
    const bVal = (b[sortBy] || '').toString().toLowerCase()
    const cmp = aVal.localeCompare(bVal)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return null
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Servidores</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total: {accounts.length} servidores</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all">
          <Plus size={18} /> Novo Servidor
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="Buscar servidor, usuário ou proprietário..." />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm appearance-none cursor-pointer">
                <option value="">Todos tipos</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button onClick={() => setViewMode('card')} className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`} title="Cards">
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`} title="Tabela">
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 mt-8 mb-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {editing ? 'Editar Servidor' : 'Novo Servidor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Servidor *</label>
                  <input type="text" value={formData.server_name} onChange={e => setFormData({...formData, server_name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                  <select value={formData.server_type} onChange={e => setFormData({...formData, server_type: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none">
                    <option value="Windows Server">Windows Server</option>
                    <option value="Linux">Linux</option>
                    <option value="Ubuntu">Ubuntu</option>
                    <option value="Debian">Debian</option>
                    <option value="CentOS">CentOS</option>
                    <option value="Docker">Docker</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuário *</label>
                  <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha *</label>
                  <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proprietário</label>
                <input type="text" value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Nome do responsável" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-y"
                  placeholder="IP, porta, domínio, informações adicionais..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all">
                  {editing ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all hover:bg-gray-200 dark:hover:bg-gray-700">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('server_name')}>
                    <div className="flex items-center gap-1">Servidor <SortIcon field="server_name" /></div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('username')}>
                    <div className="flex items-center gap-1">Usuário <SortIcon field="username" /></div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Senha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('server_type')}>
                    <div className="flex items-center gap-1">Tipo <SortIcon field="server_type" /></div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('owner_name')}>
                    <div className="flex items-center gap-1">Proprietário <SortIcon field="owner_name" /></div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Obs</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(account => {
                  const showPwd = visiblePasswords[account.id]
                  return (
                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Server size={14} className="text-emerald-500 shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white">{account.server_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{account.username}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                            {showPwd ? dec(account.password_enc) : '••••••••••••'}
                          </span>
                          <button onClick={() => setVisiblePasswords({...visiblePasswords, [account.id]: !showPwd})}
                            className="p-1 text-gray-400 hover:text-primary transition-all">
                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button onClick={() => copyToClipboard(dec(account.password_enc))}
                            className="p-1 text-gray-400 hover:text-primary transition-all">
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {account.server_type || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{account.owner_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-xs max-w-[150px] truncate">{account.notes || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => editAccount(account)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary transition-all" title="Editar">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(account.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-danger transition-all" title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Nenhum servidor encontrado</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(account => {
            const showPwd = visiblePasswords[account.id]
            return (
              <div key={account.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <Monitor size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{account.server_name}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Server size={12} />
                          {account.server_type || 'Não informado'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => editAccount(account)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary transition-all" title="Editar">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(account.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-danger transition-all" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Key size={14} />
                      <span className="font-semibold">Usuário:</span>
                      <span className="font-mono text-xs">{account.username}</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Key size={14} />
                        <span className="font-mono text-xs">
                          {showPwd ? dec(account.password_enc) : '••••••••••••'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setVisiblePasswords({...visiblePasswords, [account.id]: !showPwd})}
                          className="p-1 text-gray-400 hover:text-primary transition-all" title={showPwd ? 'Ocultar' : 'Mostrar'}>
                          {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => copyToClipboard(dec(account.password_enc))}
                          className="p-1 text-gray-400 hover:text-primary transition-all" title="Copiar senha">
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    {account.owner_name && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Proprietário:</span> {account.owner_name}
                      </p>
                    )}
                    {account.notes && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs italic">{account.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              Nenhum servidor cadastrado
            </div>
          )}
        </div>
      )}
    </div>
  )
}
