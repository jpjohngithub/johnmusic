import React, { useState } from 'react';
import { usePlaylists } from '../../context/PlaylistContext';
import { X, Plus, Music } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const { createPlaylist } = usePlaylists();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const pl = createPlaylist(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    onClose();
    if (onCreated) onCreated(pl.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[#12141f] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-base text-white">Criar Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Nome da Playlist
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Minhas Favoritas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              placeholder="Ex: Músicas para ouvir no treino..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
