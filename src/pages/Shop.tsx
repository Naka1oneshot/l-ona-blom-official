import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchProducts } from '@/lib/products';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';

const categories = ['all', 'dresses', 'sets', 'tops', 'skirts', 'pants', 'accessories'] as const;
const categoryKeys: Record<string, string> = {
  all: 'shop.all',
  dresses: 'shop.dresses',
  sets: 'shop.sets',
  tops: 'shop.tops',
  skirts: 'shop.skirts',
  pants: 'shop.pants',
  accessories: 'shop.accessories',
};

const Shop = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then(p => { setProducts(p); setLoading(false); });
  }, []);

  const filtered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="pt-20 md:pt-24">
      <section className="luxury-container luxury-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-display text-4xl md:text-5xl text-center mb-12">{t('shop.title')}</h1>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs tracking-[0.2em] uppercase font-body px-4 py-2 border transition-all duration-300 ${
                  activeCategory === cat
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-foreground/20 hover:border-foreground/60'
                }`}
              >
                {t(categoryKeys[cat])}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border border-foreground/30 border-t-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                {filtered.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground font-body py-20">
                  {activeCategory !== 'all' ? 'Aucun produit dans cette catégorie.' : 'Aucun produit pour le moment.'}
                </p>
              )}
            </>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default Shop;
