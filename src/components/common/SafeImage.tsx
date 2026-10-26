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
  fallbackIconSize = 24,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [errorStage, setErrorStage] = useState<number>(0);

  const getEffectiveSrc = (): string | undefined => {
    if (!src && !videoId) return undefined;
    if (errorStage === 0) {
      if (src && !src.includes('api.piped') && !src.includes('invidious')) return src;
      if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      return src;
    }
    if (videoId) {
      if (errorStage === 1) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      if (errorStage === 2) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      if (errorStage === 3) return `https://i.ytimg.com/vi/${videoId}/0.jpg`;
    }
    return undefined;
  };

  const currentSrc = getEffectiveSrc();

  if (!currentSrc || errorStage > (videoId ? 3 : 1)) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-500 overflow-hidden ${containerClassName || className}`}
        title={alt}
      >
        <Music size={fallbackIconSize} className="opacity-60" />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setErrorStage(prev => prev + 1)}
      className={className}
      {...props}
    />
  );
};
