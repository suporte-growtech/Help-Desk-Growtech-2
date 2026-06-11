import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Ticket, Clock, CheckCircle, AlertTriangle, Plus, BarChart3 } from 'lucide-react'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PriorityBadge } from '../../components/ui/PriorityBadge'
import { Loading } from '../../components/ui/Loading'

interface UserTicket {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
  sla_deadline: string
}

export function UserDashboard() {
  const { profile } = useAuth()
  const [tickets, setTickets] = useState<UserTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 })

  useEffect(() => {
    if (profile) loadTickets()
  }, [profile])

  async function loadTickets() {
    try {
      const { data } = await supabase
        .from('tickets')
        .select('id, title, status, priority, created_at, sla_deadline')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false })

      if (data) {
        setTickets(data)
        setStats({
          total: data.length,
          open: data.filter(t => t.status === 'open').length,
          inProgress: data.filter(t => t.status === 'in_progress').length,
          resolved: data.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  const slaAlerts = tickets.filter(t => {
    if (t.status === 'resolved' || t.status === 'closed') return false
    return new Date(t.sla_deadline) < new Date()
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Olá, {profile?.name}!</h2>
          <p className="text-gray-500 dark:text-gray-400">Bem-vindo ao Help Desk GrowTech</p>
        </div>
        <Link to="/user/new-ticket" className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all">
          <Plus size={18} />
          Novo Chamado
        </Link>
      </div>

      {slaAlerts.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium">
          <AlertTriangle size={18} />
          {slaAlerts.length} chamado(s) com SLA próximo do vencimento
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Ticket, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Abertos', value: stats.open, icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
          { label: 'Em Andamento', value: stats.inProgress, icon: AlertTriangle, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
          { label: 'Resolvidos', value: stats.resolved, icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className={`p-3 rounded-lg ${card.color} inline-flex mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meus Chamados Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="p-4 font-medium">Título</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Prioridade</th>
                <th className="p-4 font-medium">SLA</th>
                <th className="p-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 5).map(ticket => {
                const slaExpired = new Date(ticket.sla_deadline) < new Date() && ticket.status !== 'resolved' && ticket.status !== 'closed'
                return (
                  <tr key={ticket.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                    <td className="p-4">
                      <Link to={`/user/my-tickets`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary">
                        {ticket.title}
                      </Link>
                    </td>
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
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum chamado ainda. <Link to="/user/new-ticket" className="text-primary hover:underline">Abra seu primeiro chamado</Link>
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
