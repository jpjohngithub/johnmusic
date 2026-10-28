import React, { useState, useEffect } from 'react';
import { Platform, Track, SearchPlaylistResult } from '../types';
import { searchAllPlatforms, searchPlaylists, FEATURED_TRACKS } from '../services/api';
import { importFromUrl, detectUrlType } from '../services/importer';
import { TrackRow } from '../components/TrackRow';
import { SafeImage } from '../components/SafeImage';
import { usePlaylists } from '../context/PlaylistContext';
import { usePlayer } from '../context/PlayerContext';
import { Search, Loader2, X, Music, Disc3, Link2, DownloadCloud, Play } from 'lucide-react';

interface SearchViewProps {
  initialFilter?: Platform | 'all';
  onAddToPlaylist: (track: Track) => void;
  onOpenPlaylist?: (id: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  initialFilter = 'all',
  onAddToPlaylist,
  onOpenPlaylist
}) => {
  const { createPlaylist, addTrackToPlaylist } = usePlaylists();
  const { playTrack } = usePlayer();

  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'tracks' | 'playlists'>('tracks');
  const [platform, setPlatform] = useState<Platform | 'all'>(initialFilter);
  const [tracks, setTracks] = useState<Track[]>(FEATURED_TRACKS);
  const [playlists, setPlaylists] = useState<SearchPlaylistResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingUrl, setImportingUrl] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const detectedUrl = detectUrlType(query);

  useEffect(() => {
    setPlatform(initialFilter);
  }, [initialFilter]);

  // Search effect
  useEffect(() => {
    let active = true;

    const performSearch = async () => {
      const q = query.trim();
      setLoading(true);

      try {
        if (searchMode === 'tracks') {
          if (!q) {
            const filtered = platform === 'all'
              ? FEATURED_TRACKS
              : FEATURED_TRACKS.filter(t => t.platform === platform);
            if (active) setTracks(filtered);
          } else {
            const results = await searchAllPlatforms(q, platform);
            if (active) setTracks(results);
          }
        } else {
          // Search playlists
          const plResults = await searchPlaylists(q);
          const filteredPl = platform === 'all'
            ? plResults
            : plResults.filter(p => p.platform === platform);
          if (active) setPlaylists(filteredPl);
        }
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, platform, searchMode]);

  // Direct URL Import from search bar
  const handleDirectImport = async () => {
    if (!query.trim()) return;
    setImportingUrl(true);
    setImportSuccessMsg(null);

    try {
      const result = await importFromUrl(query.trim());
      if (result.type === 'track' && result.track) {
        playTrack(result.track);
        setTracks(prev => [result.track!, ...prev]);
        setImportSuccessMsg(`"${result.track.title}" importada e tocando agora!`);
      } else if (result.type === 'playlist' && result.playlist) {
        const pl = result.playlist;
        const created = createPlaylist(pl.name, pl.description, pl.coverUrl);
        for (const t of pl.tracks) {
          addTrackToPlaylist(created.id, t);
        }
        setImportSuccessMsg(`Playlist "${pl.name}" (${pl.tracks.length} músicas) importada!`);
        if (onOpenPlaylist) onOpenPlaylist(created.id);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao importar link');
    } finally {
      setImportingUrl(false);
    }
  };

  const handleImportPlaylistResult = async (pl: SearchPlaylistResult) => {
    if (pl.externalUrl) {
      setImportingUrl(true);
      try {
        const result = await importFromUrl(pl.externalUrl);
        if (result.type === 'playlist' && result.playlist) {
          const created = createPlaylist(result.playlist.name, result.playlist.description, result.playlist.coverUrl);
          for (const t of result.playlist.tracks) {
            addTrackToPlaylist(created.id, t);
          }
          if (onOpenPlaylist) onOpenPlaylist(created.id);
        }
      } catch (e: any) {
        // Fallback: create empty playlist with info
        const created = createPlaylist(pl.title, `Playlist do ${pl.platform}`, pl.coverUrl);
        if (onOpenPlaylist) onOpenPlaylist(created.id);
      } finally {
        setImportingUrl(false);
      }
    } else {
      const created = createPlaylist(pl.title, `Playlist do ${pl.platform}`, pl.coverUrl);
      if (onOpenPlaylist) onOpenPlaylist(created.id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Search Header */}
      <div className="space-y-3">
        {/* Search Mode Toggle (Músicas vs Playlists) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchMode('tracks')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              searchMode === 'tracks'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Músicas
          </button>

          <button
            onClick={() => setSearchMode('playlists')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              searchMode === 'playlists'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            Playlists (YouTube & Spotify)
          </button>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-purple-400/80 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchMode === 'tracks'
                ? 'Buscar músicas, artistas ou colar link do TikTok/YouTube/Spotify...'
                : 'Buscar playlists do YouTube ou Spotify...'
            }
            className="w-full pl-12 pr-12 py-3.5 bg-[#0f0a17]/90 border border-purple-900/40 hover:border-purple-600/50 focus:border-purple-500 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none transition-all shadow-inner backdrop-blur-xl"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Direct Link Banner */}
        {detectedUrl.platform !== 'unknown' && (
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-600/40 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <Link2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <p className="text-xs text-purple-200 truncate">
                Link do <b>{detectedUrl.platform.toUpperCase()}</b> detectado! Deseja extrair o áudio automaticamente?
              </p>
            </div>
            <button
              onClick={handleDirectImport}
              disabled={importingUrl}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 flex-shrink-0 shadow-md"
            >
              {importingUrl ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <DownloadCloud className="w-3.5 h-3.5" />
              )}
              Extrair e Tocar
            </button>
          </div>
        )}

        {/* Import Success Banner */}
        {importSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
            {importSuccessMsg}
          </div>
        )}

        {/* Platform Sub-Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['all', 'spotify', 'youtube', 'tiktok'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                platform === p
                  ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                  : 'bg-white/[0.02] text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {p === 'all' ? 'Todas' : p === 'spotify' ? 'Spotify' : p === 'youtube' ? 'YouTube' : 'TikTok'}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {loading ? (
            <span className="flex items-center gap-2 text-purple-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Buscando no catálogo global...
            </span>
          ) : searchMode === 'tracks' ? (
            `Músicas (${tracks.length})`
          ) : (
            `Playlists Encontradas (${playlists.length})`
          )}
        </h3>
      </div>

      {/* Tracks Results */}
      {searchMode === 'tracks' && (
        <div className="space-y-2">
          {tracks.length === 0 && !loading ? (
            <div className="text-center py-16 bg-[#0f0a17]/40 border border-white/5 rounded-2xl">
              <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm text-slate-400 font-medium">Nenhuma música encontrada</p>
              <p className="text-xs text-slate-500 mt-1">Cole um link do TikTok/YouTube ou digite outro nome.</p>
            </div>
          ) : (
            tracks.map((track, idx) => (
              <TrackRow
                key={`${track.id}-${idx}`}
                track={track}
                index={idx}
                onAddToPlaylist={onAddToPlaylist}
                playlistContextTracks={tracks}
              />
            ))
          )}
        </div>
      )}

      {/* Playlists Results */}
      {searchMode === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="p-3.5 rounded-2xl bg-[#0f0a17]/60 border border-purple-900/30 hover:border-purple-600/40 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                  <SafeImage src={pl.coverUrl} alt={pl.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-white truncate">{pl.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{pl.author}</p>
                  <span className="text-[10px] text-purple-400/80 font-mono">
                    {pl.platform.toUpperCase()} • ~{pl.trackCount || 20} faixas
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleImportPlaylistResult(pl)}
                disabled={importingUrl}
                className="p-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-800/40 transition-colors flex-shrink-0"
                title="Importar Playlist para sua Biblioteca"
              >
                <DownloadCloud className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
