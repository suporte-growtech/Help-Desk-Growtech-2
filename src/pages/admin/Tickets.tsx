import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PriorityBadge } from '../../components/ui/PriorityBadge'
import { Loading } from '../../components/ui/Loading'
import { Search, Filter, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Ticket {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
  sla_deadline: string
  profiles: { name: string }
}

export function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadTickets()
  }, [])

  async function loadTickets() {
    try {
      let query = supabase
        .from('tickets')
        .select('id, title, status, priority, created_at, sla_deadline, profiles(name)')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      if (data) setTickets(data as unknown as Ticket[])
    } catch (err) {
      toast.error('Erro ao carregar chamados')
    } finally {
      setLoading(false)
    }
  }

  const filtered = tickets.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Chamados</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="Buscar chamados..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); loadTickets() }}
          className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="all">Todos os status</option>
          <option value="open">Aberto</option>
          <option value="in_progress">Em Andamento</option>
          <option value="resolved">Resolvido</option>
          <option value="closed">Fechado</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 font-medium">Título</th>
                <th className="p-4 font-medium">Usuário</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Prioridade</th>
                <th className="p-4 font-medium">SLA</th>
                <th className="p-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ticket => {
                const slaDate = new Date(ticket.sla_deadline)
                const now = new Date()
                const slaExpired = slaDate < now && ticket.status !== 'resolved' && ticket.status !== 'closed'

                return (
                  <tr key={ticket.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                    <td className="p-4">
                      <Link to={`/admin/tickets/${ticket.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary">
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{ticket.profiles?.name}</td>
                    <td className="p-4"><StatusBadge status={ticket.status} /></td>
                    <td className="p-4"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="p-4">
                      <span className={`text-xs font-medium ${slaExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {slaExpired ? 'Vencido' : new Date(ticket.sla_deadline).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum chamado encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
