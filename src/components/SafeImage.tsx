import React, { useState, useEffect } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  videoId?: string;
  fallbackText?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  videoId,
  fallbackText,
  ...props
}) => {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Build cascade list
  const getCandidateUrls = (): string[] => {
    const list: string[] = [];
    if (src && src.trim()) {
      list.push(src);
      if (!src.includes('weserv.nl')) {
        list.push(`https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=300&h=300&fit=cover`);
      }
    }
    if (videoId) {
      list.push(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
      list.push(`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`);
      list.push(`https://images.weserv.nl/?url=https://i.ytimg.com/vi/${videoId}/hqdefault.jpg&w=300&h=300&fit=cover`);
    }
    return list;
  };

  const candidates = getCandidateUrls();

  useEffect(() => {
    setCurrentSrcIndex(0);
    setHasError(false);
  }, [src, videoId]);

  const handleError = () => {
    if (currentSrcIndex < candidates.length - 1) {
      setCurrentSrcIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  // Intercept YouTube's fake 120x90 gray TV placeholder
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth === 120 && img.naturalHeight === 90) {
      handleError();
    }
  };

  if (hasError || candidates.length === 0) {
    const letter = (fallbackText || alt || 'M').charAt(0).toUpperCase();
    return (
      <div
        className={`flex items-center justify-center font-bold text-purple-300 shadow-inner bg-[#181126] border border-purple-800/40 ${className}`}
        aria-label={alt}
      >
        <span className="drop-shadow-sm">{letter}</span>
      </div>
    );
  }

  return (
    <img
      src={candidates[currentSrcIndex]}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={handleError}
      onLoad={handleLoad}
      className={`object-cover ${className}`}
      {...props}
    />
  );
};
