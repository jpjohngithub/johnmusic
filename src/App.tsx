import { Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainContent } from '@/components/layout/MainContent'
import { PlayerBar } from '@/components/layout/PlayerBar'
import { Home } from '@/pages/Home'
import { SpotifyLibrary } from '@/pages/SpotifyLibrary'
import { SpotifyPlaylistDetail } from '@/pages/SpotifyPlaylistDetail'
import { SpotifyLiked } from '@/pages/SpotifyLiked'
import { SpotifyAlbumDetail } from '@/pages/SpotifyAlbumDetail'
import { CustomPlaylistDetail } from '@/pages/CustomPlaylistDetail'
import { YouTubeLibrary } from '@/pages/YouTubeLibrary'
import { TikTokLibrary } from '@/pages/TikTokLibrary'
import { Search } from '@/pages/Search'
import { usePlayerStore } from '@/store/playerStore'
import type { SpotifyTrack } from '@/types'

export function App() {
  const { setSource, setSpotifyTrack, setIsPlaying } = usePlayerStore()

  const handlePlaySpotifyTrack = async (track: SpotifyTrack) => {
    setSource('spotify')
    setSpotifyTrack({
      id: track.id,
      uri: track.uri,
      name: track.name,
      duration_ms: track.duration_ms,
      artists: track.artists,
      album: {
        name: track.album?.name || '',
        uri: track.album?.uri || '',
        images: track.album?.images || [],
      },
    })
    setIsPlaying(true)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black select-none">
      <Sidebar />
      <MainContent>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/spotify" element={<SpotifyLibrary />} />
          <Route path="/spotify/playlist/:id" element={<SpotifyPlaylistDetail />} />
          <Route
            path="/spotify/liked"
            element={
              <SpotifyLiked
                isAuthenticated={false}
                onPlayTrack={handlePlaySpotifyTrack}
              />
            }
          />
          <Route
            path="/spotify/album/:id"
            element={
              <SpotifyAlbumDetail
                isAuthenticated={false}
                onPlayTrack={handlePlaySpotifyTrack}
              />
            }
          />
          <Route path="/playlist/:id" element={<CustomPlaylistDetail />} />
          <Route path="/youtube" element={<YouTubeLibrary />} />
          <Route path="/tiktok" element={<TikTokLibrary />} />
          <Route path="/search" element={<Search isAuthenticated={false} onPlayTrack={handlePlaySpotifyTrack} />} />
        </Routes>
      </MainContent>

      <PlayerBar spotifyPlayer={null} />
    </div>
  )
}
