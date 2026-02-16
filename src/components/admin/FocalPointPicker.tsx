import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

interface FocalPointPickerProps {
  src: string;
  open: boolean;
  initialFocal?: { x: number; y: number };
  onConfirm: (focal: { x: number; y: number }) => void;
  onCancel: () => void;
  /** Aspect ratios for the 3 device viewports shown as overlays */
  desktopRatio?: number;
  tabletRatio?: number;
  mobileRatio?: number;
}

const DEVICES = [
  { key: 'desktop', label: 'PC', icon: Monitor, color: 'rgba(59,130,246,0.5)', border: 'rgb(59,130,246)' },
  { key: 'tablet', label: 'Tablette', icon: Tablet, color: 'rgba(34,197,94,0.45)', border: 'rgb(34,197,94)' },
  { key: 'mobile', label: 'Mobile', icon: Smartphone, color: 'rgba(249,115,22,0.4)', border: 'rgb(249,115,22)' },
] as const;

const FocalPointPicker = ({
  src,
  open,
  initialFocal = { x: 50, y: 50 },
  onConfirm,
  onCancel,
  desktopRatio = 16 / 7,
  tabletRatio = 4 / 3,
  mobileRatio = 9 / 16,
}: FocalPointPickerProps) => {
  const [focal, setFocal] = useState(initialFocal);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);

  const updateDisplaySize = useCallback(() => {
    const imgEl = containerRef.current?.querySelector('img');
    if (imgEl && imgEl.clientWidth > 0) {
      setDisplaySize({ w: imgEl.clientWidth, h: imgEl.clientHeight });
    }
  }, []);

  useEffect(() => {
    setFocal(initialFocal);
  }, [initialFocal]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setFocal({ x: Math.round(x), y: Math.round(y) });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setFocal({ x: Math.round(x), y: Math.round(y) });
  }, []);

  // Compute viewport rectangles relative to the image container
  const computeViewport = (ratio: number, containerW: number, containerH: number) => {
    // The viewport represents the visible area at `focal` center
    // Scale: the viewport width = containerW, height = containerW / ratio
    // For tall viewports (mobile), width = containerH * ratio, height = containerH
    let vw: number, vh: number;
    if (ratio >= 1) {
      // Landscape: container fills width, viewport clips height
      vw = containerW;
      vh = containerW / ratio;
    } else {
      // Portrait: container fills height, viewport clips width
      vh = containerH;
      vw = containerH * ratio;
    }
    // Clamp to container
    if (vw > containerW) { vh *= containerW / vw; vw = containerW; }
    if (vh > containerH) { vw *= containerH / vh; vh = containerH; }

    // Center on focal point
    const cx = (focal.x / 100) * containerW;
    const cy = (focal.y / 100) * containerH;

    let left = cx - vw / 2;
    let top = cy - vh / 2;
    // Clamp within container
    left = Math.max(0, Math.min(containerW - vw, left));
    top = Math.max(0, Math.min(containerH - vh, top));

    return { left, top, width: vw, height: vh };
  };

  const ratios = [desktopRatio, tabletRatio, mobileRatio];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-display text-lg">
            Point focal de l'image
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground font-body mb-2">
          Cliquez ou glissez pour placer le point focal. Les cadres colorés montrent la zone visible sur chaque appareil.
        </p>

        {/* Legend */}
        <div className="flex gap-4 mb-2">
          {DEVICES.map((d, i) => (
            <div key={d.key} className="flex items-center gap-1.5 text-xs font-body">
              <div className="w-3 h-3 rounded-sm border-2" style={{ borderColor: d.border, backgroundColor: d.color }} />
              <d.icon size={12} className="text-muted-foreground" />
              <span className="text-foreground/70">{d.label}</span>
            </div>
          ))}
        </div>

        {/* Image + overlays */}
        <div
          ref={containerRef}
          className="relative bg-muted/30 rounded overflow-hidden cursor-crosshair select-none"
          style={{ touchAction: 'none' }}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          <img
            src={src}
            alt="Aperçu"
            onLoad={updateDisplaySize}
            className="w-full h-auto block max-h-[55vh] object-contain"
            crossOrigin="anonymous"
            draggable={false}
          />

          {/* Device viewports overlay */}
          {displaySize && (
            <div className="absolute inset-0 pointer-events-none">
              {DEVICES.map((device, i) => {
                const vp = computeViewport(ratios[i], displaySize.w, displaySize.h);
                return (
                  <div
                    key={device.key}
                    className="absolute rounded-sm"
                    style={{
                      left: vp.left,
                      top: vp.top,
                      width: vp.width,
                      height: vp.height,
                      border: `2px ${device.key === 'desktop' ? 'solid' : 'dashed'} ${device.border}`,
                      backgroundColor: 'transparent',
                    }}
                  >
                    <span
                      className="absolute text-[9px] font-body font-medium px-1 rounded-sm"
                      style={{
                        backgroundColor: device.border,
                        color: '#fff',
                        top: device.key === 'desktop' ? 2 : device.key === 'tablet' ? 2 : 'auto',
                        bottom: device.key === 'mobile' ? 2 : 'auto',
                        left: 2,
                      }}
                    >
                      {device.label}
                    </span>
                  </div>
                );
              })}

              {/* Focal point crosshair */}
              {(() => {
                const cx = (focal.x / 100) * displaySize.w;
                const cy = (focal.y / 100) * displaySize.h;
                return (
                  <>
                    <div
                      className="absolute w-6 h-6 border-2 border-white rounded-full shadow-lg"
                      style={{ left: cx - 12, top: cy - 12 }}
                    />
                    <div
                      className="absolute w-2 h-2 bg-white rounded-full shadow"
                      style={{ left: cx - 4, top: cy - 4 }}
                    />
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground font-body text-center">
          Point focal : {focal.x}% × {focal.y}%
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
          <Button onClick={() => onConfirm(focal)}>Valider le point focal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FocalPointPicker;
