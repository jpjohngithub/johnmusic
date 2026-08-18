import React, { useRef, useEffect, useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import type { VisualizerMode } from '../../types/music';
import { audioEngine } from '../../services/audioService';
import { X, Activity, Maximize2, Minimize2 } from 'lucide-react';

export const AudioVisualizer: React.FC = () => {
  const { isVisualizerOpen, toggleVisualizer, visualizerMode, setVisualizerMode, isPlaying, currentTrack } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [colorTheme, setColorTheme] = useState<'emerald' | 'cyber' | 'magenta' | 'gold'>('emerald');

  const modes: { id: VisualizerMode; label: string }[] = [
    { id: 'neon-pulse', label: 'Barras Neon' },
    { id: 'wave', label: 'Osciloscópio' },
    { id: 'circle', label: 'Radial Cósmico' },
    { id: 'glow-blocks', label: 'Matrix Digital' },
  ];

  useEffect(() => {
    if (!isVisualizerOpen) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = audioEngine.getFrequencyData();
      const waveData = audioEngine.getWaveformData();

      // Theme Colors
      let color1 = '#10b981'; // Emerald
      let color2 = '#06b6d4'; // Cyan
      let color3 = '#8b5cf6'; // Purple
      if (colorTheme === 'cyber') {
        color1 = '#00f5ff';
        color2 = '#ff007f';
        color3 = '#7928ca';
      } else if (colorTheme === 'magenta') {
        color1 = '#ec4899';
        color2 = '#f43f5e';
        color3 = '#a855f7';
      } else if (colorTheme === 'gold') {
        color1 = '#f59e0b';
        color2 = '#ef4444';
        color3 = '#eab308';
      }

      if (visualizerMode === 'neon-pulse') {
        // Neon Spectrum Bars
        const barCount = 48;
        const barWidth = (width / barCount) * 0.75;
        const gap = (width / barCount) * 0.25;

        for (let i = 0; i < barCount; i++) {
          const sampleIndex = Math.floor((i / barCount) * (freqData.length * 0.7));
          const val = isPlaying ? (freqData[sampleIndex] || 0) : 10 + Math.sin(Date.now() * 0.003 + i) * 8;
          const barHeight = (val / 255) * (height * 0.75);

          const x = i * (barWidth + gap) + gap / 2;
          const y = height - barHeight - 10;

          // Gradient
          const grad = ctx.createLinearGradient(0, y, 0, height);
          grad.addColorStop(0, color1);
          grad.addColorStop(0.5, color2);
          grad.addColorStop(1, color3);

          ctx.fillStyle = grad;
          ctx.shadowColor = color1;
          ctx.shadowBlur = 12;

          // Draw rounded bar
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Mirror reflection
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.shadowBlur = 0;
          ctx.fillRect(x, height - 8, barWidth, Math.min(barHeight * 0.2, 16));
        }
      } else if (visualizerMode === 'wave') {
        // Oscilloscope Waveform
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = color1;
        ctx.shadowColor = color1;
        ctx.shadowBlur = 15;

        const sliceWidth = width / waveData.length;
        let x = 0;

        for (let i = 0; i < waveData.length; i++) {
          const v = isPlaying ? (waveData[i] / 128.0) : 1 + Math.sin(Date.now() * 0.004 + i * 0.1) * 0.1;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Secondary glow line
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else if (visualizerMode === 'circle') {
        // Radial Spectrum Ring
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22;
        const barCount = 64;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Center pulse circle
        const avgEnergy = freqData.reduce((a, b) => a + b, 0) / freqData.length;
        const pulse = isPlaying ? (avgEnergy / 255) * 20 : 5;

        ctx.beginPath();
        ctx.arc(0, 0, baseRadius + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = color2;
        ctx.lineWidth = 2;
        ctx.shadowColor = color2;
        ctx.shadowBlur = 20;
        ctx.stroke();

        for (let i = 0; i < barCount; i++) {
          const rad = (i / barCount) * Math.PI * 2;
          const sampleIndex = Math.floor((i / barCount) * (freqData.length * 0.6));
          const val = isPlaying ? (freqData[sampleIndex] || 0) : 15;
          const barLen = (val / 255) * (height * 0.3);

          const x1 = Math.cos(rad) * (baseRadius + pulse + 4);
          const y1 = Math.sin(rad) * (baseRadius + pulse + 4);
          const x2 = Math.cos(rad) * (baseRadius + pulse + 4 + barLen);
          const y2 = Math.sin(rad) * (baseRadius + pulse + 4 + barLen);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 2 === 0 ? color1 : color3;
          ctx.lineWidth = 3;
          ctx.shadowColor = color1;
          ctx.shadowBlur = 8;
          ctx.stroke();
        }
        ctx.restore();
      } else if (visualizerMode === 'glow-blocks') {
        // Matrix Blocks
        const cols = 32;
        const rows = 16;
        const blockW = width / cols - 4;
        const blockH = height / rows - 3;

        for (let c = 0; c < cols; c++) {
          const sampleIndex = Math.floor((c / cols) * (freqData.length * 0.7));
          const val = isPlaying ? (freqData[sampleIndex] || 0) : 20 + Math.sin(Date.now() * 0.005 + c) * 15;
          const activeRows = Math.floor((val / 255) * rows);

          for (let r = 0; r < rows; r++) {
            const x = c * (blockW + 4) + 2;
            const y = height - (r + 1) * (blockH + 3);

            if (r <= activeRows) {
              const ratio = r / rows;
              ctx.fillStyle = ratio > 0.8 ? color2 : ratio > 0.4 ? color1 : color3;
              ctx.shadowColor = color1;
              ctx.shadowBlur = 6;
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
              ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.roundRect(x, y, blockW, blockH, 2);
            ctx.fill();
          }
        }
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisualizerOpen, visualizerMode, isPlaying, colorTheme]);

  if (!isVisualizerOpen) return null;

  return (
    <div className={`fixed z-50 transition-all duration-300 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in ${
      isFullScreen ? 'inset-0' : 'inset-0'
    }`}>
      <div 
        className={`w-full bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col ${
          isFullScreen ? 'h-full max-w-none' : 'max-w-4xl h-[580px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background track blur glow */}
        {currentTrack?.coverUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-10 blur-3xl pointer-events-none scale-150"
            style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
          />
        )}

        {/* Top Controls */}
        <div className="relative z-10 flex items-center justify-between p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Visualizador de Frequências
                {isPlaying && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {currentTrack ? `${currentTrack.title} — ${currentTrack.artist}` : 'Pronto para reproduzir'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Color Theme Selector */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {(['emerald', 'cyber', 'magenta', 'gold'] as const).map((thm) => (
                <button
                  key={thm}
                  onClick={() => setColorTheme(thm)}
                  className={`w-6 h-6 rounded-lg transition-transform ${
                    thm === 'emerald' ? 'bg-emerald-500' :
                    thm === 'cyber' ? 'bg-cyan-400' :
                    thm === 'magenta' ? 'bg-pink-500' : 'bg-amber-400'
                  } ${colorTheme === thm ? 'scale-110 ring-2 ring-white' : 'opacity-60 hover:opacity-100'}`}
                  title={`Tema ${thm}`}
                />
              ))}
            </div>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isFullScreen ? 'Janela' : 'Tela cheia'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleVisualizer}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Render Area */}
        <div className="relative flex-1 p-6 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={850}
            height={380}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Mode Selector Bottom Bar */}
        <div className="relative z-10 p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-center gap-2">
          {modes.map((mode) => {
            const isActive = visualizerMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setVisualizerMode(mode.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
