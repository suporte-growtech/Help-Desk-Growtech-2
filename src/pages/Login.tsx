import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { HardDrive, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        if (data?.role === 'admin') navigate('/admin', { replace: true })
        else if (data?.role === 'user') navigate('/user', { replace: true })
      }
    })
  }, [])

  function goTo(role: string) {
    if (role === 'admin') navigate('/admin', { replace: true })
    else navigate('/user', { replace: true })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('profiles').insert([
            { id: user.id, name, email, role: 'user', department: '', city: '' }
          ])
        }
        alert('Conta criada! Verifique seu email.')
        setIsRegister(false)
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não encontrado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') navigate('/admin', { replace: true })
      else if (profile?.role === 'user') navigate('/user', { replace: true })
      else throw new Error('Perfil sem função definida')
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao autenticar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HardDrive className="text-primary" size={40} />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GrowTech</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Help Desk - Suporte Técnico</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {isRegister ? 'Criar Conta' : 'Entrar'}
            </h2>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Seu nome" required />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    placeholder="seu@email.com" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Sua senha" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {isRegister ? 'Criar Conta' : 'Entrar'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-primary hover:text-primary-dark transition-all">
                {isRegister ? 'Já tem conta? Entre' : 'Não tem conta? Cadastre-se'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
