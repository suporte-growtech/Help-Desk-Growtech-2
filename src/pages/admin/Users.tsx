import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loading } from '../../components/ui/Loading'
import { Plus, Search, Edit, Trash2, User, Shield, UserCog, Key, Eye, EyeOff, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  department: string
  city: string
  status: string
  created_at: string
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetUserName, setResetUserName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    department: '',
    city: '',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setUsers(data as UserProfile[])
    } catch (err) {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  function generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$'
    let pwd = ''
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pwd
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({ name: formData.name, role: formData.role, department: formData.department, city: formData.city, email: formData.email })
          .eq('id', editingUser.id)
        if (error) throw error
        toast.success('Usuário atualizado!')
        setShowForm(false)
        setEditingUser(null)
      } else {
        const pwd = formData.password || generatePassword()
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: pwd,
        })
        if (authError) throw authError
        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').insert([{
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department: formData.department,
            city: formData.city,
            status: 'active',
          }])
          if (profileError) throw profileError
        }
        setGeneratedPassword(pwd)
        toast.success('Usuário criado!')
      }
      resetForm()
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza? O usuário será desativado.')) return
    try {
      await supabase.from('profiles').update({ status: 'inactive' }).eq('id', id)
      toast.success('Usuário desativado!')
      loadUsers()
    } catch {
      toast.error('Erro ao desativar')
    }
  }

  async function handleToggleStatus(user: UserProfile) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    try {
      await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id)
      toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}!`)
      loadUsers()
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  function openResetPassword(user: UserProfile) {
    setResetUserId(user.id)
    setResetUserName(user.name)
    setNewPassword('')
    setShowNewPassword(false)
    setShowResetModal(true)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetUserId || !newPassword.trim()) return
    setResetting(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: resetUserId, new_password: newPassword.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao redefinir senha')
      }

      toast.success(`Senha de ${resetUserName} redefinida!`)
      setShowResetModal(false)
      setResetUserId(null)
      setNewPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao redefinir senha')
    } finally {
      setResetting(false)
    }
  }

  function editUser(u: UserProfile) {
    setFormData({
      name: u.name,
      email: u.email || '',
      password: '',
      role: u.role,
      department: u.department || '',
      city: u.city || '',
    })
    setEditingUser(u)
    setGeneratedPassword('')
    setShowForm(true)
  }

  function resetForm() {
    setFormData({ name: '', email: '', password: '', role: 'user', department: '', city: '' })
    setEditingUser(null)
    setGeneratedPassword('')
    setShowPassword(false)
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total: {users.length} usuários</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all">
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
          placeholder="Buscar por nome ou email..." />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 mt-8 mb-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>

            {generatedPassword && (
              <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                <p className="text-sm font-medium mb-1">Usuário criado! Guarde a senha:</p>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-green-300 dark:border-green-700">
                  <code className="text-sm font-mono flex-1">{generatedPassword}</code>
                  <button onClick={() => { navigator.clipboard.writeText(generatedPassword); toast.success('Copiado!') }}
                    className="text-green-600 hover:text-green-800 text-xs font-medium">Copiar</button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" required={!editingUser} />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha {formData.password && '(deixe vazio para gerar automaticamente)'}
                  </label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Deixe vazio para gerar" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Função</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as 'admin' | 'user'})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none">
                    <option value="user">Usuário</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departamento</label>
                  <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all">
                  {editingUser ? 'Atualizar' : 'Criar Usuário'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingUser(null) }}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all hover:bg-gray-200 dark:hover:bg-gray-700">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Função</th>
                <th className="p-3 font-medium">Departamento</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User size={14} className="text-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{u.email || '-'}</td>
                  <td className="p-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                      <div className="flex items-center gap-1">
                        {u.role === 'admin' ? <Shield size={12} /> : <UserCog size={12} />}
                        {u.role === 'admin' ? 'Admin' : 'Usuário'}
                      </div>
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{u.department || '-'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {u.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => editUser(u)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary transition-all" title="Editar">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleToggleStatus(u)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-warning transition-all" title={u.status === 'active' ? 'Desativar' : 'Ativar'}>
                        <UserCog size={14} />
                      </button>
                      <button onClick={() => openResetPassword(u)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary transition-all" title="Redefinir senha">
                        <Key size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowResetModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 mt-20 mb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Redefinir Senha</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Usuário: {resetUserName}</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova Senha *</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Digite a nova senha"
                    required minLength={6} />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Mínimo de 6 caracteres</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={!newPassword.trim() || resetting}
                  className="flex-1 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg font-medium transition-all">
                  {resetting ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>
                <button type="button" onClick={() => setShowResetModal(false)}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all hover:bg-gray-200 dark:hover:bg-gray-700">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
