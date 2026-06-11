import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PriorityBadge } from '../../components/ui/PriorityBadge'
import { ZoomImage } from '../../components/ui/ZoomImage'
import { Loading } from '../../components/ui/Loading'
import { ArrowLeft, Send, Paperclip, Download, Clock, User, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatPanel } from '../../components/ChatPanel'

interface TicketDetail {
  id: string
  user_id: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  sla_deadline: string
  profiles: { name: string }
  notebooks?: { patrimonio_number: string; brand: string; model: string }
}

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: { name: string }
}

interface Attachment {
  id: string
  file_name: string
  file_url: string
  file_type: string
}

export function AdminTicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) loadTicket()
  }, [id])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function loadTicket() {
    try {
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('*, profiles(name), notebooks(patrimonio_number, brand, model)')
        .eq('id', id)
        .single()
      if (ticketData) setTicket(ticketData as unknown as TicketDetail)

      const { data: commentsData } = await supabase
        .from('ticket_comments')
        .select('*, profiles(name)')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })
      if (commentsData) setComments(commentsData as unknown as Comment[])

      const { data: attachmentsData } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', id)
      if (attachmentsData) setAttachments(attachmentsData as unknown as Attachment[])
    } catch (err) {
      toast.error('Erro ao carregar chamado')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    const { error } = await supabase.from('ticket_comments').insert([
      { ticket_id: id, content: newComment }
    ])

    if (error) {
      toast.error('Erro ao adicionar comentário')
    } else {
      setNewComment('')
      loadTicket()
    }
  }

  async function handleUpdateStatus(status: string) {
    const { error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', id)

    if (error) toast.error('Erro ao atualizar status')
    else {
      toast.success('Status atualizado!')
      loadTicket()
    }
  }

  async function handleUpdatePriority(priority: string) {
    const { error } = await supabase
      .from('tickets')
      .update({ priority })
      .eq('id', id)

    if (error) toast.error('Erro ao atualizar prioridade')
    else {
      toast.success('Prioridade atualizada!')
      loadTicket()
    }
  }

  if (loading) return <Loading />
  if (!ticket) return <div className="text-center py-12 text-gray-500">Chamado não encontrado</div>

  return (
    <div className="space-y-6">
      <Link to="/admin/tickets" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-all">
        <ArrowLeft size={16} />
        Voltar para chamados
      </Link>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ticket.title}</h2>
            <div className="flex flex-wrap gap-2">
              {ticket.status === 'open' && (
                <button onClick={() => handleUpdateStatus('in_progress')} className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-all">
                  Iniciar
                </button>
              )}
              {ticket.status === 'in_progress' && (
                <button onClick={() => handleUpdateStatus('resolved')} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all">
                  Resolver
                </button>
              )}
              {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                <button onClick={() => handleUpdateStatus('open')} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-all flex items-center gap-1">
                  <RotateCcw size={14} /> Reabrir
                </button>
              )}
              {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                <button onClick={() => handleUpdateStatus('closed')} className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-all">
                  Fechar
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={ticket.status} />
            <select
              value={ticket.priority}
              onChange={e => handleUpdatePriority(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
            {ticket.notebooks && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                {ticket.notebooks.brand} - {ticket.notebooks.patrimonio_number}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <User size={14} />
              {ticket.profiles?.name}
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              {new Date(ticket.created_at).toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              SLA: {new Date(ticket.sla_deadline).toLocaleDateString('pt-BR')}
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>

          {attachments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Paperclip size={14} /> Anexos
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {attachments.map(att => (
                  att.file_type.startsWith('image/') ? (
                    <ZoomImage key={att.id} src={att.file_url} alt={att.file_name} className="w-full h-24 object-cover rounded-lg" />
                  ) : (
                    <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-all">
                      <Download size={16} />
                      {att.file_name}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comentários</h3>
        </div>
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{comment.profiles?.name}</span>
                  <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
        <form onSubmit={handleAddComment} className="p-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Adicionar comentário..."
            />
            <button type="submit" className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      <ChatPanel ticketId={id!} ticketUserId={ticket.user_id} />
    </div>
  )
}
