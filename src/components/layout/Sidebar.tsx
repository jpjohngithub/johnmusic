// ============================================================
// SIDEBAR — Navegação + Playlists Customizadas & Spotify
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
  Disc3,
  Sparkles,
  Plus,
  ListMusic,
  LogOut,
} from 'lucide-react'
import { CURATED_PUBLIC_SPOTIFY } from '@/api/spotifyUrlService'
import { PlaylistModal } from '@/components/playlist/PlaylistModal'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth'
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
  const { customPlaylists, spotifyItems, youtubeVideos, tiktokVideos } = useLibraryStore()
  const { playSpotifySavedItem } = usePlayerStore()
  const { isAuthenticated, isLoading: authLoading, user, login, logout } = useSpotifyAuth()

  return (
    <>
      <aside
        className={cn(
          'flex flex-col h-full bg-black border-r border-white/5 transition-all duration-300 select-none z-30',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-spotify-green via-emerald-400 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-spotify-green/20">
            <Music2 size={18} className="text-black font-bold" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base tracking-tight leading-tight">
                JohnMusic
              </span>
              <span className="text-[10px] text-white/40 font-medium tracking-widest uppercase">
                2.0 Universal
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-2 py-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </div>

              {!collapsed && to === '/spotify' && spotifyItems.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green font-semibold">
                  {spotifyItems.length}
                </span>
              )}

              {!collapsed && to === '/youtube' && youtubeVideos.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-youtube-red/20 text-youtube-red font-semibold">
                  {youtubeVideos.length}
                </span>
              )}

              {!collapsed && to === '/tiktok' && tiktokVideos.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-tiktok-pink/20 text-tiktok-pink font-semibold">
                  {tiktokVideos.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Create / Import Playlist Button */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-spotify-green/20 to-emerald-500/20 hover:from-spotify-green/30 hover:to-emerald-500/30 border border-spotify-green/30 text-spotify-green font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <Plus size={15} />
              <span>Criar / Importar Playlist</span>
            </button>
          </div>
        )}

        {/* Spotify Login / User */}
        {!collapsed && (
          <div className="px-3 pb-3">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                title="Sair do Spotify"
              >
                {user?.images?.[0]?.url ? (
                  <img src={user.images[0].url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-spotify-green flex items-center justify-center">
                    <Music2 size={12} className="text-black" />
                  </div>
                )}
                <span className="flex-1 text-left text-xs font-semibold text-white truncate">
                  {user?.display_name || 'Spotify'}
                </span>
                <LogOut size={13} className="text-white/40" />
              </button>
            ) : (
              <button
                onClick={() => login()}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-spotify-green hover:bg-green-400 disabled:opacity-50 text-black font-bold text-xs transition-all active:scale-95 shadow-sm"
              >
                <Music2 size={15} />
                <span>{authLoading ? 'Verificando...' : 'Entrar com Spotify'}</span>
              </button>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="mx-3 border-t border-white/5" />

        {/* Playlists Section */}
        {!collapsed && (
          <div className="flex-1 overflow-hidden flex flex-col mt-2">
            <div className="px-4 py-2">
              <button
                onClick={() => setShowPlaylists((v) => !v)}
                className="flex items-center justify-between w-full text-white/50 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Library size={14} />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Sua Biblioteca
                  </span>
                </div>
                {showPlaylists ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            {showPlaylists && (
              <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 scrollbar-thin">
                {/* Custom / Imported Playlists */}
                {customPlaylists.length > 0 && (
                  <>
                    <div className="pt-2 pb-1 px-3">
                      <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                        Playlists Criadas / Importadas
                      </span>
                    </div>

                    {customPlaylists.map((playlist) => (
                      <NavLink
                        key={playlist.id}
                        to={`/playlist/${playlist.id}`}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all',
                            isActive
                              ? 'bg-white/10 text-white'
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          )
                        }
                      >
                        {playlist.coverUrl ? (
                          <img
                            src={playlist.coverUrl}
                            alt={playlist.name}
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-spotify-green/20 text-spotify-green flex items-center justify-center flex-shrink-0">
                            <ListMusic size={14} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white">{playlist.name}</p>
                          <p className="truncate text-[10px] text-white/40">
                            {playlist.items.length} itens
                          </p>
                        </div>
                      </NavLink>
                    ))}
                  </>
                )}

                {/* Curated Public Playlists */}
                <div className="pt-3 pb-1 px-3">
                  <span className="text-[10px] uppercase font-bold text-spotify-green tracking-wider flex items-center gap-1">
                    <Sparkles size={10} /> Destaques Spotify
                  </span>
                </div>

                {CURATED_PUBLIC_SPOTIFY.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => playSpotifySavedItem(item)}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-left text-white/60 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-spotify-green/20 text-spotify-green flex items-center justify-center flex-shrink-0">
                        <Music2 size={12} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">{item.title}</p>
                      <p className="truncate text-[10px] text-white/40">{item.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Playlist Creation / Import Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
      />
    </>
  )
}
