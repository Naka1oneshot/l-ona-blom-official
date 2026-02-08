import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Product } from '@/types';
import { getPriceRange } from '@/lib/pricing';
import AdminEditButton from '@/components/AdminEditButton';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();

  const name = language === 'fr' ? product.name_fr : product.name_en;

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
        <p className="text-xs sm:text-sm font-body text-muted-foreground">
          {(() => {
            const range = getPriceRange(product);
            if (range.hasRange) {
              return `${language === 'fr' ? 'À partir de ' : 'From '}${formatPrice(range.min, product.price_overrides)}`;
            }
            return formatPrice(range.min, product.price_overrides);
          })()}
        </p>
      </Link>
    </div>
  );
};

export default ProductCard;
