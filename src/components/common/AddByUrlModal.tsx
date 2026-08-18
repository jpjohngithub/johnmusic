import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { UniversalUrlService } from '../../services/universalUrlService';
import { 
  X, 
  Link as LinkIcon, 
  Loader2, 
  CheckCircle2, 
  Play, 
  Plus, 
  Tv, 
  Video, 
  Music, 
  Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddByUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlaylistId?: string | null;
}

export const AddByUrlModal: React.FC<AddByUrlModalProps> = ({
  isOpen,
  onClose,
  targetPlaylistId
}) => {
  const { playlists, addTrackToPlaylist, playTrack } = usePlayer();
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resolved, setResolved] = useState<any>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>(
    targetPlaylistId || playlists[0]?.id || ''
  );

  if (!isOpen) return null;

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setResolved(null);

    try {
      const result = await UniversalUrlService.resolveTrackFromUrl(urlInput);
      if (result) {
        setResolved(result);
      } else {
        setErrorMsg('Link não reconhecido. Suportamos links do YouTube, TikTok, Spotify e arquivos de áudio (.mp3, .wav).');
      }
    } catch {
      setErrorMsg('Erro ao carregar dados do link. Verifique a URL e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToPlaylist = () => {
    if (!resolved || !selectedPlaylist) return;
    addTrackToPlaylist(selectedPlaylist, resolved.track);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 }
    });

    onClose();
    setUrlInput('');
    setResolved(null);
  };

  const handlePlayNow = () => {
    if (!resolved) return;
    if (selectedPlaylist) {
      addTrackToPlaylist(selectedPlaylist, resolved.track);
    }
    playTrack(resolved.track);
    onClose();
    setUrlInput('');
    setResolved(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500/20 via-pink-500/20 to-emerald-500/20 text-emerald-400 flex items-center justify-center border border-slate-700">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Adicionar por Link
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                  YouTube & TikTok
                </span>
              </h2>
              <p className="text-xs text-slate-400">Cole o link de qualquer vídeo ou áudio do YouTube ou TikTok</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              URL do YouTube / TikTok / Spotify / Áudio
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="https://www.youtube.com/watch?v=... ou https://www.tiktok.com/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isLoading || !urlInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Processar
              </button>
            </div>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Resolved Preview Card */}
        {resolved && (
          <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-slide-up">
            <div className="flex items-center gap-3.5">
              <img
                src={resolved.track.coverUrl}
                alt={resolved.track.title}
                className="w-16 h-16 rounded-xl object-cover shadow border border-slate-800 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  {resolved.platform === 'youtube' && (
                    <span className="px-2 py-0.5 rounded-md bg-red-600/20 text-red-400 text-[10px] font-bold flex items-center gap-1">
                      <Tv className="w-3 h-3" /> YouTube
                    </span>
                  )}
                  {resolved.platform === 'tiktok' && (
                    <span className="px-2 py-0.5 rounded-md bg-pink-600/20 text-pink-400 text-[10px] font-bold flex items-center gap-1">
                      <Video className="w-3 h-3" /> TikTok
                    </span>
                  )}
                  {resolved.platform === 'direct' && (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-600/20 text-cyan-400 text-[10px] font-bold flex items-center gap-1">
                      <Music className="w-3 h-3" /> Web Audio
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Pronto para Tocar
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{resolved.track.title}</h4>
                <p className="text-xs text-slate-400 truncate">{resolved.track.artist}</p>
              </div>
            </div>

            {/* Select Destination Playlist */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Adicionar na Playlist:
              </label>
              <select
                value={selectedPlaylist}
                onChange={(e) => setSelectedPlaylist(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.title} ({pl.trackIds.length} faixas)
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePlayNow}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Tocar Agora
              </button>

              <button
                type="button"
                onClick={handleAddToPlaylist}
                className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Adicionar à Playlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
