import React, { useRef, useState, useCallback } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomScale?: number;
  lensSize?: number;
}

const ImageZoom = ({ src, alt, className = '', zoomScale = 2.5, lensSize = 180 }: ImageZoomProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-crosshair ${className}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={handleMove}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />

      {hovering && (
        <div
          className="absolute pointer-events-none rounded-full border-2 border-background/60 shadow-lg z-20 overflow-hidden"
          style={{
            width: lensSize,
            height: lensSize,
            left: `calc(${pos.x}% - ${lensSize / 2}px)`,
            top: `calc(${pos.y}% - ${lensSize / 2}px)`,
          }}
        >
          <img
            src={src}
            alt=""
            className="absolute max-w-none"
            style={{
              width: `${zoomScale * 100}%`,
              height: `${zoomScale * 100}%`,
              left: `${-pos.x * zoomScale + 50}%`,
              top: `${-pos.y * zoomScale + 50}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageZoom;
