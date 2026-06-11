import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Send, MessageSquare, Check, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'

interface ChatMessage {
  id: string
  ticket_id: string
  user_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface ChatPanelProps {
  ticketId: string
  ticketUserId: string
}

export function ChatPanel({ ticketId, ticketUserId }: ChatPanelProps) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    loadMessages()
    subscribe()
    const poll = setInterval(loadMessages, 3000)
    return () => {
      clearInterval(poll)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [ticketId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function subscribe() {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
    const channel = supabase
      .channel(`chat-${ticketId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `ticket_id=eq.${ticketId}` },
        (payload: any) => {
          const existing = messages.find(m => m.id === payload.new.id)
          if (!existing) {
            setMessages(prev => [...prev, payload.new as ChatMessage])
          }
          markAsRead()
        }
      )
      .subscribe()
    channelRef.current = channel
  }

  async function loadMessages() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      if (error) throw error
      setMessages((data || []) as ChatMessage[])
      markAsRead()
    } catch (err: any) {
      console.error('Chat load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead() {
    if (!profile) return
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .eq('sender_id', ticketUserId)
        .eq('is_read', false)
    } catch {
      // silent
    }
  }

  async function sendMessage() {
    if (!text.trim() || !profile) return
    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert([{
        ticket_id: ticketId,
        user_id: ticketUserId,
        sender_id: profile.id,
        content: text.trim(),
      }])
      if (error) throw error
      setText('')
    } catch (err: any) {
      console.error('Chat send error:', err)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <MessageSquare size={18} className="text-primary" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Chat do Chamado</h3>
        {!loading && <span className="text-xs text-gray-400 ml-auto">{messages.length} msg</span>}
      </div>

      <div className="h-72 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-400">Carregando...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs mt-1">Envie a primeira mensagem para conversar</p>
          </div>
        ) : (
          messages.map(m => {
            const isMine = m.sender_id === profile?.id
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMine
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                }`}>
                  {!isMine && (
                    <p className="text-[10px] font-semibold text-primary dark:text-primary mb-1">Usuário</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && (
                      m.is_read
                        ? <CheckCheck size={12} className="text-white/70" />
                        : <Check size={12} className="text-white/70" />
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm resize-none"
            placeholder="Digite sua mensagem..." />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg transition-all shrink-0">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
