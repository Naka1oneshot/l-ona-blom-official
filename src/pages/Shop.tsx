import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { mapProduct } from '@/lib/products';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { useCategories } from '@/hooks/useCategories';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import SEOHead from '@/components/SEOHead';

const PAGE_SIZE = 12;

// Only the columns ProductCard actually needs
const PRODUCT_COLUMNS = 'id,slug,status,category,category_id,name_fr,name_en,base_price_eur,price_by_size_eur,price_overrides,images,sizes,colors,materials,braiding_options,braiding_colors,color_hex_map,stock_qty,made_to_order,made_to_measure,preorder,hover_image_index,sort_order,created_at';

const Shop = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { groups } = useCategories();

  const categorySlug = searchParams.get('category');
  const groupSlug = searchParams.get('group');

  // Build filtered query helper — filters server-side for correct pagination
  const buildQuery = useCallback(async (from: number, to: number) => {
    // Resolve slug → id(s) first so we can filter in the DB query
    const [{ data: catData }, { data: groupData }] = await Promise.all([
      supabase.from('categories').select('id,slug,group_id'),
      supabase.from('category_groups').select('id,slug'),
    ]);

    const cats = catData || [];
    const groups = groupData || [];

    // Determine which category IDs to filter by
    let filterCategoryIds: string[] | null = null;

    if (categorySlug) {
      const cat = cats.find((c: any) => c.slug === categorySlug);
      if (cat) filterCategoryIds = [cat.id];
      else filterCategoryIds = []; // no match → empty results
    } else if (groupSlug) {
      const group = groups.find((g: any) => g.slug === groupSlug);
      if (group) {
        filterCategoryIds = cats
          .filter((c: any) => c.group_id === group.id)
          .map((c: any) => c.id);
      } else {
        filterCategoryIds = [];
      }
    }

    let query = supabase
      .from('products')
      .select(PRODUCT_COLUMNS, { count: 'exact' })
      .eq('status', 'active');

    if (filterCategoryIds !== null) {
      if (filterCategoryIds.length === 0) {
        return { mapped: [], totalCount: 0 };
      }
      query = query.in('category_id', filterCategoryIds);
    }

    const { data: prodData, count } = await query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to);

    const mapped = (prodData || []).map((row: any) => mapProduct(row));

    return { mapped, totalCount: count ?? 0 };
  }, [categorySlug, groupSlug]);

  // Initial load
  useEffect(() => {
    setProducts([]);
    setPage(0);
    setHasMore(true);
    (async () => {
      setLoading(true);
      const { mapped, totalCount } = await buildQuery(0, PAGE_SIZE - 1);
      setProducts(mapped);
      setHasMore(PAGE_SIZE < totalCount);
      setPage(1);
      setLoading(false);
    })();
  }, [categorySlug, groupSlug, buildQuery]);

  // Load more
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { mapped, totalCount } = await buildQuery(from, to);
    setProducts(prev => [...prev, ...mapped]);
    setHasMore((page + 1) * PAGE_SIZE < totalCount);
    setPage(prev => prev + 1);
    setLoadingMore(false);
  };

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

  const shopTitle = language === 'fr' ? 'Boutique' : 'Shop';
  const shopDesc = language === 'fr'
    ? 'Découvrez nos créations haute couture : robes, ensembles et accessoires en soie, lin et coton.'
    : 'Discover our haute couture creations: dresses, ensembles and accessories in silk, linen and cotton.';

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead
        title={breadcrumbCategory || (breadcrumbGroup?.label) || shopTitle}
        description={shopDesc}
        path="/boutique"
      />
      <section className="luxury-container luxury-section">
        <div>
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

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} priority={i < 4} />
                ))}
              </div>

              {products.length === 0 && (
                <p className="text-center text-muted-foreground font-body py-20">
                  {language === 'fr' ? 'Aucun produit dans cette catégorie.' : 'No products in this category.'}
                </p>
              )}

              {hasMore && products.length > 0 && (
                <div className="flex justify-center mt-16 mb-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="group relative px-10 py-3.5 border border-foreground/20 text-[11px] tracking-[0.2em] uppercase font-body text-foreground hover:bg-foreground hover:text-background transition-all duration-300 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        {language === 'fr' ? 'Chargement…' : 'Loading…'}
                      </span>
                    ) : (
                      language === 'fr' ? 'Voir plus' : 'See more'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Shop;
