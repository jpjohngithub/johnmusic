// ============================================================
// MAIN CONTENT & HEADER
// ============================================================

import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Music2 } from 'lucide-react'

interface MainContentProps {
  children: ReactNode
}

export function MainContent({ children }: MainContentProps) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#181818] via-[#121212] to-black">
      {/* Top Bar Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
            title="Voltar"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
            title="Avançar"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/5 text-white/60 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
            <span className="text-white/80 font-semibold">JohnMusic 2.0</span>
          </div>
        </div>
      </header>

      {/* Main scrollable body */}
      <main className="flex-1 overflow-y-auto p-6 pb-28">
        {children}
      </main>
    </div>
  )
}
