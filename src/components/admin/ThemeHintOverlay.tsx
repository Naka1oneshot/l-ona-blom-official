import React, { useEffect, useState, useCallback } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface HintZone {
  /** CSS selector or element matcher */
  match: (el: Element) => boolean;
  /** Label shown in tooltip — should match FloatingThemeEditor labels */
  label: string;
  /** Corresponding cssVar in the theme panel */
  cssVar: string;
}

const hintZones: HintZone[] = [
  {
    match: (el) => !!el.closest('footer'),
    label: 'Fond footer',
    cssVar: 'footer-bg',
  },
  {
    match: (el) => !!el.closest('header'),
    label: 'Fond de page (header)',
    cssVar: 'background',
  },
  {
    match: (el) => !!el.closest('[class*="ProductCard"], [class*="product-card"]') || !!el.closest('.bg-card, [class*="card"]'),
    label: 'Fond carte',
    cssVar: 'card',
  },
  {
    match: (el) => {
      const tag = el.tagName;
      if (['BUTTON', 'A'].includes(tag)) {
        const cl = el.className || '';
        if (cl.includes('bg-primary') || cl.includes('btn-primary') || cl.includes('from-primary')) return true;
      }
      return false;
    },
    label: 'Couleur principale (CTA)',
    cssVar: 'primary',
  },
  {
    match: (el) => {
      const tag = el.tagName;
      return ['H1', 'H2', 'H3', 'P', 'SPAN', 'LI'].includes(tag) && !el.closest('footer') && !el.closest('header');
    },
    label: 'Texte principal',
    cssVar: 'foreground',
  },
  {
    match: (el) => !!el.closest('main'),
    label: 'Fond de page',
    cssVar: 'background',
  },
];

const ThemeHintOverlay = () => {
  const { editMode } = useEditMode();
  const isMobile = useIsMobile();
  const [hint, setHint] = useState<{ label: string; x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) { setHint(null); return; }

    // Don't show hints over the theme editor itself
    if (el.closest('[data-theme-editor]')) { setHint(null); return; }

    for (const zone of hintZones) {
      if (zone.match(el)) {
        setHint({ label: zone.label, x: e.clientX, y: e.clientY });
        return;
      }
    }
    setHint(null);
  }, []);

  useEffect(() => {
    if (!editMode || isMobile) return;
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [editMode, isMobile, handleMouseMove]);

  if (!editMode || isMobile || !hint) return null;

  return (
    <div
      className="fixed z-[9998] pointer-events-none px-2.5 py-1 rounded bg-foreground/85 text-background text-[10px] font-body tracking-wide whitespace-nowrap backdrop-blur-sm"
      style={{
        left: hint.x + 14,
        top: hint.y - 8,
        transform: 'translateY(-100%)',
      }}
    >
      🎨 {hint.label}
    </div>
  );
};

export default ThemeHintOverlay;
