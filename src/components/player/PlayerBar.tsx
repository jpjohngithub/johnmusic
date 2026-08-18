import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Heart, 
  Sliders, 
  Activity, 
  ListMusic, 
  Mic2, 
  Clock, 
  Moon,
  Radio
} from 'lucide-react';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    favorites,
    sleepTimerRemaining,
    sleepTimerMinutes,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    toggleEqualizer,
    toggleVisualizer,
    toggleQueue,
    toggleLyrics,
    toggleSpotifyEmbed,
    setSleepTimer,
  } = usePlayer();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  useEffect(() => {
    if (!isScrubbing) {
      setScrubValue(currentTime);
    }
  }, [currentTime, isScrubbing]);

  const isLiked = currentTrack ? favorites.some(f => f.id === currentTrack.id) : false;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubValue(val);
  };

  const handleSeekCommit = () => {
    seek(scrubValue);
    setIsScrubbing(false);
  };

  const progressPercent = duration > 0 ? ((isScrubbing ? scrubValue : currentTime) / duration) * 100 : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-24 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/80 px-4 md:px-6 z-40 flex items-center justify-between select-none">
      {/* Left: Track Details */}
      <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
        {currentTrack ? (
          <>
            <div 
              onClick={toggleLyrics} 
              className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg bg-slate-900 border border-slate-800 flex-shrink-0 cursor-pointer group"
            >
              <img 
                src={currentTrack.coverUrl} 
                alt={currentTrack.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Mic2 className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h4 
                onClick={toggleLyrics}
                className="text-sm font-bold text-slate-100 hover:text-emerald-400 cursor-pointer truncate transition-colors"
              >
                {currentTrack.title}
              </h4>
              <p className="text-xs text-slate-400 hover:underline cursor-pointer truncate">
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={() => currentTrack && toggleFavorite(currentTrack)}
              className={`p-2 rounded-full transition-colors ${
                isLiked ? 'text-pink-500 hover:text-pink-400' : 'text-slate-400 hover:text-white'
              }`}
              title={isLiked ? 'Remover dos favoritos' : 'Favoritar'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </>
        ) : (
          <div className="text-xs text-slate-500 italic">Nenhuma música selecionada</div>
        )}
      </div>

      {/* Center: Controls & Timeline */}
      <div className="flex flex-col items-center gap-2 max-w-xl w-2/4 px-2">
        {/* Buttons */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-lg transition-colors ${
              isShuffle ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
            title={`Aleatório: ${isShuffle ? 'Ativado' : 'Desativado'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            onClick={prevTrack}
            className="p-1.5 text-slate-300 hover:text-white transition-colors hover:scale-110 active:scale-95"
            title="Anterior"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
            title={isPlaying ? 'Pausar' : 'Tocar'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextTrack}
            className="p-1.5 text-slate-300 hover:text-white transition-colors hover:scale-110 active:scale-95"
            title="Próxima"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className={`p-1.5 rounded-lg transition-colors ${
              repeatMode !== 'off' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
            title={`Repetir: ${repeatMode === 'one' ? 'Faixa Atual' : repeatMode === 'all' ? 'Toda a Fila' : 'Desativado'}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="w-full flex items-center gap-3 group">
          <span className="text-[11px] font-mono text-slate-400 w-9 text-right">
            {formatTime(isScrubbing ? scrubValue : currentTime)}
          </span>

          <div className="relative flex-1 flex items-center h-4">
            {/* Custom Track Background */}
            <div className="absolute left-0 right-0 h-1 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 group-hover:from-emerald-400 group-hover:to-cyan-300 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>

            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={isScrubbing ? scrubValue : currentTime}
              onMouseDown={() => setIsScrubbing(true)}
              onTouchStart={() => setIsScrubbing(true)}
              onChange={handleSeekChange}
              onMouseUp={handleSeekCommit}
              onTouchEnd={handleSeekCommit}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <span className="text-[11px] font-mono text-slate-400 w-9">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Tools & Volume */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/4 min-w-[200px]">
        {/* Spotify Web Player Embed Button */}
        <button
          onClick={toggleSpotifyEmbed}
          className="p-2 rounded-xl text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
          title="Abrir Player Oficial do Spotify"
        >
          <Radio className="w-4 h-4 text-green-400" />
        </button>

        {/* Sleep Timer */}
        <div className="relative">
          <button
            onClick={() => setShowSleepMenu(!showSleepMenu)}
            className={`p-2 rounded-xl transition-colors relative ${
              sleepTimerMinutes !== null 
                ? 'text-amber-400 bg-amber-400/10' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Temporizador de Sono (Sleep Timer)"
          >
            <Moon className="w-4 h-4" />
            {sleepTimerRemaining !== null && (
              <span className="absolute -top-1 -right-1 px-1 bg-amber-500 text-[9px] text-slate-950 font-bold rounded-full">
                {Math.ceil(sleepTimerRemaining / 60)}m
              </span>
            )}
          </button>

          {showSleepMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSleepMenu(false)} />
              <div className="absolute right-0 bottom-12 z-40 w-44 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 text-xs text-slate-200 animate-slide-up">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Sleep Timer
                </div>
                {[
                  { label: 'Desativar', min: null },
                  { label: 'Em 15 minutos', min: 15 },
                  { label: 'Em 30 minutos', min: 30 },
                  { label: 'Em 45 minutos', min: 45 },
                  { label: 'Em 60 minutos', min: 60 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setSleepTimer(opt.min);
                      setShowSleepMenu(false);
                    }}
                    className={`w-full px-2.5 py-1.5 text-left rounded-lg transition-colors ${
                      sleepTimerMinutes === opt.min
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Visualizer Toggle */}
        <button
          onClick={toggleVisualizer}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Visualizador de Áudio"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Lyrics Toggle */}
        <button
          onClick={toggleLyrics}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Letras (Karaokê)"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Equalizer Toggle */}
        <button
          onClick={toggleEqualizer}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Equalizador de 5 Bandas"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Queue Toggle */}
        <button
          onClick={toggleQueue}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fila de Reprodução"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2 group ml-1">
          <button
            onClick={toggleMute}
            className="text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Desmutar' : 'Mutar'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <div className="relative w-16 sm:w-20 h-4 flex items-center">
            <div className="absolute left-0 right-0 h-1 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-slate-300 group-hover:bg-emerald-400 transition-colors"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
