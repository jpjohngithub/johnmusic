import React, { useState } from 'react';
import { identifyAndResolveSong } from '../services/audioRecognizer';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylists } from '../context/PlaylistContext';
import { SafeImage } from './SafeImage';
import { Radio, Mic, Monitor, Loader2, Play, Plus, X, Sparkles, Check, Heart, ListPlus } from 'lucide-react';

interface AudioRecognizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToPlaylist?: (track: Track) => void;
}

export const AudioRecognizerModal: React.FC<AudioRecognizerModalProps> = ({
  isOpen,
  onClose,
  onAddToPlaylist
}) => {
  const { playTrack, addToQueue } = usePlayer();
  const { toggleSaveTrack, isSavedTrack } = usePlaylists();
  const [source, setSource] = useState<'system' | 'mic'>('mic');
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [identifiedTrack, setIdentifiedTrack] = useState<Track | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  if (!isOpen) return null;

  const handleStartListening = async () => {
    setIsListening(true);
    setIdentifiedTrack(null);
    setErrorMsg(null);
    setIsAdded(false);

    try {
      const track = await identifyAndResolveSong(source, (secondsLeft) => {
        setCountdown(secondsLeft);
      });

      if (track) {
        setIdentifiedTrack(track);
      } else {
        setErrorMsg('Não foi possível identificar a música. Toque o áudio com volume mais nítido e tente novamente.');
      }
    } catch (err: any) {
      console.warn(err);
      setErrorMsg(err.message || 'Erro ao capturar áudio');
    } finally {
      setIsListening(false);
    }
  };

  const handlePlayNow = () => {
    if (identifiedTrack) {
      playTrack(identifiedTrack);
      onClose();
    }
  };

  const handleAddQueue = () => {
    if (identifiedTrack) {
      addToQueue(identifiedTrack);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0e0a14] border border-purple-900/40 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-950/80 border border-purple-800/40 text-purple-400">
              <Radio className={`w-5 h-5 ${isListening ? 'animate-pulse text-purple-300' : ''}`} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Identificador de Músicas</h3>
              <p className="text-xs text-purple-300/70">Reconheça qualquer áudio do PC ou Mic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Selection */}
        {!isListening && !identifiedTrack && (
          <div className="py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSource('system')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  source === 'system'
                    ? 'bg-purple-950/60 border-purple-500/60 text-white shadow-lg shadow-purple-950/40'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-5 h-5 mb-2 text-purple-400" />
                <p className="font-bold text-xs">Áudio do PC / Aba</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Captura som do computador</p>
              </button>

              <button
                onClick={() => setSource('mic')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  source === 'mic'
                    ? 'bg-purple-950/60 border-purple-500/60 text-white shadow-lg shadow-purple-950/40'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Mic className="w-5 h-5 mb-2 text-purple-400" />
                <p className="font-bold text-xs">Microfone</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Ouve o som ambiente</p>
              </button>
            </div>

            <div className="text-center pt-3">
              <button
                onClick={handleStartListening}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white shadow-xl shadow-purple-950/50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Começar a Ouvir
              </button>
            </div>
          </div>
        )}

        {/* Listening animation */}
        {isListening && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="relative w-28 h-28 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-purple-600/30 animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-purple-900 border border-purple-400/50 flex items-center justify-center shadow-2xl">
                <Radio className="w-8 h-8 text-purple-300 animate-spin" />
              </div>
            </div>
            <h4 className="font-bold text-base text-white">Escutando áudio...</h4>
            <p className="text-xs text-purple-300/80 mt-1">
              Identificando em {countdown} segundos
            </p>
          </div>
        )}

        {/* Result */}
        {identifiedTrack && !isListening && (
          <div className="py-5 space-y-4">
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                <SafeImage
                  src={identifiedTrack.coverUrl}
                  videoId={identifiedTrack.youtubeId}
                  alt={identifiedTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
                  Música Identificada
                </span>
                <h4 className="font-bold text-sm text-white truncate">
                  {identifiedTrack.title}
                </h4>
                <p className="text-xs text-slate-400 truncate">{identifiedTrack.artist}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePlayNow}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-purple-950/40 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                Tocar Agora
              </button>

              <button
                onClick={() => {
                  if (identifiedTrack) {
                    toggleSaveTrack(identifiedTrack);
                  }
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                  isSavedTrack(identifiedTrack.id)
                    ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSavedTrack(identifiedTrack.id) ? 'fill-current text-purple-400' : ''}`} />
                {isSavedTrack(identifiedTrack.id) ? 'Na Biblioteca' : 'Salvar Biblioteca'}
              </button>

              {onAddToPlaylist && (
                <button
                  onClick={() => {
                    onAddToPlaylist(identifiedTrack);
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40 flex items-center justify-center gap-1.5 transition-all"
                >
                  <ListPlus className="w-4 h-4 text-purple-400" />
                  Add Playlist
                </button>
              )}

              <button
                onClick={handleAddQueue}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center gap-1.5 transition-all"
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Adicionado
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Fila
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                setIdentifiedTrack(null);
                setErrorMsg(null);
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1"
            >
              Identificar outra música
            </button>
          </div>
        )}

        {/* Error */}
        {errorMsg && !isListening && (
          <div className="py-4 text-center">
            <p className="text-xs text-red-400 mb-3">{errorMsg}</p>
            <button
              onClick={handleStartListening}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
