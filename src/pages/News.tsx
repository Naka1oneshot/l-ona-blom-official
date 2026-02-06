import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import SEOHead from '@/components/SEOHead';
import AdminEditButton from '@/components/AdminEditButton';

interface Post {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  content_fr: string | null;
  content_en: string | null;
  cover_image: string | null;
  published_at: string | null;
  tags: string[] | null;
}

const News = () => {
  const { language, t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead
        title={t('nav.news')}
        description={language === 'fr' ? 'Les dernières actualités de la maison LÉONA BLOM.' : 'The latest news from LÉONA BLOM.'}
        path="/actualites"
      />
      <section className="luxury-container luxury-section max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-display text-4xl md:text-5xl text-center mb-16">{t('nav.news')}</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border border-foreground/30 border-t-primary animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground font-body py-20">
              {language === 'fr' ? 'Aucun article pour le moment.' : 'No articles yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {posts.map((post, i) => {
                const title = language === 'fr' ? post.title_fr : post.title_en;
                const content = language === 'fr' ? post.content_fr : post.content_en;
                const excerpt = content ? content.substring(0, 160).replace(/[#*_]/g, '') + '…' : '';

                return (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="relative"
                  >
                    <AdminEditButton
                      to={`/admin/articles?edit=${post.id}`}
                      className="absolute top-2 right-2 z-10"
                    />
                    <Link to={`/actualites/${post.slug}`} className="group block">
                      {post.cover_image && (
                        <div className="aspect-[16/9] overflow-hidden bg-secondary mb-4">
                          <img
                            src={post.cover_image}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <time className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      </time>
                      <h2 className="text-display text-xl md:text-2xl mt-2 mb-2 group-hover:text-primary transition-colors">
                        {title}
                      </h2>
                      <p className="text-sm font-body text-muted-foreground leading-relaxed">{excerpt}</p>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default News;
