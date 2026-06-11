import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface ZoomImageProps {
  src: string
  alt?: string
  className?: string
}

export function ZoomImage({ src, alt, className }: ZoomImageProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => setOpen(true)}>
        <img src={src} alt={alt || ''} className={className} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <Search className="text-white opacity-0 group-hover:opacity-100 transition-all" size={24} />
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
          >
            <X size={24} />
          </button>
          <img
            src={src}
            alt={alt || ''}
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
