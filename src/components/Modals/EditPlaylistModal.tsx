import React, { useState } from 'react';
import { Playlist } from '../../types';
import { usePlaylists } from '../../context/PlaylistContext';
import { SafeImage } from '../SafeImage';
import { X, Edit3, Image, Check } from 'lucide-react';

interface EditPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist | null;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&q=80',
];

export const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({
  isOpen,
  onClose,
  playlist
}) => {
  const { updatePlaylist } = usePlaylists();
  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [coverUrl, setCoverUrl] = useState(playlist?.coverUrl || '');

  React.useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description || '');
      setCoverUrl(playlist.coverUrl || '');
    }
  }, [playlist]);

  if (!isOpen || !playlist) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updatePlaylist(playlist.id, {
      name: name.trim(),
      description: description.trim(),
      coverUrl: coverUrl.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0e0a14] border border-purple-900/40 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-950/80 border border-purple-800/40 text-purple-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Editar Playlist</h3>
              <p className="text-xs text-purple-300/70">Altere o nome, descrição e foto de capa</p>
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
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Cover Preview & URL */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black border border-purple-900/30 flex-shrink-0 shadow-lg">
              <SafeImage src={coverUrl} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                URL da Foto de Capa
              </label>
              <input
                type="url"
                placeholder="https://exemplo.com/foto.jpg"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-purple-900/30 focus:border-purple-500 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Preset covers picker */}
          <div>
            <span className="text-[10px] text-slate-400 font-medium block mb-1.5">
              Ou escolha uma capa pré-definida:
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PRESET_COVERS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCoverUrl(preset)}
                  className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border transition-all ${
                    coverUrl === preset ? 'border-purple-500 scale-105' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Nome da Playlist
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-purple-900/30 focus:border-purple-500 rounded-xl text-white text-sm focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Descrição
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-purple-900/30 focus:border-purple-500 rounded-xl text-white text-xs focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
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
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 shadow-lg shadow-purple-950/50"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
