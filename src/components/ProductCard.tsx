import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Product } from '@/types';
import { getPriceRange } from '@/lib/pricing';
import AdminEditButton from '@/components/AdminEditButton';
import ColorSwatch from '@/components/product/ColorSwatch';
import BraidingSwatch from '@/components/product/BraidingSwatch';

const COLOR_NAME_FALLBACKS: Record<string, string> = {
  noir: '#000000', noire: '#000000', black: '#000000',
  blanc: '#ffffff', blanche: '#ffffff', white: '#ffffff',
  rouge: '#cc0000', red: '#cc0000', bleu: '#0055aa', bleue: '#0055aa', blue: '#0055aa',
  vert: '#228833', verte: '#228833', green: '#228833', jaune: '#ddcc00', yellow: '#ddcc00',
  rose: '#e8507a', pink: '#e8507a', gris: '#888888', grise: '#888888', grey: '#888888',
  beige: '#d4b896', ivoire: '#fffff0', marron: '#6b3a2a', brown: '#6b3a2a',
  orange: '#dd6600', violet: '#6633aa', magenta: '#981d70',
};

const getHexColors = (map: Record<string, any> | undefined, name: string): string[] => {
  if (map) {
    const val = map[name];
    if (val) {
      if (Array.isArray(val)) { const f = val.filter(Boolean); if (f.length) return f; }
      if (typeof val === 'string' && val) return [val];
    }
  }
  const lower = name.toLowerCase().trim();
  if (COLOR_NAME_FALLBACKS[lower]) return [COLOR_NAME_FALLBACKS[lower]];
  for (const word of lower.split(/[\s,]+/)) {
    if (COLOR_NAME_FALLBACKS[word]) return [COLOR_NAME_FALLBACKS[word]];
  }
  return [];
};

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();

  const name = language === 'fr' ? product.name_fr : product.name_en;

  const colorsWithHex = product.colors
    .map(c => ({ name: c, hexes: getHexColors(product.color_hex_map, c), type: 'color' as const }))
    .filter(c => c.hexes.length > 0);

  const braidingWithHex = (product.braiding_colors || [])
    .map(c => ({ name: c, hexes: getHexColors(product.color_hex_map, c), type: 'braiding' as const }))
    .filter(c => c.hexes.length > 0);

  // Interleave: color, braiding, color, braiding…
  const interleaved: { name: string; hexes: string[]; type: 'color' | 'braiding' }[] = [];
  const maxLen = Math.max(colorsWithHex.length, braidingWithHex.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < colorsWithHex.length) interleaved.push(colorsWithHex[i]);
    if (i < braidingWithHex.length) interleaved.push(braidingWithHex[i]);
  }

  const maxSwatches = 5;

  return (
    <div className="relative group">
      <AdminEditButton
        to={`/admin/produits?edit=${product.id}`}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Link to={`/boutique/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary mb-4">
          <img
            src={product.images[0]}
            alt={name}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'auto' }}
            loading="lazy"
          />
          {product.made_to_order && (
            <span className="absolute top-4 left-4 text-[9px] tracking-[0.2em] uppercase bg-foreground text-background px-3 py-1.5 font-body">
              {t('shop.made_to_order')}
            </span>
          )}
          {product.preorder && (
            <span className="absolute top-4 left-4 text-[9px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-3 py-1.5 font-body">
              {t('shop.preorder')}
            </span>
          )}
        </div>
        <h3 className="text-display text-sm sm:text-lg mb-0.5 sm:mb-1 line-clamp-2">{name}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-body text-muted-foreground">
            {(() => {
              const range = getPriceRange(product);
              if (range.hasRange) {
                return `${language === 'fr' ? 'À partir de ' : 'From '}${formatPrice(range.min, product.price_overrides)}`;
              }
              return formatPrice(range.min, product.price_overrides);
            })()}
          </p>
          {interleaved.length > 0 && (
            <div className="flex items-center gap-1">
              {interleaved.slice(0, maxSwatches).map(c =>
                c.type === 'braiding' ? (
                  <BraidingSwatch key={`b-${c.name}`} colors={c.hexes} size={14} />
                ) : (
                  <ColorSwatch key={`c-${c.name}`} colors={c.hexes} size={14} />
                )
              )}
              {interleaved.length > maxSwatches && (
                <span className="text-[10px] text-muted-foreground font-body ml-0.5">+{interleaved.length - maxSwatches}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
