import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { fetchProductBySlug } from '@/lib/products';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import MeasurementForm from '@/components/MeasurementForm';
import AdminEditButton from '@/components/AdminEditButton';
import EditableDBImage from '@/components/EditableDBImage';
import EditableDBField from '@/components/EditableDBField';
import ImageZoom from '@/components/ImageZoom';
import { Product, MeasurementData } from '@/types';

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
  const [activeImage, setActiveImage] = useState(0);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [measurements, setMeasurements] = useState<MeasurementData>(emptyMeasurements);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (slug) {
      fetchProductBySlug(slug).then(p => { setProduct(p); setLoading(false); });
    }
  }, [slug]);

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
  const storyField = language === 'fr' ? 'story_fr' : 'story_en';
  const name = language === 'fr' ? product.name_fr : product.name_en;
  const description = language === 'fr' ? product.description_fr : product.description_en;
  const story = language === 'fr' ? product.story_fr : product.story_en;
  const materialsText = language === 'fr' ? product.materials_fr : product.materials_en;
  const care = language === 'fr' ? product.care_fr : product.care_en;

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
      size: selectedSize,
      color: selectedColor,
      braiding: selectedBraiding,
      measurements: product.made_to_measure ? measurements : undefined,
    });
    toast.success(language === 'fr' ? 'Ajouté au panier' : 'Added to cart');
  };

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
        <div className="mb-8 flex items-center gap-2 text-xs font-body text-muted-foreground tracking-wider">
          <Link to="/boutique" className="hover:text-foreground transition-colors">{t('nav.shop')}</Link>
          <span>/</span>
          <span>{name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative aspect-[3/4] bg-secondary overflow-hidden mb-4">
              {zoomEnabled ? (
                <ImageZoom
                  src={product.images[activeImage]}
                  alt={name}
                  className="w-full h-full"
                  zoomScale={2.8}
                  lensSize={200}
                />
              ) : (
                <img src={product.images[activeImage]} alt={name} className="w-full h-full object-cover" loading="lazy" />
              )}
              <div className="absolute top-2 right-2 z-30 flex gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setZoomEnabled(z => !z)}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-colors ${
                      zoomEnabled
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background/80 text-foreground/60 hover:bg-background'
                    }`}
                    title={zoomEnabled ? 'Désactiver le zoom' : 'Activer le zoom'}
                  >
                    <Search size={14} />
                  </button>
                )}
                <AdminEditButton
                  to={`/admin/produits?edit=${product.id}`}
                />
              </div>
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-14 h-18 sm:w-16 sm:h-20 bg-secondary overflow-hidden border-2 transition-colors flex-shrink-0 ${i === activeImage ? 'border-foreground' : 'border-transparent'}`}
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
            <div className="flex items-start justify-between gap-4">
              <EditableDBField
                table="products"
                id={product.id}
                field={nameField}
                value={name}
                onSaved={(v) => setProduct(p => p ? { ...p, [nameField]: v } : p)}
                as="h1"
                className="text-display text-3xl md:text-4xl mb-4"
              />
              <AdminEditButton to={`/admin/produits?edit=${product.id}`} />
            </div>
            <p className="text-xl font-body mb-6">
              {formatPrice(product.base_price_eur, product.price_overrides)}
            </p>

            {/* Made to order info */}
            {product.made_to_order && product.made_to_order_min_days && product.made_to_order_max_days && (
              <div className="border border-foreground/10 p-4 mb-6">
                <p className="text-xs font-body tracking-wider text-muted-foreground">
                  {t('shop.crafting_time', { min: product.made_to_order_min_days, max: product.made_to_order_max_days })}
                </p>
              </div>
            )}

            {product.preorder && (
              <div className="border border-primary/30 bg-primary/5 p-4 mb-6">
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
              className="text-sm font-body text-muted-foreground leading-relaxed mb-8"
              multiline
            />

            {/* Size */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-3">{t('product.select_size')}</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border text-xs font-body tracking-wider transition-all ${
                        selectedSize === size
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-foreground/20 hover:border-foreground/60'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
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
                      className={`px-4 py-2 border text-xs font-body tracking-wider transition-all ${
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
                      className={`px-4 py-2 border text-xs font-body tracking-wider transition-all ${
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

            {/* Made-to-Measure Form */}
            {product.made_to_measure && (
              <MeasurementForm measurements={measurements} onChange={setMeasurements} />
            )}

            {/* CTA */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-body hover:bg-luxury-magenta-light transition-colors duration-300"
            >
              {product.preorder ? t('shop.preorder_cta') : t('shop.add_to_cart')}
            </button>

            {/* Story */}
            <div className="mt-12 pt-8 border-t border-foreground/10">
              <h3 className="text-display text-xl mb-4">{t('product.story')}</h3>
              <EditableDBField
                table="products"
                id={product.id}
                field={storyField}
                value={story}
                onSaved={(v) => setProduct(p => p ? { ...p, [storyField]: v } : p)}
                as="p"
                className="text-sm font-body text-muted-foreground leading-relaxed"
                multiline
              />
            </div>

            {/* Materials */}
            <div className="mt-8 pt-6 border-t border-foreground/10">
              <h3 className="text-display text-lg mb-3">{t('product.materials')}</h3>
              <p className="text-sm font-body text-muted-foreground">{materialsText}</p>
            </div>

            {/* Care */}
            <div className="mt-6 pt-6 border-t border-foreground/10">
              <h3 className="text-display text-lg mb-3">{t('product.care')}</h3>
              <p className="text-sm font-body text-muted-foreground">{care}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
