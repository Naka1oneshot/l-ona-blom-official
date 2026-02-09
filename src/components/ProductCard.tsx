import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Product } from '@/types';
import { getPriceRange } from '@/lib/pricing';
import { cardImage } from '@/lib/imageOptim';
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
  priority?: boolean;
}

const ProductCard = ({ product, priority = false }: ProductCardProps) => {
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
            src={cardImage(product.images[0])}
            alt={name}
            className="w-full h-full object-cover transition-opacity duration-500 ease-in-out group-hover:opacity-0"
            style={{ imageRendering: 'auto' }}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'low'}
          />
          {(() => {
            const hoverIdx = product.hover_image_index ?? 1;
            const hoverImg = product.images[hoverIdx] || product.images[1];
            return hoverImg ? (
              <img
                src={cardImage(hoverImg)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
                style={{ imageRendering: 'auto' }}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
            ) : null;
          })()}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.2em] uppercase font-body bg-background/90 text-foreground px-5 py-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400 pointer-events-none backdrop-blur-sm">
            {language === 'fr' ? 'Découvrir' : 'Discover'}
          </span>
          {/* Product type badges */}
          {(() => {
            const stockBased = !product.preorder && !product.made_to_measure;
            const inStock = stockBased && product.stock_qty !== null && product.stock_qty > 0;
            const showMadeToOrder = stockBased && !inStock && (product.made_to_order || (product.stock_qty !== null && product.stock_qty === 0));
            return (
              <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
                {inStock && (
                  <span className="text-[9px] tracking-[0.15em] uppercase bg-green-800 text-white px-2.5 py-1 font-body">
                    {language === 'fr' ? 'En stock' : 'In stock'}
                  </span>
                )}
                {showMadeToOrder && (
                  <span className="text-[9px] tracking-[0.15em] uppercase bg-foreground text-background px-2.5 py-1 font-body">
                    {t('shop.made_to_order')}
                  </span>
                )}
                {product.preorder && (
                  <span className="text-[9px] tracking-[0.15em] uppercase bg-primary text-primary-foreground px-2.5 py-1 font-body">
                    {t('shop.preorder')}
                  </span>
                )}
                {product.made_to_measure && (
                  <span className="text-[9px] tracking-[0.15em] uppercase bg-accent text-accent-foreground px-2.5 py-1 font-body">
                    {language === 'fr' ? 'Sur mesure' : 'Bespoke'}
                  </span>
                )}
              </div>
            );
          })()}
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
