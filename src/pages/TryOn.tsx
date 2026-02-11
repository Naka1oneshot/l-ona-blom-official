import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Image as KImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteFeature } from '@/hooks/useSiteFeature';
import { usePoseDetection, computePlacement } from '@/hooks/usePoseDetection';
import { useAuth } from '@/hooks/useAuth';
import { Upload, Download, RotateCcw, HelpCircle, Trash2, Plus, Minus, RotateCw, ShieldCheck, Loader2, FlaskConical } from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────── */
type TryonType = 'top' | 'bottom' | 'dress' | 'accessory';

interface TryonLayer {
  id: string;
  type: TryonType;
  name: string;
  imageUrl: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  width: number;
  height: number;
}

/* ── Hook: load HTML image ──────────────────────────────────── */
function useImage(src: string | null): [HTMLImageElement | null, boolean] {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!src) { setImg(null); setLoaded(false); return; }
    const i = new window.Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => { setImg(i); setLoaded(true); };
    i.onerror = () => setLoaded(true);
    i.src = src;
    return () => { i.onload = null; };
  }, [src]);
  return [img, loaded];
}

/* ── Constants ──────────────────────────────────────────────── */
const BASE_W = 600;
const BASE_H = 800;
const ASPECT = BASE_H / BASE_W; // 4:3

const TryOnPage = () => {
  const { items } = useCart();
  const { language } = useLanguage();
  const { config } = useSiteFeature('virtual_tryon');
  const { isAdmin } = useAuth();
  const allowWithoutPng = config?.allow_without_png !== false;

  /* ── Responsive canvas size ──────────────────────────────── */
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(BASE_W);
  const canvasH = Math.round(canvasW * ASPECT);

  useEffect(() => {
    const measure = () => {
      if (canvasContainerRef.current) {
        const w = Math.min(BASE_W, canvasContainerRef.current.clientWidth);
        setCanvasW(w);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Filter eligible items
  const eligibleItems = items.filter(item => {
    const p = item.product as any;
    if (!p.tryon_enabled) return false;
    if (!p.tryon_type) return false;
    if (!allowWithoutPng && !p.tryon_image_url) return false;
    return true;
  });

  /* ── Admin test mode (refs) ────────────────────────────────── */
  const adminGarmentRef = useRef<HTMLInputElement>(null);
  const [adminTestType, setAdminTestType] = useState<TryonType>('top');

  /* ── Pose detection ────────────────────────────────────────── */
  const { landmarks, detecting, detect } = usePoseDetection();

  /* ── Photo state ──────────────────────────────────────────── */
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoImg] = useImage(photoUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  // Run pose detection when photo loads
  useEffect(() => {
    if (photoImg) {
      detect(photoImg);
    }
  }, [photoImg, detect]);

  const handlePhoto = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
  }, []);

  /* ── Layers state ─────────────────────────────────────────── */
  const [layers, setLayers] = useState<TryonLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Sync transformer
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    if (selectedId) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    trRef.current.nodes([]);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, layers]);

  /* ── Exclusivity logic ────────────────────────────────────── */
  const addLayer = useCallback((item: typeof eligibleItems[0]) => {
    const p = item.product as any;
    const type: TryonType = p.tryon_type;
    const imgUrl = p.tryon_image_url || p.images?.[p.tryon_fallback_image_index ?? 0] || p.images?.[0];
    if (!imgUrl) return;

    const name = language === 'fr' ? p.name_fr : p.name_en;

    const ox = p.tryon_offset_x ?? 0;
    const oy = p.tryon_offset_y ?? 0;
    const adminScale = p.tryon_default_scale;

    let initX: number, initY: number, w: number, h: number, sc: number;

    if (landmarks) {
      // ✅ Pose-based auto-placement
      const placement = computePlacement(landmarks, type, canvasW, canvasH, {
        ox: Number(ox),
        oy: Number(oy),
        defaultScale: adminScale != null ? Number(adminScale) : undefined,
      });
      initX = placement.x;
      initY = placement.y;
      w = placement.width;
      h = placement.height;
      sc = placement.scaleX;
    } else {
      // Fallback: simple heuristic
      const defaultScale = adminScale ?? 0.5;
      initX = canvasW * 0.25 + Number(ox);
      initY = type === 'bottom' ? canvasH * 0.45 : canvasH * 0.1;
      initY += Number(oy);
      w = canvasW * 0.5;
      h = canvasH * 0.4;
      sc = defaultScale;
    }

    const newLayer: TryonLayer = {
      id: `${p.id}-${Date.now()}`,
      type,
      name,
      imageUrl: imgUrl,
      x: initX,
      y: initY,
      scaleX: sc,
      scaleY: sc,
      rotation: 0,
      width: w,
      height: h,
    };

    setLayers(prev => {
      let next = [...prev];
      if (type === 'top') {
        next = next.filter(l => l.type !== 'top' && l.type !== 'dress');
      } else if (type === 'bottom') {
        next = next.filter(l => l.type !== 'bottom' && l.type !== 'dress');
      } else if (type === 'dress') {
        next = next.filter(l => l.type !== 'top' && l.type !== 'bottom' && l.type !== 'dress');
      }
      next.push(newLayer);
      return next;
    });
    setSelectedId(newLayer.id);
  }, [language, landmarks, canvasW, canvasH]);

  const handleAdminGarment = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const fakeItem = {
      product: {
        id: `admin-test-${Date.now()}`,
        tryon_enabled: true,
        tryon_type: adminTestType,
        tryon_image_url: null,
        tryon_fallback_image_index: 0,
        tryon_offset_x: 0,
        tryon_offset_y: 0,
        tryon_default_scale: null,
        images: [url],
        name_fr: 'Test admin',
        name_en: 'Admin test',
      },
      quantity: 1,
    };
    addLayer(fakeItem as any);
  }, [adminTestType, addLayer]);

  const removeLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const resetPosition = useCallback((id: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== id) return l;
      return { ...l, x: canvasW * 0.25, y: l.type === 'bottom' ? canvasH * 0.45 : canvasH * 0.1, scaleX: 0.5, scaleY: 0.5, rotation: 0 };
    }));
  }, [canvasW, canvasH]);

  /* ── Scale / Rotate controls ──────────────────────────────── */
  const adjustLayer = useCallback((id: string, changes: Partial<TryonLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l));
  }, []);

  const scaleSelected = useCallback((delta: number) => {
    if (!selectedId) return;
    setLayers(prev => prev.map(l => {
      if (l.id !== selectedId) return l;
      const ns = Math.max(0.1, l.scaleX + delta);
      return { ...l, scaleX: ns, scaleY: ns };
    }));
  }, [selectedId]);

  const rotateSelected = useCallback((deg: number) => {
    if (!selectedId) return;
    setLayers(prev => prev.map(l => l.id !== selectedId ? l : { ...l, rotation: l.rotation + deg }));
  }, [selectedId]);

  /* ── Export ────────────────────────────────────────────────── */
  const handleExport = useCallback(() => {
    if (!stageRef.current) return;
    // Deselect before export
    setSelectedId(null);
    setTimeout(() => {
      const uri = stageRef.current!.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'essayage-virtuel.png';
      link.href = uri;
      link.click();
    }, 100);
  }, []);

  /* ── Reset ────────────────────────────────────────────────── */
  const handleReset = useCallback(() => {
    setLayers([]);
    setSelectedId(null);
  }, []);

  /* ── Drop zone ────────────────────────────────────────────── */
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handlePhoto(file);
  }, [handlePhoto]);

  const selectedLayer = layers.find(l => l.id === selectedId);

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-24">
      <div className="luxury-container max-w-7xl mx-auto px-4 pb-16">
        <h1 className="text-display text-3xl md:text-4xl text-center mb-2">
          {language === 'fr' ? 'Essayage Virtuel' : 'Virtual Try-On'}
        </h1>
        <p className="text-center text-xs font-body text-muted-foreground mb-8 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} />
          {language === 'fr' ? 'Votre photo reste sur votre appareil.' : 'Your photo stays on your device.'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-6">
          {/* LEFT — Photo upload */}
          <div className="space-y-4">
            <h2 className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground">
              {language === 'fr' ? 'Votre photo' : 'Your photo'}
            </h2>
            <div
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center py-12 px-4 text-center"
            >
              <Upload size={24} className="text-muted-foreground mb-2" />
              <p className="text-xs font-body text-muted-foreground">
                {language === 'fr' ? 'Cliquez ou glissez une photo' : 'Click or drop a photo'}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handlePhoto(f);
                }}
              />
            </div>
            {photoUrl && (
              <img src={photoUrl} alt="Preview" className="w-full aspect-[3/4] object-cover border border-border" />
            )}
            {detecting && (
              <div className="flex items-center gap-2 text-[10px] font-body text-muted-foreground animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                {language === 'fr' ? 'Détection de la pose…' : 'Detecting pose…'}
              </div>
            )}
            {photoImg && !detecting && (
              <p className="text-[10px] font-body text-muted-foreground">
                {landmarks
                  ? (language === 'fr' ? '✓ Pose détectée — placement intelligent actif' : '✓ Pose detected — smart placement active')
                  : (language === 'fr' ? '⚠ Pose non détectée — placement par défaut' : '⚠ Pose not detected — default placement')}
              </p>
            )}
          </div>

          {/* CENTER — Canvas */}
          <div className="flex flex-col items-center gap-4">
            <div ref={canvasContainerRef} className="border border-border bg-secondary/30 overflow-hidden w-full" style={{ maxWidth: BASE_W }}>
              <Stage
                ref={stageRef}
                width={canvasW}
                height={canvasH}
                onMouseDown={e => {
                  if (e.target === e.target.getStage()) setSelectedId(null);
                }}
                onTouchStart={e => {
                  if (e.target === e.target.getStage()) setSelectedId(null);
                }}
              >
                <Layer>
                  {/* Background photo */}
                  {photoImg && (
                    <KImage
                      image={photoImg}
                      width={canvasW}
                      height={canvasH}
                      listening={false}
                    />
                  )}

                  {/* Overlay layers */}
                  {layers.map(layer => (
                    <OverlayImage
                      key={layer.id}
                      layer={layer}
                      isSelected={selectedId === layer.id}
                      onSelect={() => setSelectedId(layer.id)}
                      onChange={(changes) => adjustLayer(layer.id, changes)}
                    />
                  ))}

                  {/* Transformer */}
                  <Transformer
                    ref={trRef}
                    rotateEnabled
                    keepRatio
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 20 || newBox.height < 20) return oldBox;
                      return newBox;
                    }}
                  />
                </Layer>
              </Stage>
            </div>

            {/* Controls toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 text-[10px] tracking-wider uppercase font-body border border-border hover:border-foreground transition-colors">
                <RotateCcw size={12} /> Reset
              </button>
              {selectedId && (
                <>
                  <button onClick={() => scaleSelected(0.05)} className="p-2 border border-border hover:border-foreground transition-colors" title="Agrandir">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => scaleSelected(-0.05)} className="p-2 border border-border hover:border-foreground transition-colors" title="Réduire">
                    <Minus size={14} />
                  </button>
                  <button onClick={() => rotateSelected(15)} className="p-2 border border-border hover:border-foreground transition-colors" title="Rotation">
                    <RotateCw size={14} />
                  </button>
                  <button onClick={() => resetPosition(selectedId)} className="px-3 py-2 text-[10px] tracking-wider uppercase font-body border border-border hover:border-foreground transition-colors">
                    Réinit.
                  </button>
                  <button onClick={() => removeLayer(selectedId)} className="p-2 border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
              <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-wider uppercase font-body bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ml-auto">
                <Download size={12} /> {language === 'fr' ? 'Télécharger' : 'Download'}
              </button>
            </div>

            {/* Rotation slider for selected */}
            {selectedLayer && (
              <div className="w-full max-w-md flex items-center gap-3">
                <span className="text-[10px] font-body text-muted-foreground whitespace-nowrap">Rotation</span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={selectedLayer.rotation}
                  onChange={e => adjustLayer(selectedLayer.id, { rotation: Number(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{Math.round(selectedLayer.rotation)}°</span>
              </div>
            )}
          </div>

          {/* RIGHT — Articles */}
          <div className="space-y-4">
            <h2 className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground">
              {language === 'fr' ? 'Articles éligibles' : 'Eligible items'}
            </h2>
            {eligibleItems.length === 0 && (
              <p className="text-xs font-body text-muted-foreground">
                {language === 'fr' ? 'Aucun article éligible dans votre panier.' : 'No eligible items in your cart.'}
              </p>
            )}
            {eligibleItems.map(item => {
              const p = item.product as any;
              const name = language === 'fr' ? p.name_fr : p.name_en;
              const imgUrl = p.tryon_image_url || p.images?.[p.tryon_fallback_image_index ?? 0] || p.images?.[0];
              const isActive = layers.some(l => l.id.startsWith(p.id));
              return (
                <div key={p.id} className="border border-border p-3 flex gap-3 items-center">
                  {imgUrl && (
                    <img src={imgUrl} alt={name} className="w-12 h-16 object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-medium truncate">{name}</p>
                    <p className="text-[10px] text-muted-foreground font-body uppercase">{p.tryon_type}</p>
                  </div>
                  <button
                    onClick={() => addLayer(item)}
                    className={`text-[10px] tracking-wider uppercase font-body px-3 py-1.5 border transition-colors ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-foreground/20 hover:border-foreground'
                    }`}
                  >
                    {language === 'fr' ? 'Essayer' : 'Try'}
                  </button>
                </div>
              );
            })}

            {/* Help */}
            <div className="border border-border/50 p-3 mt-6">
              <p className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground mb-1">
                <HelpCircle size={12} /> {language === 'fr' ? 'Aide' : 'Help'}
              </p>
              <ul className="text-[10px] font-body text-muted-foreground space-y-1 list-disc pl-4">
                <li>{language === 'fr' ? 'Uploadez votre photo à gauche' : 'Upload your photo on the left'}</li>
                <li>{language === 'fr' ? 'Cliquez "Essayer" pour placer un vêtement' : 'Click "Try" to place a garment'}</li>
                <li>{language === 'fr' ? 'Déplacez, redimensionnez et tournez les vêtements' : 'Move, resize and rotate garments'}</li>
                <li>{language === 'fr' ? 'Téléchargez le résultat en PNG' : 'Download the result as PNG'}</li>
              </ul>
            </div>

            {/* Admin test mode */}
            {isAdmin && (
              <div className="border border-primary/30 bg-primary/5 p-3 mt-6">
                <p className="flex items-center gap-1.5 text-[10px] font-body font-medium text-primary mb-3">
                  <FlaskConical size={12} /> {language === 'fr' ? 'Mode test admin' : 'Admin test mode'}
                </p>
                <p className="text-[10px] font-body text-muted-foreground mb-3">
                  {language === 'fr'
                    ? 'Importez directement une photo de vêtement pour tester l\'éligibilité sans passer par le panier.'
                    : 'Import a garment photo directly to test eligibility without the cart.'}
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] font-body text-muted-foreground block">
                    {language === 'fr' ? 'Type de vêtement' : 'Garment type'}
                  </label>
                  <select
                    value={adminTestType}
                    onChange={e => setAdminTestType(e.target.value as TryonType)}
                    className="w-full text-xs font-body border border-border bg-background px-2 py-1.5"
                  >
                    <option value="top">{language === 'fr' ? 'Haut' : 'Top'}</option>
                    <option value="bottom">{language === 'fr' ? 'Bas' : 'Bottom'}</option>
                    <option value="dress">{language === 'fr' ? 'Robe' : 'Dress'}</option>
                    <option value="accessory">{language === 'fr' ? 'Accessoire' : 'Accessory'}</option>
                  </select>
                  <button
                    onClick={() => adminGarmentRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] tracking-wider uppercase font-body border border-primary text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Upload size={12} /> {language === 'fr' ? 'Importer photo vêtement' : 'Import garment photo'}
                  </button>
                  <input
                    ref={adminGarmentRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleAdminGarment(f);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Overlay Image Component ─────────────────────────────── */
interface OverlayProps {
  layer: TryonLayer;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (changes: Partial<TryonLayer>) => void;
}

const OverlayImage = ({ layer, isSelected, onSelect, onChange }: OverlayProps) => {
  const [img] = useImage(layer.imageUrl);
  const shapeRef = useRef<Konva.Image>(null);

  if (!img) return null;

  return (
    <KImage
      id={layer.id}
      ref={shapeRef}
      image={img}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      scaleX={layer.scaleX}
      scaleY={layer.scaleY}
      rotation={layer.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={e => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        onChange({
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        });
      }}
    />
  );
};

export default TryOnPage;
