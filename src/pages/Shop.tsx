import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { mapProduct } from '@/lib/products';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { useCategories } from '@/hooks/useCategories';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import SEOHead from '@/components/SEOHead';
import ShopFilterBar, { SortOption } from '@/components/shop/ShopFilterBar';

const PAGE_SIZE = 12;

const PRODUCT_COLUMNS = 'id,slug,status,category,category_id,name_fr,name_en,base_price_eur,price_by_size_eur,price_overrides,images,sizes,colors,materials,braiding_options,braiding_colors,color_hex_map,stock_qty,made_to_order,made_to_measure,preorder,hover_image_index,sort_order,created_at';

const Shop = () => {
  const { t, language } = useLanguage();
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortOption>('default');
  const { groups } = useCategories();

  const categorySlug = searchParams.get('category');
  const groupSlug = searchParams.get('group');

  const buildQuery = useCallback(async (from: number, to: number) => {
    const [{ data: catData }, { data: groupData }] = await Promise.all([
      supabase.from('categories').select('id,slug,group_id'),
      supabase.from('category_groups').select('id,slug'),
    ]);

    const cats = catData || [];
    const allGroups = groupData || [];

    let filterCategoryIds: string[] | null = null;

    if (categorySlug) {
      const cat = cats.find((c: any) => c.slug === categorySlug);
      if (cat) filterCategoryIds = [cat.id];
      else filterCategoryIds = [];
    } else if (groupSlug) {
      const group = allGroups.find((g: any) => g.slug === groupSlug);
      if (group) {
        filterCategoryIds = cats.filter((c: any) => c.group_id === group.id).map((c: any) => c.id);
      } else {
        filterCategoryIds = [];
      }
    }

    let query = supabase.from('products').select(PRODUCT_COLUMNS, { count: 'exact' });

    if (!isAdmin) {
      query = query.eq('status', 'active');
    }

    if (filterCategoryIds !== null) {
      if (filterCategoryIds.length === 0) return { mapped: [], totalCount: 0 };
      query = query.in('category_id', filterCategoryIds);
    }

    // Apply sort
    switch (sort) {
      case 'price-asc':
        query = query.order('base_price_eur', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('base_price_eur', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
    }

    const { data: prodData, count } = await query.range(from, to);
    const mapped = (prodData || []).map((row: any) => mapProduct(row));
    return { mapped, totalCount: count ?? 0 };
  }, [categorySlug, groupSlug, isAdmin, sort]);

  // Initial load
  useEffect(() => {
    setProducts([]);
    setPage(0);
    setHasMore(true);
    (async () => {
      setLoading(true);
      const { mapped, totalCount: tc } = await buildQuery(0, PAGE_SIZE - 1);
      setProducts(mapped);
      setTotalCount(tc);
      setHasMore(PAGE_SIZE < tc);
      setPage(1);
      setLoading(false);
    })();
  }, [categorySlug, groupSlug, buildQuery]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { mapped, totalCount: tc } = await buildQuery(from, to);
    setProducts(prev => [...prev, ...mapped]);
    setTotalCount(tc);
    setHasMore((page + 1) * PAGE_SIZE < tc);
    setPage(prev => prev + 1);
    setLoadingMore(false);
  };

  const handleFilterChange = (params: { category?: string; group?: string }) => {
    const sp = new URLSearchParams();
    if (params.category) sp.set('category', params.category);
    else if (params.group) sp.set('group', params.group);
    setSearchParams(sp);
  };

  const shopTitle = language === 'fr' ? 'Boutique' : 'Shop';
  const shopDesc = language === 'fr'
    ? 'Découvrez nos créations haute couture : robes, ensembles et accessoires en soie, lin et coton.'
    : 'Discover our haute couture creations: dresses, ensembles and accessories in silk, linen and cotton.';

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead title={shopTitle} description={shopDesc} path="/boutique" />
      <section className="luxury-container luxury-section">
        <h1 className="text-display text-4xl md:text-5xl text-center mb-10">{t('shop.title')}</h1>

        <ShopFilterBar
          groups={groups}
          categorySlug={categorySlug}
          groupSlug={groupSlug}
          sort={sort}
          onFilterChange={handleFilterChange}
          onSortChange={setSort}
          totalCount={totalCount}
        />

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
            {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
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
      </section>
    </div>
  );
};

export default Shop;
