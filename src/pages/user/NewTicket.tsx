import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Upload, File, X, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Notebook {
  id: string
  patrimonio_number: string
  brand: string
  model: string
}

export function NewTicket() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [notebookId, setNotebookId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadNotebooks()
  }, [])

  async function loadNotebooks() {
    const { data } = await supabase
      .from('notebooks')
      .select('id, patrimonio_number, brand, model')
      .order('patrimonio_number')
    if (data) setNotebooks(data)
  }

  function calcSla(priority: string): Date {
    const now = new Date()
    const hours = { low: 72, medium: 48, high: 24, critical: 8 }
    now.setHours(now.getHours() + (hours[priority as keyof typeof hours] || 48))
    return now
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setUploading(true)
    try {
      const sla = calcSla(priority)

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert([
          {
            user_id: user?.id,
            notebook_id: notebookId || null,
            title,
            description,
            priority,
            sla_deadline: sla.toISOString(),
            status: 'open',
          }
        ])
        .select()
        .single()

      if (error) throw error

      if (files.length > 0 && ticket) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${ticket.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(fileName)

          await supabase.from('ticket_attachments').insert([
            {
              ticket_id: ticket.id,
              file_name: file.name,
              file_url: publicUrl,
              file_type: file.type,
            }
          ])
        }
      }

      toast.success('Chamado aberto com sucesso!')
      navigate('/user/my-tickets')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir chamado')
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)])
    }
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Abrir Chamado</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="Descreva o problema em poucas palavras"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-y"
            placeholder="Descreva detalhadamente o que está acontecendo com o equipamento..."
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="low">Baixa (72h)</option>
              <option value="medium">Média (48h)</option>
              <option value="high">Alta (24h)</option>
              <option value="critical">Crítica (8h)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipamento (opcional)</label>
            <select
              value={notebookId}
              onChange={e => setNotebookId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">Selecione um notebook</option>
              {notebooks.map(n => (
                <option key={n.id} value={n.id}>
                  {n.patrimonio_number} - {n.brand} {n.model}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Anexos (imagens, documentos)</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary transition-all cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}>
            <Upload className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-sm text-gray-500 dark:text-gray-400">Clique para adicionar arquivos</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, PDF até 10MB</p>
          </div>
          <input id="file-input" type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <File size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)}KB)</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-danger transition-all">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><Loader2 size={18} className="animate-spin" /> Enviando...</>
          ) : (
            <><Send size={18} /> Abrir Chamado</>
          )}
        </button>
      </form>
    </div>
  )
}
