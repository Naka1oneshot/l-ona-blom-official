import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// Module-level cache: once an image URL has been loaded, never show shimmer again
const loadedUrlCache = new Set<string>();

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  fallbackClassName?: string;
}

const SmartImage = ({
  src,
  alt,
  className,
  sizes,
  priority = false,
  fallbackClassName,
  style,
  ...rest
}: SmartImageProps) => {
  const alreadyCached = !!(src && loadedUrlCache.has(src));
  const [loaded, setLoaded] = useState(alreadyCached);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn('bg-muted', className, fallbackClassName)}
        style={style}
        aria-hidden="true"
      />
    );
  }

  const handleLoad = () => {
    loadedUrlCache.add(src);
    setLoaded(true);
  };

  return (
    <div className={cn('relative overflow-hidden', className)} style={style}>
      {/* Shimmer placeholder — only if never loaded before */}
      {!loaded && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
        onLoad={handleLoad}
        onError={() => setError(true)}
        className={cn(
          'w-full h-full object-cover',
          alreadyCached
            ? 'opacity-100'
            : loaded
              ? 'opacity-100 transition-opacity duration-200'
              : 'opacity-0',
        )}
        style={{ imageRendering: 'auto' }}
        {...rest}
      />
    </div>
  );
};

export default SmartImage;
