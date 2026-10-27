import React, { useState } from 'react';
import { usePlaylists } from '../../context/PlaylistContext';
import { SafeImage } from '../SafeImage';
import { X, Sparkles, Check, Layers } from 'lucide-react';

interface MergePlaylistsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated?: (playlistId: string) => void;
}

export const MergePlaylistsModal: React.FC<MergePlaylistsModalProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated
}) => {
  const { playlists, mergePlaylists } = usePlaylists();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [playlistName, setPlaylistName] = useState('Minha Super Playlist Unificada');
  const [removeDuplicates, setRemoveDuplicates] = useState(true);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedPlaylists = playlists.filter(p => selectedIds.includes(p.id));
  const rawTotalTracks = selectedPlaylists.reduce((acc, p) => acc + p.tracks.length, 0);

  const handleMerge = () => {
    if (selectedIds.length < 2) {
      alert('Selecione pelo menos duas playlists para mesclar!');
      return;
    }
    const name = playlistName.trim() || 'Playlist Mesclada';
    const merged = mergePlaylists(selectedIds, name, removeDuplicates);
    onClose();
    if (onPlaylistCreated) {
      onPlaylistCreated(merged.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[#12141f] border border-white/10 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Mesclar Playlists</h3>
              <p className="text-xs text-slate-400">Unifique Spotify, YouTube e TikTok</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Nome da nova playlist
            </label>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Ex: Mega Mix Verão 2026"
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Selecione as playlists para unificar ({selectedIds.length} selecionadas)
            </label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {playlists.map((pl) => {
                const isSelected = selectedIds.includes(pl.id);
                return (
                  <div
                    key={pl.id}
                    onClick={() => toggleSelect(pl.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500/60 shadow-sm'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                        <SafeImage
                          src={pl.coverUrl}
                          alt={pl.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{pl.name}</p>
                        <p className="text-xs text-slate-400">{pl.tracks.length} músicas</p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-300">Remover músicas duplicadas</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total estimado: ~{rawTotalTracks} músicas
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleMerge}
              disabled={selectedIds.length < 2}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30"
            >
              <Sparkles className="w-4 h-4" />
              Mesclar Playlists
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
