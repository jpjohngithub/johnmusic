// ============================================================
// APP ROOT — Layout principal com persistência total de rotas no F5
// Suporte a carregamento preguiçoso (Lazy), SPA redirects e Player unificado
// ============================================================

import { lazy, Suspense, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainContent } from '@/components/layout/MainContent'
import { PlayerBar } from '@/components/layout/PlayerBar'
import { Home } from '@/pages/Home'
import { YouTubePlayer } from '@/components/youtube/YouTubePlayer'
import { useLibraryStore } from '@/store/libraryStore'
import { isJohnMusicShareUrl, importPlaylistFromShareUrl } from '@/api/playlistShareService'
import { Loader2 } from 'lucide-react'

// Lazy loaded routes for ultra-fast initial page load
const SpotifyLibrary = lazy(() => import('@/pages/SpotifyLibrary').then((m) => ({ default: m.SpotifyLibrary })))
const SpotifyPlaylistDetail = lazy(() => import('@/pages/SpotifyPlaylistDetail').then((m) => ({ default: m.SpotifyPlaylistDetail })))
const SpotifyLiked = lazy(() => import('@/pages/SpotifyLiked').then((m) => ({ default: m.SpotifyLiked })))
const SpotifyAlbumDetail = lazy(() => import('@/pages/SpotifyAlbumDetail').then((m) => ({ default: m.SpotifyAlbumDetail })))
const CustomPlaylistDetail = lazy(() => import('@/pages/CustomPlaylistDetail').then((m) => ({ default: m.CustomPlaylistDetail })))
const YouTubeLibrary = lazy(() => import('@/pages/YouTubeLibrary').then((m) => ({ default: m.YouTubeLibrary })))
const TikTokLibrary = lazy(() => import('@/pages/TikTokLibrary').then((m) => ({ default: m.TikTokLibrary })))
const Search = lazy(() => import('@/pages/Search').then((m) => ({ default: m.Search })))

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] text-spotify-green">
      <Loader2 size={32} className="animate-spin" />
    </div>
  )
}

export function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addCustomPlaylist } = useLibraryStore()
  const isInitialMount = useRef(true)

  // 1. Restaura rota anterior ao recarregar a página (F5) ou trata redirecionamento de SPA
  useEffect(() => {
    // Trata SPA redirect query do GitHub Pages (?/... )
    if (window.location.search.startsWith('?/')) {
      const decoded = window.location.search
        .slice(2)
        .split('&')
        .map((s) => s.replace(/~and~/g, '&'))
        .join('?')
      window.history.replaceState({}, document.title, window.location.pathname)
      navigate('/' + decoded, { replace: true })
      return
    }

    // Listener para URLs compartilhadas na inicialização (ex: ?playlist=... ou ?share=...)
    const search = window.location.search
    if (search && isJohnMusicShareUrl(search)) {
      const pl = importPlaylistFromShareUrl(search)
      if (pl && pl.items.length > 0) {
        addCustomPlaylist(pl)
        window.history.replaceState({}, document.title, window.location.pathname)
        navigate(`/playlist/${pl.id}`, { replace: true })
        return
      }
    }

    // Se estiver na raiz e houver rota salva no sessionStorage (F5 em qualquer aba/playlist/busca)
    if (isInitialMount.current) {
      isInitialMount.current = false
      const savedRoute = sessionStorage.getItem('jm_active_route')
      if (savedRoute && location.pathname === '/' && savedRoute !== '/') {
        navigate(savedRoute, { replace: true })
      }
    }
  }, [addCustomPlaylist, navigate])

  // 2. Salva a rota ativa sempre que o usuário navega
  useEffect(() => {
    const fullPath = location.pathname + location.search
    sessionStorage.setItem('jm_active_route', fullPath)
  }, [location])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black select-none">
      <Sidebar />
      <MainContent>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/spotify" element={<SpotifyLibrary />} />
            <Route path="/spotify/playlist/:id" element={<SpotifyPlaylistDetail />} />
            <Route path="/spotify/liked" element={<SpotifyLiked />} />
            <Route path="/spotify/album/:id" element={<SpotifyAlbumDetail />} />
            <Route path="/playlist/:id" element={<CustomPlaylistDetail />} />
            <Route path="/youtube" element={<YouTubeLibrary />} />
            <Route path="/tiktok" element={<TikTokLibrary />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </Suspense>
      </MainContent>

      {/* Global Persistent YouTube Engine */}
      <YouTubePlayer />

      <PlayerBar spotifyPlayer={null} />
    </div>
  )
}
