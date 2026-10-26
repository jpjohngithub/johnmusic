import React, { useState } from 'react';
import { Music } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  videoId?: string;
  fallbackIconSize?: number;
  containerClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  videoId,
  fallbackIconSize = 20,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [errorStage, setErrorStage] = useState<number>(0);

  // Extract YouTube ID from URL or string if possible
  const extractVideoId = (): string | undefined => {
    if (videoId) return videoId;
    if (!src) return undefined;
    const match = src.match(/(?:vi\/|v=|\/vi\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : undefined;
  };

  const effectiveVid = extractVideoId();

  const getEffectiveSrc = (): string | undefined => {
    if (!src && !effectiveVid) return undefined;

    // Stage 0: Initial try
    if (errorStage === 0) {
      if (src && !src.includes('api.piped') && !src.includes('invidious')) {
        return src;
      }
      if (effectiveVid) {
        return `https://i.ytimg.com/vi/${effectiveVid}/hqdefault.jpg`;
      }
      return src;
    }

    // Stage 1: Fallback to YouTube canonical HQ
    if (effectiveVid) {
      if (errorStage === 1) return `https://i.ytimg.com/vi/${effectiveVid}/hqdefault.jpg`;
      if (errorStage === 2) return `https://img.youtube.com/vi/${effectiveVid}/mqdefault.jpg`;
      if (errorStage === 3) return `https://i.ytimg.com/vi/${effectiveVid}/0.jpg`;
    }

    // Stage 4: Try weserv image proxy if direct CDN failed (bypasses CORS/hotlink locks)
    if (src && errorStage <= 4) {
      const cleanUrl = src.replace(/^https?:\/\//, '');
      return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=300&h=300&fit=cover`;
    }

    return undefined;
  };

  const currentSrc = getEffectiveSrc();

  // Se exceder as tentativas ou não tiver URL, renderiza fallback visual impecável (nunca quebrado)
  if (!currentSrc || errorStage > 5) {
    // Letra inicial para badge elegante
    const initial = (alt || '').trim().charAt(0).toUpperCase() || 'M';
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white/50 select-none overflow-hidden relative border border-white/5 ${containerClassName || className}`}
        title={alt}
      >
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[1px]" />
        {initial ? (
          <span className="font-bold text-xs tracking-wider opacity-60 uppercase">{initial}</span>
        ) : (
          <Music size={fallbackIconSize} className="opacity-40" />
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setErrorStage((prev) => prev + 1)}
      className={className}
      {...props}
    />
  );
};
