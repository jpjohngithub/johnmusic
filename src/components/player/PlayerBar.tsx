import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { SafeImage } from '../SafeImage';
import { PlatformBadge } from '../PlatformBadge';
import { QueueDrawer } from './QueueDrawer';
import { downloadTrackMp3 } from '../../services/download';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  ListMusic,
  Download,
  Sliders,
  Check,
  Disc,
  ExternalLink
} from 'lucide-react';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    crossfadeDuration,
    activeDeck,
    isCrossfading,
    isShuffle,
    isRepeat,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    setVolume,
    setCrossfadeDuration,
    toggleShuffle,
    toggleRepeat,
    stableAudio,
    toggleStableAudio
  } = usePlayer();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCrossfadeMenu, setShowCrossfadeMenu] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const handleDownload = async () => {
    if (!currentTrack) return;
    setDownloading(true);
    await downloadTrackMp3(currentTrack);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <>
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-[#08060c]/95 backdrop-blur-2xl border-t border-purple-950/40 px-3 md:px-6 py-2.5 md:py-3 shadow-2xl transition-all">
        {/* Mobile thin top progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 md:hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:gap-6">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:max-w-xs">
            <div className="relative w-11 h-11 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg bg-slate-900 border border-white/10">
              <SafeImage
                src={currentTrack.coverUrl}
                videoId={currentTrack.youtubeId}
                alt={currentTrack.title}
                fallbackText={currentTrack.title}
                className="w-full h-full object-cover"
              />
              {/* Spinning deck indicator */}
              <div className="absolute bottom-1 right-1">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/70 text-[8px] font-mono font-bold text-purple-300 border border-purple-500/50">
                  {activeDeck}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs md:text-sm font-bold text-white truncate">
                  {currentTrack.title}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <PlatformBadge platform={currentTrack.platform} size="sm" />
                <p className="text-[11px] md:text-xs text-slate-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
          </div>

          {/* Central Controls */}
          <div className="flex flex-col items-center flex-1 max-w-xl">
            <div className="flex items-center gap-2 md:gap-5">
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-full hidden md:block transition-colors ${
                  isShuffle ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title="Aleatório"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={prevTrack}
                className="p-1.5 md:p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                title="Anterior (Crossfade)"
              >
                <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/30 active:scale-95 transition-transform"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 md:w-6 md:h-6 fill-white" />
                ) : (
                  <Play className="w-5 h-5 md:w-6 md:h-6 fill-white ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-1.5 md:p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                title="Próxima (Crossfade)"
              >
                <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-1.5 rounded-full hidden md:block transition-colors ${
                  isRepeat ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title="Repetir"
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* Áudio Estável (Real-time Audio Normalizer & Dynamic Limiter) */}
              <button
                onClick={toggleStableAudio}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-mono font-medium border transition-all ${
                  stableAudio
                    ? 'bg-purple-600/30 text-purple-300 border-purple-400 shadow-sm shadow-purple-950/40'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200 hover:border-white/20'
                }`}
                title={
                  stableAudio
                    ? 'Áudio Estável ATIVADO: normaliza o som e previne estouros/distorções em tempo real'
                    : 'Áudio Estável DESATIVADO: clique para ativar o nivelamento dinâmico de áudio'
                }
              >
                <Sliders className={`w-3.5 h-3.5 ${stableAudio ? 'text-purple-400' : ''}`} />
                <span className="hidden sm:inline">Áudio Estável</span>
                <span className="sm:hidden">Estável</span>
                {stableAudio && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>

              {/* DJ Crossfade Status Pill */}
              <div className="relative">
                <button
                  onClick={() => setShowCrossfadeMenu(prev => !prev)}
                  className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-mono font-medium border transition-all ${
                    isCrossfading
                      ? 'bg-purple-600/30 text-purple-300 border-purple-400 animate-pulse'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:border-purple-500/50'
                  }`}
                  title="Configurar Crossfade Contínuo"
                >
                  <Disc className={`w-3.5 h-3.5 ${isCrossfading ? 'animate-spin text-purple-400' : ''}`} />
                  <span>DJ {crossfadeDuration}s</span>
                </button>

                {showCrossfadeMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-[#161722] border border-white/15 rounded-xl p-2.5 shadow-2xl z-50 min-w-[170px]">
                    <div className="text-[11px] font-bold text-slate-300 mb-2 px-1 flex items-center justify-between">
                      <span>Rampa Crossfade:</span>
                      <span className="text-purple-400">{crossfadeDuration}s</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[2, 4, 6, 8].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => {
                            setCrossfadeDuration(sec);
                            setShowCrossfadeMenu(false);
                          }}
                          className={`px-2 py-1 rounded text-xs font-mono ${
                            crossfadeDuration === sec
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Scrubber Slider & Timers */}
            <div className="hidden md:flex items-center gap-2.5 w-full mt-1.5">
              <span className="text-[11px] font-mono text-slate-400 w-9 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-colors"
              />
              <span className="text-[11px] font-mono text-slate-400 w-9">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
            {/* Direct In-App MP3 Download Button */}
            <button
              onClick={handleDownload}
              title="Baixar MP3 diretamente"
              className="p-2 rounded-xl text-slate-300 hover:text-purple-400 hover:bg-white/10 transition-colors"
            >
              {downloading ? (
                <Check className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 animate-pulse" />
              ) : (
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>

            {/* Link to original music */}
            <a
              href={
                currentTrack.youtubeId
                  ? `https://www.youtube.com/watch?v=${currentTrack.youtubeId}`
                  : currentTrack.tiktokOriginalUrl
                  ? currentTrack.tiktokOriginalUrl
                  : currentTrack.platform === 'tiktok'
                  ? `https://www.tiktok.com/search?q=${encodeURIComponent(`${currentTrack.artist} ${currentTrack.title}`)}`
                  : currentTrack.platform === 'spotify'
                  ? `https://open.spotify.com/search/${encodeURIComponent(`${currentTrack.artist} ${currentTrack.title}`)}`
                  : `https://www.google.com/search?q=${encodeURIComponent(`${currentTrack.artist} ${currentTrack.title}`)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir música original"
              className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
            </a>

            {/* Queue Toggle Button */}
            <button
              onClick={() => setIsQueueOpen(true)}
              title="Fila de Reprodução"
              className="p-2 rounded-xl text-slate-300 hover:text-purple-400 hover:bg-white/10 transition-colors"
            >
              <ListMusic className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Volume control (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/10">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Drawer */}
      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </>
  );
};
