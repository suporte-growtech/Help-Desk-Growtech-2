import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PriorityBadge } from '../../components/ui/PriorityBadge'
import { ZoomImage } from '../../components/ui/ZoomImage'
import { Loading } from '../../components/ui/Loading'
import { Search, Clock, MessageCircle, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatPanel } from '../../components/ChatPanel'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  sla_deadline: string
  ticket_attachments: { file_url: string; file_name: string; file_type: string }[]
  ticket_comments: { id: string; content: string; created_at: string; profiles: { name: string } }[]
}

export function MyTickets() {
  const { profile } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (profile) loadTickets()
  }, [profile])

  async function loadTickets() {
    try {
      const { data } = await supabase
        .from('tickets')
        .select('*, ticket_attachments(*), ticket_comments(*, profiles(name))')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false })

      if (data) setTickets(data as unknown as Ticket[])
    } catch (err) {
      console.error(err)
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
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Chamados</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Buscar chamados..."
        />
      </div>

      <div className="space-y-4">
        {filtered.map(ticket => {
          const slaExpired = new Date(ticket.sla_deadline) < new Date() && ticket.status !== 'resolved' && ticket.status !== 'closed'
          const isExpanded = expandedId === ticket.id

          return (
            <div key={ticket.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.title}</h3>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className={`flex items-center gap-1 ${slaExpired ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                    <Clock size={12} />
                    SLA: {slaExpired ? 'Vencido' : new Date(ticket.sla_deadline).toLocaleDateString('pt-BR')}
                  </span>
                  {ticket.ticket_comments && (
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      {ticket.ticket_comments.length} comentário(s)
                    </span>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-200 dark:border-gray-800 pt-4 space-y-4">
                  {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        const { error } = await supabase.from('tickets').update({ status: 'open' }).eq('id', ticket.id)
                        if (error) toast.error('Erro ao reabrir chamado')
                        else { toast.success('Chamado reaberto!'); loadTickets() }
                      }}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-all"
                    >
                      <RotateCcw size={14} /> Reabrir Chamado
                    </button>
                  )}

                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>

                  {ticket.ticket_attachments && ticket.ticket_attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Anexos:</h4>
                      <div className="flex flex-wrap gap-2">
                        {ticket.ticket_attachments.map((att, i) => (
                          att.file_type.startsWith('image/') ? (
                            <ZoomImage key={i} src={att.file_url} alt={att.file_name} className="w-20 h-20 object-cover rounded-lg" />
                          ) : (
                            <a key={i} href={att.file_url} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline">
                              {att.file_name}
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {ticket.ticket_comments && ticket.ticket_comments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comentários:</h4>
                      <div className="space-y-2">
                        {ticket.ticket_comments.map(comment => (
                          <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-900 dark:text-white">{comment.profiles?.name}</span>
                              <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <ChatPanel ticketId={ticket.id} ticketUserId={profile?.id || ''} />
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Nenhum chamado encontrado
          </div>
        )}
      </div>
    </div>
  )
}
