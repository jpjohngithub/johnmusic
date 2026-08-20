import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { UniversalUrlService } from '../../services/universalUrlService';
import { 
  X, Link as LinkIcon, Loader2, CheckCircle2, Play, Plus, Music, Sparkles, AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddByUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlaylistId?: string | null;
}

// Platform icons as SVGs (inline, no extra deps)
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const PLATFORM_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  note: string;
}> = {
  youtube: {
    label: 'YouTube',
    color: 'text-red-400',
    bgColor: 'bg-red-600/15',
    borderColor: 'border-red-600/30',
    icon: <YouTubeIcon />,
    note: 'Áudio extraído via cobalt.tools'
  },
  tiktok: {
    label: 'TikTok',
    color: 'text-pink-400',
    bgColor: 'bg-pink-600/15',
    borderColor: 'border-pink-600/30',
    icon: <TikTokIcon />,
    note: 'Áudio extraído via TikWM'
  },
  spotify: {
    label: 'Spotify',
    color: 'text-green-400',
    bgColor: 'bg-green-600/15',
    borderColor: 'border-green-600/30',
    icon: <SpotifyIcon />,
    note: 'Faixa do Spotify'
  },
  direct: {
    label: 'Áudio Direto',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-600/15',
    borderColor: 'border-cyan-600/30',
    icon: <Music className="w-3.5 h-3.5" />,
    note: 'Arquivo de áudio direto'
  }
};

export const AddByUrlModal: React.FC<AddByUrlModalProps> = ({
  isOpen,
  onClose,
  targetPlaylistId
}) => {
  const { playlists, addTrackToPlaylist, playTrack } = usePlayer();
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resolved, setResolved] = useState<any>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>(
    targetPlaylistId || playlists[0]?.id || ''
  );

  if (!isOpen) return null;

  const detectPlatform = (url: string): string => {
    if (UniversalUrlService.isYouTubeUrl(url)) return 'youtube';
    if (UniversalUrlService.isTikTokUrl(url)) return 'tiktok';
    if (UniversalUrlService.isSpotifyUrl(url)) return 'spotify';
    if (UniversalUrlService.isDirectAudioUrl(url)) return 'direct';
    return '';
  };

  const detectedPlatform = detectPlatform(urlInput);
  const platformConfig = detectedPlatform ? PLATFORM_CONFIG[detectedPlatform] : null;

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setResolved(null);

    const platform = detectPlatform(urlInput);
    if (platform === 'youtube') {
      setLoadingStep('Extraindo áudio do YouTube...');
    } else if (platform === 'tiktok') {
      setLoadingStep('Extraindo áudio do TikTok...');
    } else if (platform === 'spotify') {
      setLoadingStep('Carregando dados do Spotify...');
    } else {
      setLoadingStep('Processando link...');
    }

    try {
      const result = await UniversalUrlService.resolveTrackFromUrl(urlInput);
      if (result) {
        setResolved(result);
      } else {
        setErrorMsg('Link não reconhecido. Suportamos: YouTube, TikTok, Spotify, e arquivos de áudio (.mp3, .wav, .ogg, etc).');
      }
    } catch {
      setErrorMsg('Erro ao processar o link. Verifique a URL e tente novamente.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleAddToPlaylist = () => {
    if (!resolved || !selectedPlaylist) return;
    addTrackToPlaylist(selectedPlaylist, resolved.track);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    resetAndClose();
  };

  const handlePlayNow = () => {
    if (!resolved) return;
    if (selectedPlaylist) addTrackToPlaylist(selectedPlaylist, resolved.track);
    playTrack(resolved.track);
    resetAndClose();
  };

  const resetAndClose = () => {
    onClose();
    setUrlInput('');
    setResolved(null);
    setErrorMsg('');
  };

  const resolvedConfig = resolved ? PLATFORM_CONFIG[resolved.platform] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={resetAndClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500/20 via-pink-500/20 to-emerald-500/20 text-emerald-400 flex items-center justify-center border border-slate-700">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Adicionar por Link</h2>
              <p className="text-xs text-slate-400">YouTube • TikTok • Spotify • Áudio direto</p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform hint */}
        {platformConfig && !resolved && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-xs font-semibold ${platformConfig.color} ${platformConfig.bgColor} border ${platformConfig.borderColor}`}>
            {platformConfig.icon}
            <span>{platformConfig.label} detectado — {platformConfig.note}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              URL do Vídeo ou Áudio
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="https://youtube.com/watch?v=... ou tiktok.com/... ou spotify.com/..."
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setResolved(null); setErrorMsg(''); }}
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

        {/* Loading state */}
        {isLoading && loadingStep && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin flex-shrink-0" />
            <span className="text-xs text-slate-300">{loadingStep}</span>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {errorMsg}
          </div>
        )}

        {/* Resolved Preview Card */}
        {resolved && resolvedConfig && (
          <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-slide-up">
            <div className="flex items-center gap-3.5">
              <img
                src={resolved.track.coverUrl}
                alt={resolved.track.title}
                className="w-16 h-16 rounded-xl object-cover shadow border border-slate-800 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${resolvedConfig.color} ${resolvedConfig.bgColor} border ${resolvedConfig.borderColor}`}>
                    {resolvedConfig.icon}
                    {resolvedConfig.label}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Pronto
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{resolved.track.title}</h4>
                <p className="text-xs text-slate-400 truncate">{resolved.track.artist}</p>
                {resolved.track.duration > 30 && (
                  <p className="text-[10px] text-emerald-500 mt-0.5">
                    {Math.floor(resolved.track.duration / 60)}:{String(resolved.track.duration % 60).padStart(2, '0')} min
                  </p>
                )}
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

        {/* Tips */}
        {!resolved && !isLoading && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            {Object.entries(PLATFORM_CONFIG).slice(0, 4).map(([key, cfg]) => (
              <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-semibold ${cfg.color} ${cfg.bgColor} border ${cfg.borderColor}`}>
                {cfg.icon}
                <span>{cfg.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
