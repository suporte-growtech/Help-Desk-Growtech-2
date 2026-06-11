import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Loading } from '../../components/ui/Loading'
import { Search, Send, MessageSquare, Check, CheckCheck, User, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  name: string
  email: string
}

interface Message {
  id: string
  user_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  profile?: Profile
}

interface ChatUser {
  id: string
  name: string
  email: string
  last_message?: string
  last_time?: string
  unread: number
}

export function AdminChat() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<ChatUser[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [search, setSearch] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showMobileList, setShowMobileList] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadChatUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id)
      setShowMobileList(false)
    }
  }, [selectedUser])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedUser) return
    const sub = supabase
      .channel('admin-messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${selectedUser.id}` },
        (payload: any) => {
          const msg = payload.new as Message
          setMessages(prev => [...prev, msg])
          markAsRead(selectedUser.id)
          loadChatUsers()
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [selectedUser])

  async function loadChatUsers() {
    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, profile:user_id(id, name, email)')
        .order('created_at', { ascending: false })
      if (!msgs) return

      const map = new Map<string, ChatUser>()
      for (const m of msgs as any[]) {
        const uid = m.user_id
        if (!map.has(uid)) {
          const p = m.profile
          map.set(uid, {
            id: uid,
            name: p?.name || 'Usuário',
            email: p?.email || '',
            last_message: m.content,
            last_time: m.created_at,
            unread: !m.is_read && m.sender_id !== profile?.id ? 1 : 0,
          })
        } else {
          const entry = map.get(uid)!
          if (!m.is_read && m.sender_id !== profile?.id) entry.unread++
        }
      }

      setUsers(Array.from(map.values()))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(userId: string) {
    setLoadingMsgs(true)
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (data) setMessages(data as Message[])
      markAsRead(userId)
    } catch {
      toast.error('Erro ao carregar mensagens')
    } finally {
      setLoadingMsgs(false)
    }
  }

  async function markAsRead(userId: string) {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender_id', userId)
      .eq('is_read', false)
  }

  async function sendMessage() {
    if (!text.trim() || !selectedUser || !profile) return
    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert([{
        user_id: selectedUser.id,
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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Loading />

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Chat com Usuários</h2>
      <div className="flex-1 flex bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden min-h-0">
        <div className={`${showMobileList ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-96 flex-col border-r border-gray-200 dark:border-gray-800`}>
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="Buscar usuário..." />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map(u => (
              <button key={u.id} onClick={() => setSelectedUser({ id: u.id, name: u.name, email: u.email })}
                className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedUser?.id === u.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${u.unread > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-900 dark:text-white'}`}>
                        {u.name}
                      </span>
                      {u.unread > 0 && (
                        <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                          {u.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{u.last_message}</p>
                  </div>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                Nenhuma conversa encontrada
              </div>
            )}
          </div>
        </div>

        <div className={`${!showMobileList ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-h-0`}>
          {selectedUser ? (
            <>
              <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                <button onClick={() => { setSelectedUser(null); setShowMobileList(true) }}
                  className="md:hidden p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                  <ChevronLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="text-center py-8"><Loading /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <MessageSquare size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                    <p className="text-xs mt-1">Envie a primeira mensagem para iniciar o chat</p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMine = m.sender_id === profile?.id
                    return (
                      <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMine
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                        }`}>
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Selecione um usuário para conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
