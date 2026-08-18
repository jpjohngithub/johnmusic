import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { DEFAULT_TRACKS } from '../../data/defaultTracks';
import { SpotifyService } from '../../services/spotifyService';
import type { Track, SpotifyPlaylistCard, SpotifyAlbum } from '../../types/music';
import { TrackRow } from '../common/TrackRow';
import { TrackCard } from '../common/TrackCard';
import { Loader2, Compass, Radio, Sparkles, Zap, Disc } from 'lucide-react';

export const ExploreView: React.FC = () => {
  const { searchQuery, setSearchQuery, localTracks, favorites, openSpotifyItem } = usePlayer();
  const [onlineResults, setOnlineResults] = useState<Track[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<SpotifyPlaylistCard[]>([]);
  const [newReleases, setNewReleases] = useState<SpotifyAlbum[]>([]);
  const [isLoadingOnline, setIsLoadingOnline] = useState<boolean>(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'tracks' | 'playlists' | 'albums'>('all');
  const [urlInput, setUrlInput] = useState<string>('');

  const genres = [
    { name: 'Top Hits 2024', color: 'from-emerald-600 to-teal-700' },
    { name: 'Pop Global', color: 'from-fuchsia-600 to-pink-600' },
    { name: 'Funk & Trap Brasil', color: 'from-amber-600 to-red-700' },
    { name: 'Sertanejo & Piseiro', color: 'from-yellow-600 to-amber-800' },
    { name: 'Rock & Metal', color: 'from-rose-700 to-red-900' },
    { name: 'Hip Hop & Rap', color: 'from-violet-600 to-indigo-800' },
    { name: 'Eletrônica / EDM', color: 'from-cyan-600 to-blue-700' },
    { name: 'Lofi Study & Relax', color: 'from-teal-600 to-emerald-800' },
  ];

  useEffect(() => {
    SpotifyService.getFeaturedPlaylists().then(setFeaturedPlaylists);
    SpotifyService.getNewReleases().then(setNewReleases);
  }, []);

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

  const allLocalTracks = [...DEFAULT_TRACKS, ...localTracks, ...favorites.filter(f => f.source !== 'built-in' && f.source !== 'local')];
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

  const handleGenreClick = (genreName: string) => {
    if (selectedGenre === genreName) {
      setSelectedGenre(null);
      setSearchQuery('');
    } else {
      setSelectedGenre(genreName);
      setSearchQuery(genreName);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const parsed = SpotifyService.parseSpotifyUrl(urlInput);
    if (parsed) {
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
          artist: 'Spotify Artist',
          coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
          totalTracks: 12,
          spotifyUri: `spotify:album:${parsed.id}`
        }, 'album');
      }
    } else {
      setSearchQuery(urlInput);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 flex items-center gap-2.5">
          <Compass className="w-7 h-7 text-emerald-400" />
          Explorar Todo o Catálogo Spotify & Músicas
        </h1>
        <p className="text-sm text-slate-400">
          Pesquise qualquer música, playlist, artista ou lançamento do Spotify e do mundo para ouvir diretamente no johnmusic.
        </p>
      </div>

      {/* Direct URL / Link bar */}
      <form onSubmit={handleUrlSubmit} className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-2">
        <Radio className="w-4 h-4 text-green-400 ml-2" />
        <input
          type="text"
          placeholder="Cole qualquer link do Spotify ou digite o nome de qualquer música..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="bg-transparent flex-1 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-1.5 bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          Abrir
        </button>
      </form>

      {/* Genre Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Gêneros & Coleções em Alta
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {genres.map((g) => {
            const isSelected = selectedGenre === g.name;
            return (
              <button
                key={g.name}
                onClick={() => handleGenreClick(g.name)}
                className={`relative h-24 rounded-2xl p-3 flex flex-col justify-between text-left overflow-hidden shadow-lg bg-gradient-to-br ${g.color} transition-all hover:scale-105 active:scale-95 ${
                  isSelected ? 'ring-4 ring-white shadow-emerald-500/50' : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="font-bold text-xs text-white leading-snug drop-shadow-md">
                  {g.name}
                </div>
                <div className="text-[10px] text-white/80 font-mono">Spotify Global</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'all', label: 'Tudo' },
          { id: 'tracks', label: 'Músicas' },
          { id: 'playlists', label: 'Playlists do Spotify' },
          { id: 'albums', label: 'Álbuns & Lançamentos' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="space-y-6">
          {(activeTab === 'all' || activeTab === 'tracks') && (
            <>
              {/* Internal / Local matches */}
              {filteredInternalTracks.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
                  <h2 className="text-base font-bold text-white mb-4">
                    Na Sua Biblioteca ({filteredInternalTracks.length})
                  </h2>
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
                </div>
              )}

              {/* Online / Spotify matches */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-green-400" />
                    Resultados Globais no Spotify & Nuvem ({onlineResults.length})
                  </h2>
                  {isLoadingOnline && (
                    <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Pesquisando no catálogo...
                    </div>
                  )}
                </div>

                {onlineResults.length === 0 && !isLoadingOnline ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    Nenhum resultado online para "{searchQuery}".
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
            </>
          )}
        </div>
      )}

      {/* When not searching or browsing tabs */}
      {(!searchQuery.trim() || activeTab === 'playlists') && (activeTab === 'all' || activeTab === 'playlists') && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-400" />
            Playlists em Alta no Spotify
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featuredPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => openSpotifyItem(pl, 'playlist')}
                className="group p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-green-500/40 cursor-pointer transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-800 shadow-md">
                  <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-green-400 truncate">{pl.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{pl.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!searchQuery.trim() || activeTab === 'albums') && (activeTab === 'all' || activeTab === 'albums') && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Disc className="w-5 h-5 text-cyan-400" />
            Álbuns & Lançamentos Recentes no Spotify
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {newReleases.map((album) => (
              <div
                key={album.id}
                onClick={() => openSpotifyItem(album, 'album')}
                className="group p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-800 shadow-md">
                  <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-cyan-400 truncate">{album.name}</h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">{album.artist}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!searchQuery.trim() && activeTab === 'all' && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Músicas em Destaque</h2>
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
