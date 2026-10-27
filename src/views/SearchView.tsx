import React, { useState, useEffect } from 'react';
import { Platform, Track } from '../types';
import { searchAllPlatforms, FEATURED_TRACKS } from '../services/api';
import { TrackRow } from '../components/TrackRow';
import { SpotifyIcon, YouTubeIcon, TikTokIcon } from '../components/Icons';
import { Search, Sparkles, Loader2, X } from 'lucide-react';

interface SearchViewProps {
  initialFilter?: Platform | 'all';
  onAddToPlaylist: (track: Track) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  initialFilter = 'all',
  onAddToPlaylist
}) => {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<Platform | 'all'>(initialFilter);
  const [tracks, setTracks] = useState<Track[]>(FEATURED_TRACKS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPlatform(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    let active = true;
    const fetchResults = async () => {
      if (!query.trim()) {
        const filtered = platform === 'all'
          ? FEATURED_TRACKS
          : FEATURED_TRACKS.filter(t => t.platform === platform);
        setTracks(filtered);
        return;
      }

      setLoading(true);
      try {
        const results = await searchAllPlatforms(query, platform);
        if (active) {
          setTracks(results);
        }
      } catch (e) {
        console.warn('Search error:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, platform]);

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Search Header and Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar músicas, artistas, links do YouTube ou TikTok..."
            className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500 rounded-2xl text-white placeholder-slate-400 text-sm md:text-base focus:outline-none transition-all shadow-inner backdrop-blur-xl"
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

        {/* Platform Tabs */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setPlatform('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              platform === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Todas as Plataformas
          </button>

          <button
            onClick={() => setPlatform('spotify')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              platform === 'spotify'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-white/10'
            }`}
          >
            <SpotifyIcon className="w-3.5 h-3.5 text-emerald-400" />
            Spotify
          </button>

          <button
            onClick={() => setPlatform('youtube')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              platform === 'youtube'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-white/5 text-slate-400 hover:text-red-400 hover:bg-white/10'
            }`}
          >
            <YouTubeIcon className="w-3.5 h-3.5 text-red-400" />
            YouTube Music
          </button>

          <button
            onClick={() => setPlatform('tiktok')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              platform === 'tiktok'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-white/5 text-slate-400 hover:text-cyan-400 hover:bg-white/10'
            }`}
          >
            <TikTokIcon className="w-3.5 h-3.5 text-cyan-400" />
            TikTok Sounds
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              Pesquisando no catálogo global...
            </span>
          ) : query ? (
            `Resultados para "${query}" (${tracks.length})`
          ) : (
            `Músicas em Destaque (${tracks.length})`
          )}
        </h3>
      </div>

      {/* Results List */}
      <div className="space-y-2">
        {tracks.length === 0 && !loading ? (
          <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
            <Search className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm text-slate-400 font-medium">Nenhuma música encontrada</p>
            <p className="text-xs text-slate-500 mt-1">
              Tente outro nome ou cole um link direto do YouTube/TikTok.
            </p>
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
    </div>
  );
};
