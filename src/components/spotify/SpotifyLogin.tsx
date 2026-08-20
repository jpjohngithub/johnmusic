import { Music2, LogIn, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SpotifyUser } from '@/types'

interface SpotifyLoginProps {
  isAuthenticated: boolean
  user: SpotifyUser | null
  isPremium: boolean
  isLoading: boolean
  onLogin: () => void
  onLogout: () => void
  className?: string
}

export function SpotifyLogin({
  isAuthenticated,
  user,
  isPremium,
  isLoading,
  onLogin,
  onLogout,
  className,
}: SpotifyLoginProps) {
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-white/40', className)}>
        <div className="w-4 h-4 border-2 border-white/20 border-t-spotify-green rounded-full animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className={cn('flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full', className)}>
        {user.images?.[0] ? (
          <img
            src={user.images[0].url}
            alt={user.display_name}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-spotify-green/20 flex items-center justify-center">
            <User size={14} className="text-spotify-green" />
          </div>
        )}
        <div className="flex flex-col min-w-0 pr-1">
          <p className="text-white text-xs font-semibold truncate max-w-[120px]">{user.display_name}</p>
          <p className={cn('text-[10px] font-medium', isPremium ? 'text-spotify-green' : 'text-amber-400')}>
            {isPremium ? '★ Premium' : 'Conta Free'}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all ml-1"
          title="Sair do Spotify"
        >
          <LogOut size={14} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onLogin}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full bg-spotify-green text-black font-bold text-xs uppercase tracking-wider',
        'hover:bg-green-400 active:scale-95 transition-all duration-150 shadow-md shadow-spotify-green/20',
        className
      )}
    >
      <Music2 size={16} />
      <span>Conectar Spotify</span>
    </button>
  )
}
