import { useNavigate } from 'react-router-dom'
import { Music2, Play } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'
import type { SpotifyPlaylist, SpotifyAlbum } from '@/types'

type GridItem = SpotifyPlaylist | SpotifyAlbum

interface PlaylistGridProps {
  items: GridItem[]
  title?: string
  type?: 'playlist' | 'album'
  onPlayDirect?: (item: GridItem) => void
}

function isPlaylist(item: GridItem): item is SpotifyPlaylist {
  return 'tracks' in item && 'owner' in item
}

export function PlaylistGrid({ items, title, onPlayDirect }: PlaylistGridProps) {
  const navigate = useNavigate()

  const handleClick = (item: GridItem) => {
    if (isPlaylist(item)) {
      navigate(`/spotify/playlist/${item.id}`)
    } else {
      navigate(`/spotify/album/${item.id}`)
    }
  }

  if (!items || items.length === 0) return null

  return (
    <section className="mb-8">
      {title && (
        <h2 className="text-xl font-bold text-white mb-4 tracking-tight">{title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item) => {
          const imageUrl = getImageUrl(item.images)
          const name = item.name
          const subtitle = isPlaylist(item)
            ? `${item.tracks?.total || 0} músicas`
            : `Álbum • ${item.artists?.[0]?.name || ''}`

          return (
            <div
              key={item.id}
              className="group p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-200 cursor-pointer flex flex-col"
              onClick={() => handleClick(item)}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5 mb-3 shadow-md">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#282828]">
                    <Music2 size={36} className="text-white/20" />
                  </div>
                )}

                {/* Floating Play Button */}
                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onPlayDirect) {
                        onPlayDirect(item)
                      } else {
                        handleClick(item)
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
                    title={`Tocar ${name}`}
                  >
                    <Play size={18} className="text-black fill-black ml-0.5" />
                  </button>
                </div>
              </div>

              <p className="text-white text-sm font-semibold truncate leading-snug">{name}</p>
              <p className="text-white/50 text-xs truncate mt-1">{subtitle}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
