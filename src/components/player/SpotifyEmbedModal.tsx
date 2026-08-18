import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { X, ExternalLink, Radio } from 'lucide-react';

interface SpotifyEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotifyUriOrUrl?: string;
  title?: string;
}

export const SpotifyEmbedModal: React.FC<SpotifyEmbedModalProps> = ({
  isOpen,
  onClose,
  spotifyUriOrUrl,
  title = 'Spotify Web Player'
}) => {
  const { currentTrack } = usePlayer();

  if (!isOpen) return null;

  // Derive embed URL
  let embedUrl = 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0';
  const target = spotifyUriOrUrl || currentTrack?.spotifyUri || currentTrack?.externalUrl || (currentTrack?.spotifyId ? `spotify:track:${currentTrack.spotifyId}` : '');

  if (target) {
    if (target.startsWith('spotify:')) {
      const parts = target.split(':');
      if (parts.length >= 3) {
        embedUrl = `https://open.spotify.com/embed/${parts[1]}/${parts[2]}?utm_source=generator&theme=0`;
      }
    } else if (target.includes('open.spotify.com/')) {
      const clean = target.replace('open.spotify.com/', 'open.spotify.com/embed/');
      embedUrl = clean.includes('?') ? `${clean}&theme=0` : `${clean}?theme=0`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-green-500/40 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">Player oficial incorporado do Spotify</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {target && (
              <a
                href={target.startsWith('http') ? target : `https://open.spotify.com/${target.replace('spotify:', '').replace(':', '/')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-800 rounded-xl transition-colors"
                title="Abrir no Spotify"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embed Frame */}
        <div className="p-4 bg-black flex items-center justify-center min-h-[380px]">
          <iframe
            src={embedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-2xl shadow-xl"
          />
        </div>
      </div>
    </div>
  );
};
