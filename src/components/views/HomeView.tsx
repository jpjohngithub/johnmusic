import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { DEFAULT_TRACKS } from '../../data/defaultTracks';
import { SpotifyService } from '../../services/spotifyService';
import type { SpotifyAlbum, SpotifyPlaylistCard } from '../../types/music';
import { TrackCard } from '../common/TrackCard';
import { 
  Play, 
  Sparkles, 
  FileAudio, 
  Flame, 
  Radio, 
  ArrowRight,
  Zap,
  Globe
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const { playTrack, setCurrentView, playlists, localTracks, openSpotifyItem } = usePlayer();
  const [spotifyNewReleases, setSpotifyNewReleases] = useState<SpotifyAlbum[]>([]);
  const [spotifyFeatured, setSpotifyFeatured] = useState<SpotifyPlaylistCard[]>([]);
  const [spotifyUrlInput, setSpotifyUrlInput] = useState<string>('');
  const [urlMessage, setUrlMessage] = useState<string>('');

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

  const handleSpotifyUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotifyUrlInput.trim()) return;

    const parsed = SpotifyService.parseSpotifyUrl(spotifyUrlInput);
    if (!parsed) {
      setUrlMessage('Link inválido. Cole um link válido do Spotify (música, playlist ou álbum).');
      return;
    }

    setUrlMessage('Carregando conteúdo do Spotify...');

    if (parsed.type === 'playlist') {
      openSpotifyItem({
        id: parsed.id,
        name: 'Playlist do Spotify',
        description: 'Importada via link direto',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
        totalTracks: 50,
        spotifyUri: `spotify:playlist:${parsed.id}`
      }, 'playlist');
    } else if (parsed.type === 'album') {
      openSpotifyItem({
        id: parsed.id,
        name: 'Álbum do Spotify',
        artist: 'Artista Spotify',
        coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
        totalTracks: 12,
        spotifyUri: `spotify:album:${parsed.id}`
      }, 'album');
    } else if (parsed.type === 'track') {
      const tracks = await SpotifyService.searchOnlineTracks(parsed.id);
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
    }
  };

  const featuredTrack = DEFAULT_TRACKS[0];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/20 shadow-2xl p-6 sm:p-8">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conectado ao Catálogo Spotify & Web Audio Live</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {getGreeting()}!
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              O que você quer ouvir agora? Navegue por qualquer lançamento do Spotify, importe suas músicas locais do computador ou explore o catálogo mundial.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => playTrack(featuredTrack, DEFAULT_TRACKS)}
                className="px-6 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Tocar Mix em Destaque
              </button>

              <button
                onClick={() => setCurrentView('local-files')}
                className="px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 flex items-center gap-2 transition-all"
              >
                <FileAudio className="w-4 h-4 text-indigo-400" />
                Músicas do PC ({localTracks.length})
              </button>
            </div>
          </div>

          {/* Featured Artwork */}
          <div 
            onClick={() => playTrack(featuredTrack, DEFAULT_TRACKS)}
            className="group relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 cursor-pointer flex-shrink-0 self-center md:self-auto"
          >
            <img 
              src={featuredTrack.coverUrl} 
              alt={featuredTrack.title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md">
              <div className="text-xs font-bold text-white truncate">{featuredTrack.title}</div>
              <div className="text-[10px] text-emerald-400 truncate">{featuredTrack.artist}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Spotify URL Importer Box */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-green-950/40 via-slate-900 to-slate-950 border border-green-500/25 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Importador Universal do Spotify
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-mono">
                Qualquer Link
              </span>
            </h3>
            <p className="text-xs text-slate-400">Cole qualquer URL de música, playlist ou álbum do Spotify para abrir instantaneamente</p>
          </div>
        </div>

        <form onSubmit={handleSpotifyUrlSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="https://open.spotify.com/playlist/..."
            value={spotifyUrlInput}
            onChange={(e) => setSpotifyUrlInput(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 flex-1 md:w-72 focus:outline-none focus:border-green-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 flex-shrink-0 transition-transform active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Carregar
          </button>
        </form>
      </div>

      {urlMessage && (
        <div className="text-xs text-green-400 font-medium px-2">{urlMessage}</div>
      )}

      {/* Spotify Live New Releases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-green-400" />
              🔥 Novos Lançamentos no Spotify (Live)
            </h2>
            <p className="text-xs text-slate-400">Álbuns e singles recém-lançados no catálogo mundial</p>
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
                  Spotify Álbum
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

      {/* Quick Launch Cards */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" />
          Suas Playlists do johnmusic
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.slice(0, 3).map((pl) => (
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

      {/* Curated Built-in Tracks Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recomendados em Alta Qualidade</h2>
            <p className="text-xs text-slate-400">Coleção curada pronta para tocar com visualizador</p>
          </div>
          <button
            onClick={() => setCurrentView('explore')}
            className="text-xs font-bold text-emerald-400 hover:underline"
          >
            Ver Tudo
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {DEFAULT_TRACKS.map((track) => (
            <TrackCard key={track.id} track={track} allTracks={DEFAULT_TRACKS} />
          ))}
        </div>
      </div>
    </div>
  );
};
