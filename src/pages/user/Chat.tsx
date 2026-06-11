import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Loading } from '../../components/ui/Loading'
import { Send, MessageSquare, HeadphonesIcon, Check, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'

interface Message {
  id: string
  user_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export function UserChat() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile) {
      loadMessages()
      subscribe()
    }
  }, [profile])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function subscribe() {
    if (!profile) return
    const sub = supabase
      .channel('user-messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${profile.id}` },
        (payload: any) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }

  async function loadMessages() {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })
      if (data) setMessages(data as Message[])
    } catch {
      toast.error('Erro ao carregar mensagens')
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!text.trim() || !profile) return
    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert([{
        user_id: profile.id,
        sender_id: profile.id,
        content: text.trim(),
      }])
      if (error) throw error
      setText('')
    } catch {
      toast.error('Erro ao enviar')
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

  if (loading) return <Loading />

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <HeadphonesIcon size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Suporte</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Converse com a equipe de suporte</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs mt-1">Envie uma mensagem para iniciar o atendimento</p>
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
                      <p className="text-[10px] font-semibold text-primary dark:text-primary mb-1">Suporte</p>
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

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div className="flex gap-2">
            <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
              rows={1}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm resize-none"
              placeholder="Digite sua mensagem..." />
            <button onClick={sendMessage} disabled={!text.trim() || sending}
              className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg transition-all shrink-0">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
