import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Music2, Sparkles, Plus, Trash2, ExternalLink, Play } from 'lucide-react'
import { CURATED_PUBLIC_SPOTIFY } from '@/api/spotifyUrlService'
import { SpotifyInput } from '@/components/spotify/SpotifyInput'
import { SpotifyEmbedPlayer } from '@/components/spotify/SpotifyEmbedPlayer'
import { usePlayerStore } from '@/store/playerStore'
import { useLibraryStore } from '@/store/libraryStore'

export function SpotifyLibrary() {
  const { spotifySavedItem, playSpotifySavedItem } = usePlayerStore()
  const { spotifyItems, removeSpotifyItem } = useLibraryStore()

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Music2 size={34} className="text-spotify-green" />
            <span>Biblioteca Spotify</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Ouça músicas e playlists por URL ou através das coleções prontas
          </p>
        </div>
      </div>

      {/* URL Input Box */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-spotify-green/20 backdrop-blur-sm space-y-3 shadow-xl">
        <h2 className="text-white font-bold text-base flex items-center gap-2">
          <Plus size={18} className="text-spotify-green" />
          <span>Adicionar Música, Playlist ou Álbum do Spotify por Link</span>
        </h2>
        <SpotifyInput />
      </div>

      {/* Active Spotify Player Preview */}
      {spotifySavedItem && (
        <section className="p-6 rounded-3xl bg-black/80 border border-spotify-green/30 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-spotify-green font-bold text-sm">
              <Music2 size={18} />
              <span>Tocando Agora: {spotifySavedItem.title}</span>
            </div>
            <a
              href={spotifySavedItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              <span>Abrir no Spotify</span>
              <ExternalLink size={12} />
            </a>
          </div>
          <SpotifyEmbedPlayer
            uri={`spotify:${spotifySavedItem.type}:${spotifySavedItem.spotifyId}`}
            height={spotifySavedItem.type === 'track' ? 152 : 352}
          />
        </section>
      )}

      {/* Saved Spotify Items (via URL) */}
      {spotifyItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-400" />
              <span>Seus Links Salvos do Spotify ({spotifyItems.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {spotifyItems.map((item) => {
              const isPlayingItem = spotifySavedItem?.id === item.id

              return (
                <div
                  key={item.id}
                  className={`group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border flex flex-col justify-between ${
                    isPlayingItem ? 'border-spotify-green/50 bg-spotify-green/5' : 'border-white/5'
                  }`}
                >
                  <div
                    onClick={() => playSpotifySavedItem(item)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-black cursor-pointer shadow-md flex items-center justify-center"
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-spotify-green">
                        <Music2 size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                        <Play size={20} className="text-black fill-black ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-0.5">
                    <p
                      onClick={() => playSpotifySavedItem(item)}
                      className="text-white text-xs font-semibold truncate hover:underline cursor-pointer"
                    >
                      {item.title}
                    </p>
                    <p className="text-white/40 text-[10px] truncate">{item.subtitle}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                    <span className="text-[9px] text-white/30">
                      {new Date(item.addedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => removeSpotifyItem(item.id)}
                      className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Curated Public Spotify Playlists */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Music2 size={20} className="text-spotify-green" />
              <span>Coleções Oficiais e Playlists do Spotify</span>
            </h2>
            <p className="text-white/40 text-xs mt-0.5">Disponíveis imediatamente para ouvir</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CURATED_PUBLIC_SPOTIFY.map((item) => (
            <div
              key={item.id}
              onClick={() => playSpotifySavedItem(item)}
              className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/5 space-y-2 flex flex-col justify-between"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-black shadow-md">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                    <Play size={20} className="text-black fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-white text-xs font-bold truncate leading-snug">{item.title}</p>
                <p className="text-white/40 text-[11px] truncate">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
