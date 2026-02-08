import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { fetchProductBySlug } from '@/lib/products';
import { getUnitPriceEurCents, getPriceRange } from '@/lib/pricing';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import MeasurementForm from '@/components/MeasurementForm';
import AdminEditButton from '@/components/AdminEditButton';
import EditableDBField from '@/components/EditableDBField';
import Scrollytelling from '@/components/product/Scrollytelling';
import StickyAddToCart from '@/components/product/StickyAddToCart';
import { Product, MeasurementData } from '@/types';
import { generateFallbackBlocks, EditorialBlock } from '@/types/editorial';

const emptyMeasurements: MeasurementData = {
  bust: '', waist: '', hips: '', shoulder_width: '', arm_length: '', total_length: '', notes: '',
};

const ProductDetail = () => {
  const { slug } = useParams();
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedBraiding, setSelectedBraiding] = useState('');
  const [selectedBraidingColor, setSelectedBraidingColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [measurements, setMeasurements] = useState<MeasurementData>(emptyMeasurements);
  const { isAdmin } = useAuth();
  const ctaRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) {
      fetchProductBySlug(slug).then(p => { setProduct(p); setLoading(false); });
    }
  }, [slug]);

  // Auto-select first option for all selectors
  useEffect(() => {
    if (!product) return;
    if (product.sizes.length > 0) setSelectedSize(product.sizes[0]);
    if (product.colors.length > 0) setSelectedColor(product.colors[0]);
    if (product.braiding_options.length > 0) setSelectedBraiding(product.braiding_options[0]);
    if (product.braiding_colors?.length > 0) setSelectedBraidingColor(product.braiding_colors[0]);
  }, [product]);

  // Editorial blocks: use stored blocks or generate fallback
  const editorialBlocks: EditorialBlock[] = useMemo(() => {
    if (!product) return [];
    if (product.editorial_blocks_json && Array.isArray(product.editorial_blocks_json) && product.editorial_blocks_json.length > 0) {
      return product.editorial_blocks_json;
    }
    return generateFallbackBlocks(product);
  }, [product]);

  // Dynamic price based on selected size
  const displayPrice = useMemo(() => {
    if (!product) return 0;
    return getUnitPriceEurCents(product, selectedSize || undefined);
  }, [product, selectedSize]);

  // Check if product has multiple price tiers
  const priceRange = useMemo(() => {
    if (!product) return null;
    return getPriceRange(product);
  }, [product]);

  const isTU = product?.sizes.length === 1 && product?.sizes[0] === 'TU';

  // Check if all required selections are made
  const isReadyToAdd = useMemo(() => {
    if (!product) return false;
    if (product.sizes.length > 0 && !isTU && !selectedSize) return false;
    if (product.colors.length > 0 && !selectedColor) return false;
    if (product.braiding_options.length > 0 && !selectedBraiding) return false;
    if (product.braiding_colors?.length > 0 && !selectedBraidingColor) return false;
    if (product.made_to_measure) {
      const required = ['bust', 'waist', 'hips'] as const;
      if (required.some(k => !measurements[k])) return false;
    }
    return true;
  }, [product, isTU, selectedSize, selectedColor, selectedBraiding, selectedBraidingColor, measurements]);

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border border-foreground/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-20 luxury-container luxury-section text-center">
        <p className="text-muted-foreground font-body">Produit introuvable.</p>
        <Link to="/boutique" className="luxury-link text-sm mt-4 inline-block">{t('cart.continue')}</Link>
      </div>
    );
  }

  const nameField = language === 'fr' ? 'name_fr' : 'name_en';
  const descField = language === 'fr' ? 'description_fr' : 'description_en';
  const name = language === 'fr' ? product.name_fr : product.name_en;
  const description = language === 'fr' ? product.description_fr : product.description_en;

  const handleAddToCart = () => {
    if (product.made_to_measure) {
      const required = ['bust', 'waist', 'hips'] as const;
      const missing = required.some(k => !measurements[k]);
      if (missing) {
        toast.error(language === 'fr' ? 'Veuillez renseigner vos mesures.' : 'Please provide your measurements.');
        return;
      }
    }
    addItem(product, {
      size: selectedSize || (isTU ? 'TU' : undefined),
      color: selectedColor,
      braiding: selectedBraiding,
      braiding_color: selectedBraidingColor || undefined,
      measurements: product.made_to_measure ? measurements : undefined,
    });
    toast.success(language === 'fr' ? 'Ajouté au panier' : 'Added to cart');
  };

  // Badges
  const badges: { label: string; variant: string }[] = [];
  if (product.made_to_order) badges.push({ label: language === 'fr' ? 'Sur commande' : 'Made to order', variant: 'default' });
  if (product.preorder) badges.push({ label: language === 'fr' ? 'Précommande' : 'Preorder', variant: 'primary' });
  if (product.made_to_measure) badges.push({ label: language === 'fr' ? 'Sur mesure' : 'Bespoke', variant: 'default' });

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead
        title={name}
        description={description}
        path={`/boutique/${product.slug}`}
        image={product.images[0]}
        type="product"
      />
      <div className="luxury-container py-8 md:py-20">
        {/* Breadcrumb */}
        <div className="mb-10 flex items-center gap-2 text-xs font-body text-muted-foreground tracking-wider">
          <Link to="/boutique" className="hover:text-foreground transition-colors">{t('nav.shop')}</Link>
          <span className="text-border">/</span>
          <span className="text-foreground/60">{name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative aspect-[3/4] bg-secondary overflow-hidden rounded-2xl mb-4">
              <img src={product.images[activeImage]} alt={name} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute top-3 right-3 z-30 flex gap-2">
                <AdminEditButton to={`/admin/produits?edit=${product.id}`} />
              </div>
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-14 h-18 sm:w-16 sm:h-20 bg-secondary overflow-hidden rounded-lg border-2 transition-all flex-shrink-0 ${i === activeImage ? 'border-foreground' : 'border-transparent hover:border-foreground/20'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col"
          >
            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {badges.map((b, i) => (
                  <span key={i} className={`inline-block text-[10px] tracking-[0.15em] uppercase font-body px-3 py-1 rounded-full border ${
                    b.variant === 'primary'
                      ? 'border-primary/30 bg-primary/5 text-primary'
                      : 'border-foreground/10 bg-secondary text-muted-foreground'
                  }`}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <EditableDBField
                table="products"
                id={product.id}
                field={nameField}
                value={name}
                onSaved={(v) => setProduct(p => p ? { ...p, [nameField]: v } : p)}
                as="h1"
                className="text-display text-3xl md:text-4xl lg:text-5xl mb-2"
              />
              <AdminEditButton to={`/admin/produits?edit=${product.id}`} />
            </div>

            <p className="text-xl md:text-2xl font-body font-light mb-8 tracking-wide">
              {priceRange?.hasRange && !selectedSize && (
                <span className="text-muted-foreground text-base mr-1">
                  {language === 'fr' ? 'À partir de' : 'From'}
                </span>
              )}
              {formatPrice(displayPrice, product.price_overrides)}
            </p>

            {/* Made to order info */}
            {product.made_to_order && product.made_to_order_min_days && product.made_to_order_max_days && (
              <div className="border border-foreground/10 rounded-xl p-4 mb-6">
                <p className="text-xs font-body tracking-wider text-muted-foreground">
                  {t('shop.crafting_time', { min: product.made_to_order_min_days, max: product.made_to_order_max_days })}
                </p>
              </div>
            )}

            {product.preorder && (
              <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 mb-6">
                <p className="text-xs font-body tracking-wider text-primary">
                  {t('shop.preorder')} — {product.preorder_ship_date_estimate}
                </p>
              </div>
            )}

            <EditableDBField
              table="products"
              id={product.id}
              field={descField}
              value={description}
              onSaved={(v) => setProduct(p => p ? { ...p, [descField]: v } : p)}
              as="p"
              className="text-sm font-body text-muted-foreground leading-relaxed mb-10"
              multiline
            />

            {/* Options section - ref for scroll-to */}
            <div ref={optionsRef}>
            {/* Size - hide if TU (auto-selected) */}
            {product.sizes.length > 0 && !isTU && (
              <div className="mb-6">
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-3">{t('product.select_size')}</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => {
                    const sizePrice = product.price_by_size_eur?.[size];
                    const showPrice = priceRange?.hasRange && sizePrice != null;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border text-xs font-body tracking-wider rounded-lg transition-all ${
                          selectedSize === size
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-foreground/20 hover:border-foreground/60'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color */}
            {product.colors.length > 0 && (
              <div className="mb-6">
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-3">{t('product.select_color')}</label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border text-xs font-body tracking-wider rounded-lg transition-all ${
                        selectedColor === color
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-foreground/20 hover:border-foreground/60'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Braiding */}
            {product.braiding_options.length > 0 && (
              <div className="mb-6">
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-3">{t('product.braiding')}</label>
                <div className="flex flex-wrap gap-2">
                  {product.braiding_options.map(b => (
                    <button
                      key={b}
                      onClick={() => setSelectedBraiding(b)}
                      className={`px-4 py-2 border text-xs font-body tracking-wider rounded-lg transition-all ${
                        selectedBraiding === b
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-foreground/20 hover:border-foreground/60'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Braiding Color */}
            {product.braiding_colors?.length > 0 && (
              <div className="mb-6">
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-3">
                  {language === 'fr' ? 'Sélectionnez une couleur de tressage' : 'Select a braiding color'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.braiding_colors.map(bc => (
                    <button
                      key={bc}
                      onClick={() => setSelectedBraidingColor(bc)}
                      className={`px-4 py-2 border text-xs font-body tracking-wider rounded-lg transition-all ${
                        selectedBraidingColor === bc
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-foreground/20 hover:border-foreground/60'
                      }`}
                    >
                      {bc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Made-to-Measure Form */}
            {product.made_to_measure && (
              <MeasurementForm measurements={measurements} onChange={setMeasurements} />
            )}

            {/* CTA */}
            <button
              ref={ctaRef}
              onClick={handleAddToCart}
              className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-body rounded-xl hover:bg-luxury-magenta-light transition-colors duration-300 mt-4"
            >
              {product.preorder ? t('shop.preorder_cta') : t('shop.add_to_cart')}
            </button>
            </div> {/* end options ref */}
          </motion.div>
        </div>
      </div>

      {/* Scrollytelling editorial section */}
      {editorialBlocks.length > 0 && (
        <Scrollytelling
          images={product.images}
          blocks={editorialBlocks}
          lang={language}
        />
      )}

      {/* Sticky floating CTA */}
      <StickyAddToCart
        ctaRef={ctaRef}
        optionsRef={optionsRef}
        isReady={isReadyToAdd}
        onAddToCart={handleAddToCart}
        label={product.preorder ? t('shop.preorder_cta') : t('shop.add_to_cart')}
        price={formatPrice(displayPrice, product.price_overrides)}
        productName={name}
      />
    </div>
  );
};

export default ProductDetail;
