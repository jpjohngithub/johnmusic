import React, { useState } from 'react';
import { usePlaylists } from '../../context/PlaylistContext';
import { Track } from '../../types';
import { SafeImage } from '../SafeImage';
import { X, Check, Plus } from 'lucide-react';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  track
}) => {
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylists();
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  if (!isOpen || !track) return null;

  const handleAdd = (playlistId: string) => {
    addTrackToPlaylist(playlistId, track);
    setAddedIds(prev => [...prev, playlistId]);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created = createPlaylist(newPlaylistName.trim(), undefined, track.coverUrl);
    addTrackToPlaylist(created.id, track);
    setNewPlaylistName('');
    setShowCreateInput(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[#12141f] border border-white/10 rounded-2xl w-full max-w-md p-5 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="font-bold text-base text-white">Adicionar à Playlist</h3>
            <p className="text-xs text-slate-400 truncate max-w-[260px]">
              "{track.title}" - {track.artist}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {showCreateInput ? (
            <form onSubmit={handleCreateAndAdd} className="p-3 bg-white/5 rounded-xl border border-white/10 mb-2">
              <input
                type="text"
                autoFocus
                placeholder="Nome da nova playlist..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 mb-2"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInput(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40"
                >
                  Criar e Adicionar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateInput(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/20 hover:border-purple-500/50 hover:bg-purple-950/20 text-slate-300 transition-all mb-2"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <Plus className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs font-bold">Nova Playlist...</span>
            </button>
          )}

          {playlists.map((pl) => {
            const isAlreadyIn = pl.tracks.some(t => t.id === track.id) || addedIds.includes(pl.id);
            return (
              <div
                key={pl.id}
                onClick={() => !isAlreadyIn && handleAdd(pl.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isAlreadyIn
                    ? 'bg-purple-900/20 border-purple-500/30 opacity-70 cursor-default'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                    <SafeImage src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{pl.name}</p>
                    <p className="text-[11px] text-slate-400">{pl.tracks.length} músicas</p>
                  </div>
                </div>

                {isAlreadyIn && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <Check className="w-3.5 h-3.5" />
                    Adicionada
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
