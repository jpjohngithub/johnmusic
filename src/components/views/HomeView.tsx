import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { SpotifyService } from '../../services/spotifyService';
import { UniversalUrlService } from '../../services/universalUrlService';
import type { SpotifyAlbum, SpotifyPlaylistCard } from '../../types/music';
import { TrackRow } from '../common/TrackRow';
import { 
  Play, 
  Sparkles, 
  Flame, 
  Radio, 
  ArrowRight, 
  Zap, 
  Globe, 
  Compass, 
  History,
  Link as LinkIcon,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AddByUrlModal } from '../common/AddByUrlModal';

export const HomeView: React.FC = () => {
  const { playTrack, setCurrentView, playlists, favorites, history, openSpotifyItem, addTrackToPlaylist } = usePlayer();
  const [spotifyNewReleases, setSpotifyNewReleases] = useState<SpotifyAlbum[]>([]);
  const [spotifyFeatured, setSpotifyFeatured] = useState<SpotifyPlaylistCard[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isResolvingUrl, setIsResolvingUrl] = useState<boolean>(false);
  const [resolvedResult, setResolvedResult] = useState<any>(null);
  const [urlMessage, setUrlMessage] = useState<string>('');
  const [isAddByUrlOpen, setIsAddByUrlOpen] = useState<boolean>(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia, John';
    if (hour < 18) return 'Boa tarde, John';
    return 'Boa noite, John';
  };

  useEffect(() => {
    let isMounted = true;
    SpotifyService.getNewReleases().then(albums => {
      if (isMounted) setSpotifyNewReleases(albums);
    });

    SpotifyService.getFeaturedPlaylists().then(pls => {
      if (isMounted) setSpotifyFeatured(pls);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsResolvingUrl(true);
    setUrlMessage('');
    setResolvedResult(null);

    const spotifyParsed = SpotifyService.parseSpotifyUrl(urlInput);
    if (spotifyParsed) {
      if (spotifyParsed.type === 'playlist') {
        openSpotifyItem({
          id: spotifyParsed.id,
          name: 'Playlist do Spotify',
          description: 'Importada via link direto',
          coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
          totalTracks: 50,
          spotifyUri: `spotify:playlist:${spotifyParsed.id}`
        }, 'playlist');
        setIsResolvingUrl(false);
        return;
      } else if (spotifyParsed.type === 'album') {
        openSpotifyItem({
          id: spotifyParsed.id,
          name: 'Álbum do Spotify',
          artist: 'Artista Spotify',
          coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
          totalTracks: 12,
          spotifyUri: `spotify:album:${spotifyParsed.id}`
        }, 'album');
        setIsResolvingUrl(false);
        return;
      }
    }

    try {
      const resolved = await UniversalUrlService.resolveTrackFromUrl(urlInput);
      if (resolved) {
        setResolvedResult(resolved);
        setUrlMessage(`Música encontrada: "${resolved.track.title}"!`);
      } else {
        setUrlMessage('Link não suportado. Cole um link do YouTube, TikTok, Spotify ou link de áudio .mp3');
      }
    } catch {
      setUrlMessage('Erro ao processar URL.');
    } finally {
      setIsResolvingUrl(false);
    }
  };

  const handleAddResolvedToPlaylist = (playlistId: string) => {
    if (!resolvedResult) return;
    addTrackToPlaylist(playlistId, resolvedResult.track);
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 }
    });
    setUrlMessage(`Adicionada à playlist com sucesso!`);
    setResolvedResult(null);
    setUrlInput('');
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/20 shadow-2xl p-6 sm:p-8">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>johnmusic Pro — Tocador Universal & Spotify Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {getGreeting()}!
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Pesquise qualquer música do mundo, adicione sons do <b>YouTube e TikTok</b> diretamente às suas playlists por link, ouça lançamentos ao vivo e curta com som 100% completo e equalizador.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setCurrentView('explore')}
                className="px-6 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95"
              >
                <Compass className="w-4 h-4" />
                Explorar & Buscar Músicas
              </button>

              <button
                onClick={() => setIsAddByUrlOpen(true)}
                className="px-5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-emerald-300 font-semibold text-sm border border-emerald-500/30 flex items-center gap-2 transition-all"
              >
                <LinkIcon className="w-4 h-4 text-red-400" />
                Importar Link (YouTube / TikTok)
              </button>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 backdrop-blur-md min-w-[220px]">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              Resumo da Biblioteca
            </div>
            <div className="text-[11px] text-slate-400">
              ❤️ Favoritos: <span className="text-white font-bold">{favorites.length}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              📁 Playlists: <span className="text-white font-bold">{playlists.length}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              🕒 Histórico: <span className="text-white font-bold">{history.length} faixas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Universal URL Importer Box (YouTube, TikTok, Spotify, Web Audio) */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-red-950/30 via-slate-900 to-emerald-950/30 border border-slate-700/80 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500/20 via-pink-500/20 to-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-slate-700">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Importador Universal de Links
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                  YouTube
                </span>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-bold">
                  TikTok
                </span>
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
                  Spotify
                </span>
              </h3>
              <p className="text-xs text-slate-400">Cole qualquer link de vídeo/música do YouTube, TikTok ou Spotify para tocar e salvar</p>
            </div>
          </div>

          <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Cole o link do YouTube, TikTok ou Spotify..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 flex-1 md:w-80 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isResolvingUrl || !urlInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 flex-shrink-0 transition-transform active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              {isResolvingUrl ? 'Carregando...' : 'Carregar'}
            </button>
          </form>
        </div>

        {/* Resolved Card if found */}
        {resolvedResult && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <img
                src={resolvedResult.track.coverUrl}
                alt={resolvedResult.track.title}
                className="w-14 h-14 rounded-xl object-cover border border-slate-800 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{resolvedResult.track.title}</div>
                <div className="text-[11px] text-slate-400 truncate">{resolvedResult.track.artist}</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  {resolvedResult.platform === 'youtube' && 'Vídeo do YouTube'}
                  {resolvedResult.platform === 'tiktok' && 'Som do TikTok'}
                  {resolvedResult.platform === 'direct' && 'Áudio da Web'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => playTrack(resolvedResult.track)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Tocar Agora
              </button>

              {playlists.length > 0 && (
                <button
                  onClick={() => handleAddResolvedToPlaylist(playlists[0].id)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Salvar na Playlist
                </button>
              )}
            </div>
          </div>
        )}

        {urlMessage && (
          <div className="text-xs text-emerald-400 font-medium px-2">{urlMessage}</div>
        )}
      </div>

      {/* User's Recent History (if any) */}
      {history.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              Tocadas Recentemente
            </h2>
            <button
              onClick={() => setCurrentView('history')}
              className="text-xs font-bold text-cyan-400 hover:underline"
            >
              Ver Todas ({history.length})
            </button>
          </div>
          <div className="space-y-1">
            {history.slice(0, 5).map((track, idx) => (
              <TrackRow 
                key={`home-hist-${track.id}-${idx}`} 
                track={track} 
                index={idx} 
                allTracks={history} 
              />
            ))}
          </div>
        </div>
      )}

      {/* User Playlists */}
      {playlists.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Suas Playlists no johnmusic
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setCurrentView('playlist', pl.id)}
                className="group flex items-center gap-4 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-emerald-500/30 cursor-pointer transition-all"
              >
                <img 
                  src={pl.coverUrl} 
                  alt={pl.title} 
                  className="w-14 h-14 rounded-xl object-cover shadow flex-shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 truncate transition-colors">
                    {pl.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {pl.trackIds.length} músicas
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spotify Live New Releases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-green-400" />
              🔥 Novos Lançamentos no Spotify (Live)
            </h2>
            <p className="text-xs text-slate-400">Álbuns e músicas recém-lançados no catálogo mundial</p>
          </div>
          <button
            onClick={() => setCurrentView('explore')}
            className="text-xs font-bold text-green-400 hover:underline flex items-center gap-1"
          >
            Ver mais no Spotify <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {spotifyNewReleases.slice(0, 6).map((album) => (
            <div
              key={album.id}
              onClick={() => openSpotifyItem(album, 'album')}
              className="group p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-green-500/40 cursor-pointer transition-all hover:-translate-y-1"
            >
              <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-800 shadow-md">
                <img 
                  src={album.coverUrl} 
                  alt={album.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-slate-950 flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                  </div>
                </div>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-green-400 border border-green-500/30">
                  Spotify
                </span>
              </div>
              <h3 className="font-semibold text-sm text-slate-100 group-hover:text-green-400 truncate">
                {album.name}
              </h3>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {album.artist}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Spotify Official Featured Playlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              🌟 Playlists Oficiais do Spotify
            </h2>
            <p className="text-xs text-slate-400">As playlists mais ouvidas e virais da plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {spotifyFeatured.map((pl) => (
            <div
              key={pl.id}
              onClick={() => openSpotifyItem(pl, 'playlist')}
              className="group p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition-all hover:-translate-y-1"
            >
              <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-800 shadow-md">
                <img 
                  src={pl.coverUrl} 
                  alt={pl.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-sm text-slate-100 group-hover:text-cyan-400 truncate">
                {pl.name}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                {pl.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <AddByUrlModal
        isOpen={isAddByUrlOpen}
        onClose={() => setIsAddByUrlOpen(false)}
      />
    </div>
  );
};
