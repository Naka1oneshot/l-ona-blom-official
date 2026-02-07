import React, { useRef, useState, useCallback } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomScale?: number;
  lensSize?: number;
}

const ImageZoom = ({ src, alt, className = '', zoomScale = 2.8, lensSize = 200 }: ImageZoomProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Cursor position relative to container in px
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Lens position (centered on cursor)
    setLensPos({
      x: cursorX - lensSize / 2,
      y: cursorY - lensSize / 2,
    });

    // Background position: map cursor % to zoomed image offset
    const pctX = cursorX / rect.width;
    const pctY = cursorY / rect.height;

    // The zoomed image is (zoomScale * rect.width) wide.
    // We want the point under the cursor to appear at the center of the lens.
    setBgPos({
      x: -(pctX * rect.width * zoomScale - lensSize / 2),
      y: -(pctY * rect.height * zoomScale - lensSize / 2),
    });
  }, [lensSize, zoomScale]);

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
          className="absolute pointer-events-none rounded-full border-2 border-background/60 shadow-[0_0_24px_rgba(0,0,0,0.18)] z-20 overflow-hidden"
          style={{
            width: lensSize,
            height: lensSize,
            left: lensPos.x,
            top: lensPos.y,
          }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute max-w-none pointer-events-none"
            style={{
              width: containerRef.current ? containerRef.current.offsetWidth * zoomScale : '100%',
              height: containerRef.current ? containerRef.current.offsetHeight * zoomScale : '100%',
              left: bgPos.x,
              top: bgPos.y,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageZoom;
