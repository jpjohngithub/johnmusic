import React, { useState, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { processLocalFiles } from '../../services/localFileService';
import { TrackRow } from '../common/TrackRow';
import { 
  FileAudio, 
  UploadCloud, 
  Play, 
  Shuffle, 
  FolderPlus, 
  Music, 
  Loader2,
  HardDrive
} from 'lucide-react';

export const LocalFilesView: React.FC = () => {
  const { localTracks, addLocalTracks, playTrack } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const parsedTracks = await processLocalFiles(files);
      if (parsedTracks.length > 0) {
        addLocalTracks(parsedTracks);
      }
    } catch (err) {
      console.error('Error processing audio files:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handlePlayAll = () => {
    if (localTracks.length > 0) {
      playTrack(localTracks[0], localTracks);
    }
  };

  const handleShuffleAll = () => {
    if (localTracks.length > 0) {
      const randomIdx = Math.floor(Math.random() * localTracks.length);
      playTrack(localTracks[randomIdx], localTracks);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <FileAudio className="w-8 h-8 text-indigo-400" />
            Arquivos de Música do PC
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Toque seus próprios arquivos MP3, WAV, FLAC, OGG e M4A direto no navegador com áudio de alta fidelidade.
          </p>
        </div>

        {localTracks.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayAll}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              Tocar Todos ({localTracks.length})
            </button>
            <button
              onClick={handleShuffleAll}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Shuffle className="w-4 h-4 text-emerald-400" />
              Aleatório
            </button>
          </div>
        )}
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60'
        }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-6">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
            <h3 className="text-base font-bold text-white">Processando metadados de áudio (ID3)...</h3>
            <p className="text-xs text-slate-400">Extraindo capas, artistas e durações das faixas</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Arraste suas músicas para cá
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Suporta MP3, WAV, FLAC, AAC, OGG e M4A. Nenhum arquivo é enviado para a nuvem; tudo roda 100% no seu dispositivo com total privacidade e velocidade.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                <Music className="w-4 h-4" />
                Selecionar Arquivos
              </button>

              <input
                ref={folderInputRef}
                type="file"
                multiple
                // @ts-ignore
                webkitdirectory=""
                directory=""
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                onClick={() => folderInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all"
              >
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                Importar Pasta Inteira
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Local Tracks List */}
      {localTracks.length > 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              Faixas Carregadas do Computador ({localTracks.length})
            </h2>
          </div>

          <div className="space-y-1">
            {localTracks.map((track, idx) => (
              <TrackRow 
                key={track.id} 
                track={track} 
                index={idx} 
                allTracks={localTracks} 
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum arquivo local adicionado ainda.</p>
          <p className="text-xs text-slate-600 mt-1">Carregue suas músicas favoritas acima para ouvi-las com visualizador e equalizador!</p>
        </div>
      )}
    </div>
  );
};
