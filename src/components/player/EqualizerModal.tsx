import React, { useRef, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { EQUALIZER_PRESETS } from '../../data/defaultTracks';
import { X, Sliders, RotateCcw } from 'lucide-react';

export const EqualizerModal: React.FC = () => {
  const { isEqualizerOpen, toggleEqualizer, equalizerGains, setEqualizerGains, activePreset } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bandLabels = ['60 Hz', '230 Hz', '910 Hz', '3.6 kHz', '14 kHz'];
  const bandDescriptions = ['Sub-Graves', 'Graves', 'Médios', 'Médios-Altos', 'Agudos'];

  const handleGainChange = (bandIndex: number, newGain: number) => {
    const nextGains = [...equalizerGains];
    nextGains[bandIndex] = newGain;
    setEqualizerGains(nextGains, 'Personalizado');
  };

  const handleReset = () => {
    const flatPreset = EQUALIZER_PRESETS[0];
    setEqualizerGains(flatPreset.gains, flatPreset.name);
  };

  // Draw smooth curve on Canvas representing the EQ curve
  useEffect(() => {
    if (!isEqualizerOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    // +12dB, 0dB, -12dB lines
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.15);
    ctx.lineTo(width, height * 0.15);
    ctx.moveTo(0, height * 0.85);
    ctx.lineTo(width, height * 0.85);
    ctx.stroke();
    ctx.setLineDash([]);

    // Map bands to points
    const points = equalizerGains.map((gain, i) => {
      const x = (i / (equalizerGains.length - 1)) * (width - 60) + 30;
      const y = centerY - (gain / 12) * (height * 0.38);
      return { x, y };
    });

    // Draw smooth curved line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw band dots
    points.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.fill();
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [equalizerGains, isEqualizerOpen]);

  if (!isEqualizerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Equalizador de Áudio
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  5 Bandas
                </span>
              </h2>
              <p className="text-xs text-slate-400">Ajuste as frequências sonoras em tempo real via Web Audio API</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Resetar Equalizador"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleEqualizer}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* EQ Response Curve Canvas */}
        <div className="relative mb-6 rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-800/80 p-2">
          <div className="absolute top-2 left-3 text-[10px] font-mono text-emerald-400/70 uppercase">
            Curva de Resposta em Frequência
          </div>
          <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-500">
            +12 dB / -12 dB
          </div>
          <canvas 
            ref={canvasRef} 
            width={500} 
            height={130} 
            className="w-full h-28 object-contain"
          />
        </div>

        {/* Sliders Area */}
        <div className="grid grid-cols-5 gap-3 mb-6 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
          {bandLabels.map((label, idx) => {
            const gain = equalizerGains[idx] || 0;
            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-mono font-semibold text-emerald-400">
                  {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)} dB
                </span>

                {/* Vertical Slider Wrapper */}
                <div className="relative h-36 flex items-center justify-center my-1">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={gain}
                    onChange={(e) => handleGainChange(idx, parseFloat(e.target.value))}
                    className="h-32 w-2 appearance-none bg-slate-800 rounded-full cursor-pointer focus:outline-none"
                    style={{
                      writingMode: 'vertical-lr',
                      direction: 'rtl',
                    }}
                  />
                </div>

                <span className="text-xs font-bold text-slate-200">{label}</span>
                <span className="text-[10px] text-slate-500 text-center leading-tight">
                  {bandDescriptions[idx]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Presets List */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Presets Rápidos
          </label>
          <div className="flex flex-wrap gap-2">
            {EQUALIZER_PRESETS.map((preset) => {
              const isActive = activePreset === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => setEqualizerGains(preset.gains, preset.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30' 
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
