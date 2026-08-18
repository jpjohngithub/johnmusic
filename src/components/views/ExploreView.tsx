import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { DEFAULT_TRACKS } from '../../data/defaultTracks';
import { SpotifyService } from '../../services/spotifyService';
import type { Track } from '../../types/music';
import { TrackRow } from '../common/TrackRow';
import { TrackCard } from '../common/TrackCard';
import { Loader2, Compass, Radio, Sparkles } from 'lucide-react';

export const ExploreView: React.FC = () => {
  const { searchQuery, setSearchQuery, localTracks, favorites } = usePlayer();
  const [onlineResults, setOnlineResults] = useState<Track[]>([]);
  const [isLoadingOnline, setIsLoadingOnline] = useState<boolean>(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const genres = [
    { name: 'Synthwave', color: 'from-fuchsia-600 to-pink-600', query: 'synthwave 80s' },
    { name: 'Lofi & Study', color: 'from-amber-600 to-orange-700', query: 'lofi hip hop beats' },
    { name: 'Cyberpunk & Bass', color: 'from-cyan-600 to-blue-700', query: 'cyberpunk bass' },
    { name: 'Rock & Metal', color: 'from-red-600 to-rose-800', query: 'rock classics' },
    { name: 'Pop Hits', color: 'from-emerald-600 to-teal-700', query: 'top pop hits' },
    { name: 'Acústico & Folk', color: 'from-lime-600 to-emerald-800', query: 'acoustic guitar chill' },
    { name: 'Eletrônica / EDM', color: 'from-purple-600 to-indigo-800', query: 'electronic dance edm' },
    { name: 'Jazz & Relax', color: 'from-sky-600 to-cyan-800', query: 'smooth jazz coffee' },
  ];

  // Debounced search on online APIs
  useEffect(() => {
    if (!searchQuery.trim()) {
      setOnlineResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingOnline(true);
      try {
        const results = await SpotifyService.searchOnlineTracks(searchQuery);
        setOnlineResults(results);
      } catch (err) {
        console.error('Online search error:', err);
      } finally {
        setIsLoadingOnline(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine local and built-in tracks for local search
  const allLocalTracks = [...DEFAULT_TRACKS, ...localTracks, ...favorites.filter(f => f.source !== 'built-in' && f.source !== 'local')];
  
  // Deduplicate
  const uniquePool = Array.from(new Map(allLocalTracks.map(t => [t.id, t])).values());

  const filteredInternalTracks = uniquePool.filter((track) => {
    const queryMatches = !searchQuery.trim() || 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.genre && track.genre.toLowerCase().includes(searchQuery.toLowerCase()));

    const genreMatches = !selectedGenre || 
      (track.genre && track.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

    return queryMatches && genreMatches;
  });

  const handleGenreClick = (genre: { name: string; query: string }) => {
    if (selectedGenre === genre.name) {
      setSelectedGenre(null);
    } else {
      setSelectedGenre(genre.name);
      setSearchQuery(genre.name);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 flex items-center gap-2.5">
          <Compass className="w-7 h-7 text-emerald-400" />
          Explorar & Buscar Músicas
        </h1>
        <p className="text-sm text-slate-400">
          Pesquise músicas locais, faixas embutidas ou busque milhões de prévias musicais online via Spotify / Cloud API.
        </p>
      </div>

      {/* Genre Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Navegar por Gêneros
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {genres.map((g) => {
            const isSelected = selectedGenre === g.name;
            return (
              <button
                key={g.name}
                onClick={() => handleGenreClick(g)}
                className={`relative h-24 rounded-2xl p-3 flex flex-col justify-between text-left overflow-hidden shadow-lg bg-gradient-to-br ${g.color} transition-all hover:scale-105 active:scale-95 ${
                  isSelected ? 'ring-4 ring-white shadow-emerald-500/50' : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="font-bold text-xs text-white leading-snug drop-shadow-md">
                  {g.name}
                </div>
                <div className="text-[10px] text-white/80 font-mono">johnmusic</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="space-y-6">
          {/* Internal / Local matches */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              <span>Biblioteca Local & Curada ({filteredInternalTracks.length})</span>
            </h2>

            {filteredInternalTracks.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Nenhum resultado interno encontrado.</p>
            ) : (
              <div className="space-y-1">
                {filteredInternalTracks.map((track, idx) => (
                  <TrackRow 
                    key={track.id} 
                    track={track} 
                    index={idx} 
                    allTracks={filteredInternalTracks} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Online / Cloud / Spotify matches */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                Busca Global Online / Spotify Cloud
              </h2>
              {isLoadingOnline && (
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando faixas online...
                </div>
              )}
            </div>

            {onlineResults.length === 0 && !isLoadingOnline ? (
              <p className="text-xs text-slate-500 italic py-2">
                Nenhum resultado global encontrado para "{searchQuery}".
              </p>
            ) : (
              <div className="space-y-1">
                {onlineResults.map((track, idx) => (
                  <TrackRow 
                    key={track.id} 
                    track={track} 
                    index={idx} 
                    allTracks={onlineResults} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* When not searching, show all built-in cards */}
      {!searchQuery.trim() && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Todas as Faixas em Destaque</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {DEFAULT_TRACKS.map((track) => (
              <TrackCard key={track.id} track={track} allTracks={DEFAULT_TRACKS} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
