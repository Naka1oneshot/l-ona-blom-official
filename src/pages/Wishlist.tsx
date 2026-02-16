import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { supabase } from '@/integrations/supabase/client';
import { mapProduct } from '@/lib/products';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import SEOHead from '@/components/SEOHead';

const PRODUCT_COLUMNS = 'id,slug,status,category,category_id,name_fr,name_en,base_price_eur,price_by_size_eur,price_overrides,images,sizes,colors,materials,braiding_options,braiding_colors,color_hex_map,stock_qty,made_to_order,made_to_measure,preorder,hover_image_index,sort_order,created_at';

const Wishlist = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { ids } = useWishlistContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || ids.size === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .in('id', Array.from(ids))
        .eq('status', 'active');
      setProducts((data || []).map((r: any) => mapProduct(r)));
      setLoading(false);
    })();
  }, [user, ids]);

  const title = language === 'fr' ? 'Mes Favoris' : 'My Wishlist';
  const emptyMsg = language === 'fr'
    ? 'Vous n\'avez pas encore de favoris. Parcourez la boutique et ajoutez vos pièces préférées.'
    : 'You have no favorites yet. Browse the shop and add your favorite pieces.';

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead title={title} description={title} path="/favoris" />
      <section className="luxury-container luxury-section">
        <h1 className="text-display text-4xl md:text-5xl text-center mb-10">{title}</h1>

        {!user ? (
          <div className="text-center py-20 space-y-4">
            <Heart size={48} className="mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground font-body">
              {language === 'fr'
                ? 'Connectez-vous pour accéder à vos favoris.'
                : 'Sign in to access your wishlist.'}
            </p>
            <Link
              to="/connexion"
              className="inline-block px-8 py-3 border border-foreground/20 text-[11px] tracking-[0.2em] uppercase font-body text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
            >
              {language === 'fr' ? 'Se connecter' : 'Sign in'}
            </Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Heart size={48} className="mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground font-body max-w-md mx-auto">{emptyMsg}</p>
            <Link
              to="/boutique"
              className="inline-block px-8 py-3 border border-foreground/20 text-[11px] tracking-[0.2em] uppercase font-body text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
            >
              {language === 'fr' ? 'Découvrir la boutique' : 'Explore the shop'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Wishlist;
