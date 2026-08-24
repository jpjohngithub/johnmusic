// ============================================================
// SIDEBAR — Navegação Principal + Playlists Multiplataforma
// 100% Sem Necessidade de Login
// ============================================================

import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home,
  Search,
  Music2,
  Youtube,
  Library,
  ChevronDown,
  ChevronRight,
  Plus,
  Disc3,
  Layers,
} from 'lucide-react'
import { PlaylistModal } from '@/components/playlist/PlaylistModal'
import { useLibraryStore } from '@/store/libraryStore'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/search', icon: Search, label: 'Buscar' },
  { to: '/spotify', icon: Music2, label: 'Spotify' },
  { to: '/youtube', icon: Youtube, label: 'YouTube' },
  { to: '/tiktok', icon: Disc3, label: 'TikTok' },
]

export function Sidebar({ collapsed = false }: SidebarProps) {
  const [showPlaylists, setShowPlaylists] = useState(true)
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false)
  const { customPlaylists } = useLibraryStore()

  return (
    <>
      <aside
        className={cn(
          'flex flex-col h-full bg-black border-r border-white/5 transition-all duration-300 select-none z-30',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3.5 px-4 py-5 border-b border-white/5">
          <img
            src="/logo.png"
            alt="JohnMusic"
            className="w-12 h-12 rounded-2xl object-contain flex-shrink-0 shadow-xl shadow-purple-500/10 border border-white/10"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-black text-white text-lg tracking-tight leading-tight">
                JohnMusic
              </span>
              <span className="text-[10px] text-spotify-green font-bold tracking-widest uppercase">
                2.0 Universal
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-2 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150',
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Action Button: Criar ou Importar Playlist */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-spotify-green/20 to-purple-600/20 hover:from-spotify-green/30 hover:to-purple-600/30 border border-spotify-green/30 text-spotify-green font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <Plus size={15} />
              <span>Criar / Importar Playlist</span>
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="mx-3 border-t border-white/5" />

        {/* Playlists Section */}
        {!collapsed && (
          <div className="flex-1 overflow-hidden flex flex-col mt-2">
            <div className="px-4 py-2 flex items-center justify-between">
              <button
                onClick={() => setShowPlaylists((v) => !v)}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors flex-1"
              >
                <Library size={14} />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Suas Playlists ({customPlaylists.length})
                </span>
                {showPlaylists ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            {showPlaylists && (
              <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-hide">
                {customPlaylists.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <p className="text-white/30 text-[11px]">
                      Nenhuma playlist criada ainda.
                    </p>
                    <p className="text-white/20 text-[10px] mt-1">
                      Cole um link ou clique no botão acima para criar.
                    </p>
                  </div>
                ) : (
                  customPlaylists.map((playlist) => (
                    <NavLink
                      key={playlist.id}
                      to={`/playlist/${playlist.id}`}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all group',
                          isActive
                            ? 'bg-white/10 text-white font-bold'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        )
                      }
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                        {playlist.coverUrl ? (
                          <img
                            src={playlist.coverUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Layers size={14} className="text-spotify-green" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate leading-snug">{playlist.name}</p>
                        <p className="text-[10px] text-white/40 truncate">
                          {playlist.items.length} faixas
                        </p>
                      </div>
                    </NavLink>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Modal Criar/Importar Playlist */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
      />
    </>
  )
}
