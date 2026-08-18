import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { X, Mic2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import type { LyricLine } from '../../types/music';

export const LyricsView: React.FC = () => {
  const { 
    isLyricsOpen, 
    toggleLyrics, 
    currentTrack, 
    currentTime, 
    seek, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack 
  } = usePlayer();

  const activeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lyrics = currentTrack?.lyrics;
  const isSynced = Array.isArray(lyrics) && lyrics.length > 0 && typeof lyrics[0] === 'object';

  // Find active line index
  let activeIndex = -1;
  if (isSynced) {
    const lines = lyrics as LyricLine[];
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= lines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smooth scroll active line into center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isLyricsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl text-white animate-fade-in overflow-hidden">
      {/* Background Glow */}
      {currentTrack?.coverUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-125 pointer-events-none transition-all duration-1000"
          style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
        />
      )}

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Letras em Tempo Real</h2>
            <p className="text-xs text-slate-400">
              {currentTrack?.title} — {currentTrack?.artist}
            </p>
          </div>
        </div>

        <button
          onClick={toggleLyrics}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Lyrics Content */}
      <div 
        ref={containerRef}
        className="relative z-10 flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center max-w-3xl mx-auto w-full scroll-smooth"
      >
        {!lyrics || (Array.isArray(lyrics) && lyrics.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Mic2 className="w-16 h-16 text-slate-600 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-slate-300 mb-2">Sem letras disponíveis para esta faixa</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Você pode adicionar letras personalizadas ou curtir o ritmo instrumental!
            </p>
          </div>
        ) : isSynced ? (
          <div className="w-full space-y-6 text-center">
            {(lyrics as LyricLine[]).map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPassed = idx < activeIndex;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer transition-all duration-300 px-4 py-2 rounded-2xl ${
                    isActive 
                      ? 'text-3xl sm:text-4xl font-extrabold text-white scale-105 drop-shadow-[0_0_25px_rgba(16,185,129,0.7)]' 
                      : isPassed
                      ? 'text-lg sm:text-xl font-medium text-slate-400/80 hover:text-slate-200'
                      : 'text-lg sm:text-xl font-medium text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="whitespace-pre-line text-lg sm:text-xl font-medium text-slate-300 text-center leading-relaxed max-w-xl">
            {typeof lyrics === 'string' ? lyrics : ''}
          </div>
        )}
      </div>

      {/* Bottom Mini Player Controls */}
      <div className="relative z-10 p-4 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center gap-6">
        <button
          onClick={prevTrack}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-all hover:scale-105"
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
        </button>

        <button
          onClick={nextTrack}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
