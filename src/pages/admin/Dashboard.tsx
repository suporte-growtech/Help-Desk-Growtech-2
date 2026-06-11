import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Ticket, Monitor, CheckCircle, Clock, AlertTriangle, BarChart3 } from 'lucide-react'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PriorityBadge } from '../../components/ui/PriorityBadge'
import { Loading } from '../../components/ui/Loading'
import { Link } from 'react-router-dom'

interface Stats {
  total: number
  open: number
  inProgress: number
  resolved: number
  notebooks: number
}

interface RecentTicket {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
  profiles: { name: string }
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, inProgress: 0, resolved: 0, notebooks: 0 })
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [slaAlerts, setSlaAlerts] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { count: total } = await supabase.from('tickets').select('*', { count: 'exact', head: true })
      const { count: open } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
      const { count: inProgress } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')
      const { count: resolved } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved')
      const { count: notebooks } = await supabase.from('notebooks').select('*', { count: 'exact', head: true })

      setStats({
        total: total || 0,
        open: open || 0,
        inProgress: inProgress || 0,
        resolved: resolved || 0,
        notebooks: notebooks || 0,
      })

      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, title, status, priority, created_at, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (tickets) setRecentTickets(tickets as unknown as RecentTicket[])

      const now = new Date().toISOString()
      const { count: slaBreach } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("resolved","closed")')
        .lt('sla_deadline', now)

      setSlaAlerts(slaBreach || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Chamados', value: stats.total, icon: Ticket, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Abertos', value: stats.open, icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Em Andamento', value: stats.inProgress, icon: AlertTriangle, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Resolvidos', value: stats.resolved, icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { label: 'Notebooks', value: stats.notebooks, icon: Monitor, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  ]

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        {slaAlerts > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium">
            <AlertTriangle size={18} />
            {slaAlerts} chamado(s) com SLA vencido
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chamados Recentes</h3>
            <Link to="/admin/tickets" className="text-sm text-primary hover:text-primary-dark transition-all">
              Ver todos
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="p-4 font-medium">Título</th>
                <th className="p-4 font-medium">Usuário</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Prioridade</th>
                <th className="p-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map(ticket => (
                <tr key={ticket.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                  <td className="p-4">
                    <Link to={`/admin/tickets/${ticket.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary">
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{ticket.profiles?.name}</td>
                  <td className="p-4"><StatusBadge status={ticket.status} /></td>
                  <td className="p-4"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {recentTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
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
