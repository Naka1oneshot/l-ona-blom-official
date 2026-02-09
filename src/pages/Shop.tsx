import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { mapProduct } from '@/lib/products';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { useCategories } from '@/hooks/useCategories';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

const Shop = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { groups } = useCategories();

  const categorySlug = searchParams.get('category');
  const groupSlug = searchParams.get('group');

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Fetch products and categories separately for robustness
      const [{ data: prodData }, { data: catData }, { data: groupData }] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'active').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
        supabase.from('categories').select('*'),
        supabase.from('category_groups').select('*'),
      ]);

      const catMap = new Map((catData || []).map((c: any) => [c.id, c]));
      const groupMap = new Map((groupData || []).map((g: any) => [g.id, g]));

      let mapped = (prodData || []).map((row: any) => {
        const p = mapProduct(row);
        const cat = catMap.get(row.category_id);
        (p as any)._catSlug = cat?.slug || null;
        (p as any)._groupSlug = cat ? groupMap.get(cat.group_id)?.slug || null : null;
        return p;
      });

      // Filter
      if (categorySlug) {
        mapped = mapped.filter((p: any) => p._catSlug === categorySlug);
      } else if (groupSlug) {
        mapped = mapped.filter((p: any) => p._groupSlug === groupSlug);
      }

      setProducts(mapped);
      setLoading(false);
    })();
  }, [categorySlug, groupSlug]);

  const clearFilter = () => setSearchParams({});

  // Resolve breadcrumb parts
  const getName = (item: { name_fr: string; name_en: string | null }) =>
    language === 'en' && item.name_en ? item.name_en : item.name_fr;

  let breadcrumbGroup: { label: string; slug: string } | null = null;
  let breadcrumbCategory: string | null = null;

  if (categorySlug) {
    for (const g of groups) {
      const cat = g.categories.find(c => c.slug === categorySlug);
      if (cat) {
        breadcrumbGroup = { label: getName(g), slug: g.slug };
        breadcrumbCategory = getName(cat);
        break;
      }
    }
    if (!breadcrumbCategory) breadcrumbCategory = categorySlug;
  } else if (groupSlug) {
    const g = groups.find(gr => gr.slug === groupSlug);
    if (g) breadcrumbGroup = { label: getName(g), slug: g.slug };
    if (!breadcrumbGroup) breadcrumbGroup = { label: groupSlug, slug: groupSlug };
  }

  const hasFilter = !!(categorySlug || groupSlug);

  return (
    <div className="pt-20 md:pt-24">
      <section className="luxury-container luxury-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {!hasFilter && (
            <h1 className="text-display text-4xl md:text-5xl text-center mb-6">{t('shop.title')}</h1>
          )}

          {/* Breadcrumb */}
          {hasFilter && (
            <div className="flex items-center justify-center gap-2 mb-10 text-xs tracking-[0.12em] uppercase font-body">
              <Link to="/boutique" onClick={clearFilter} className="text-muted-foreground hover:text-foreground transition-colors">
                {t('shop.title')}
              </Link>
              {breadcrumbGroup && (
                <>
                  <span className="text-muted-foreground">/</span>
                  {breadcrumbCategory ? (
                    <Link
                      to={`/boutique?group=${breadcrumbGroup.slug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {breadcrumbGroup.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{breadcrumbGroup.label}</span>
                  )}
                </>
              )}
              {breadcrumbCategory && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-foreground">{breadcrumbCategory}</span>
                </>
              )}
              <button onClick={clearFilter} className="ml-2 p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X size={12} />
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12"
              >
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="products"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
                  {products.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.06 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>

                {products.length === 0 && (
                  <p className="text-center text-muted-foreground font-body py-20">
                    {language === 'fr' ? 'Aucun produit dans cette catégorie.' : 'No products in this category.'}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
};

export default Shop;
