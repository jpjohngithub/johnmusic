import React, { useState } from 'react';
import { importFromUrl, detectUrlType } from '../services/importer';
import { Track, Playlist } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylists } from '../context/PlaylistContext';
import { SafeImage } from './SafeImage';
import { Link2, Sparkles, Loader2, Play, Plus, X, Check, Disc3, Heart, ListPlus } from 'lucide-react';

interface ImportLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistImported?: (id: string) => void;
  onAddToPlaylist?: (track: Track) => void;
}

export const ImportLinkModal: React.FC<ImportLinkModalProps> = ({
  isOpen,
  onClose,
  onPlaylistImported,
  onAddToPlaylist
}) => {
  const { playTrack, addToQueue } = usePlayer();
  const { createPlaylist, addTrackToPlaylist, toggleSaveTrack, isSavedTrack } = usePlaylists();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importedTrack, setImportedTrack] = useState<Track | null>(null);
  const [importedPlaylist, setImportedPlaylist] = useState<Playlist | null>(null);

  if (!isOpen) return null;

  const detected = detectUrlType(url);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setImportedTrack(null);
    setImportedPlaylist(null);

    try {
      const result = await importFromUrl(url.trim());
      if (result.type === 'track' && result.track) {
        setImportedTrack(result.track);
      } else if (result.type === 'playlist' && result.playlist) {
        const pl = result.playlist;
        const created = createPlaylist(pl.name, pl.description, pl.coverUrl);
        for (const t of pl.tracks) {
          addTrackToPlaylist(created.id, t);
        }
        setImportedPlaylist(created);
        if (onPlaylistImported) onPlaylistImported(created.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao importar o link.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayImportedTrack = () => {
    if (importedTrack) {
      playTrack(importedTrack);
      onClose();
    }
  };

  const handleAddQueue = () => {
    if (importedTrack) {
      addToQueue(importedTrack);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0e0a14] border border-purple-900/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-950/80 border border-purple-800/40 text-purple-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Importar Link Externo</h3>
              <p className="text-xs text-purple-300/70">
                TikTok (som de vídeo), YouTube (vídeo ou playlist), Spotify
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleImport} className="py-4 space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Cole o link do TikTok, YouTube ou Spotify
            </label>
            <div className="relative">
              <input
                type="url"
                required
                autoFocus
                placeholder="https://www.tiktok.com/@... ou https://youtu.be/... ou playlist"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-3.5 pr-24 py-3 bg-white/5 border border-purple-900/40 focus:border-purple-500 rounded-xl text-white text-xs sm:text-sm focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 flex items-center gap-1.5"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Importar
              </button>
            </div>

            {/* Link preview hint */}
            {detected.platform !== 'unknown' && (
              <p className="text-[11px] text-purple-400 font-mono mt-1.5 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                {detected.isPlaylist ? 'Playlist' : 'Áudio'} do {detected.platform} detectado
              </p>
            )}
          </div>
        </form>

        {/* Error */}
        {errorMsg && (
          <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Imported Track Result */}
        {importedTrack && (
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/40 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                <SafeImage
                  src={importedTrack.coverUrl}
                  videoId={importedTrack.youtubeId}
                  alt={importedTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-white truncate">{importedTrack.title}</h4>
                <p className="text-xs text-slate-400 truncate">{importedTrack.artist}</p>
                <span className="text-[10px] text-purple-400 font-mono">
                  {importedTrack.platform.toUpperCase()} • Áudio Extraído
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePlayImportedTrack}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Tocar Agora
              </button>

              <button
                onClick={() => {
                  if (importedTrack) {
                    toggleSaveTrack(importedTrack);
                  }
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                  isSavedTrack(importedTrack.id)
                    ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isSavedTrack(importedTrack.id) ? 'fill-current text-purple-400' : ''}`} />
                {isSavedTrack(importedTrack.id) ? 'Na Biblioteca' : 'Salvar Biblioteca'}
              </button>

              {onAddToPlaylist && (
                <button
                  onClick={() => {
                    onAddToPlaylist(importedTrack);
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40 flex items-center justify-center gap-1.5 transition-all"
                >
                  <ListPlus className="w-3.5 h-3.5 text-purple-400" />
                  Add Playlist
                </button>
              )}

              <button
                onClick={handleAddQueue}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Fila
              </button>
            </div>
          </div>
        )}

        {/* Imported Playlist Result */}
        {importedPlaylist && (
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                <SafeImage
                  src={importedPlaylist.coverUrl}
                  alt={importedPlaylist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{importedPlaylist.name}</h4>
                <p className="text-xs text-slate-400">{importedPlaylist.tracks.length} músicas importadas</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (onPlaylistImported && importedPlaylist) {
                  onPlaylistImported(importedPlaylist.id);
                  onClose();
                }
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
            >
              Abrir Playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
