import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  fallbackClassName?: string;
}

/**
 * Optimised image component with:
 * - lazy/eager loading based on priority
 * - shimmer placeholder while loading
 * - null-safe: renders neutral block when src is missing
 */
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
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          'bg-muted',
          className,
          fallbackClassName,
        )}
        style={style}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={style}>
      {/* Shimmer placeholder */}
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
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
        style={{ imageRendering: 'auto' }}
        {...rest}
      />
    </div>
  );
};

export default SmartImage;
