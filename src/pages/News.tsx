import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import SEOHead from '@/components/SEOHead';
import AdminEditButton from '@/components/AdminEditButton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  category: string;
  event_date: string | null;
}

const CATEGORIES = ['all', 'article', 'interview', 'event'] as const;

const PostCard = ({ post, language, i }: { post: Post; language: string; i: number }) => {
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
        <div className="flex items-center gap-3 mb-1">
          <time className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground">
            {post.published_at ? new Date(post.published_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </time>
          {post.category === 'event' && post.event_date && (
            <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase font-body text-primary">
              <CalendarDays size={12} />
              {new Date(post.event_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
        <h2 className="text-display text-xl md:text-2xl mt-2 mb-2 group-hover:text-primary transition-colors">
          {title}
        </h2>
        <p className="text-sm font-body text-muted-foreground leading-relaxed">{excerpt}</p>
      </Link>
    </motion.article>
  );
};

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
        setPosts((data as unknown as Post[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = (cat: string) =>
    cat === 'all' ? posts : posts.filter(p => p.category === cat);

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead
        title={t('nav.news')}
        description={language === 'fr' ? 'Les dernières actualités de la maison LÉONA BLOM.' : 'The latest news from LÉONA BLOM.'}
        path="/actualites"
      />
      <section className="luxury-container luxury-section max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-display text-4xl md:text-5xl text-center mb-12">{t('nav.news')}</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border border-foreground/30 border-t-primary animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full justify-center bg-transparent gap-1 mb-12">
                {CATEGORIES.map(cat => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="text-xs tracking-[0.15em] uppercase font-body px-5 py-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-none border border-foreground/20 data-[state=active]:border-foreground transition-all"
                  >
                    {t(`news.tab.${cat}`)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {CATEGORIES.map(cat => (
                <TabsContent key={cat} value={cat}>
                  {filtered(cat).length === 0 ? (
                    <p className="text-center text-muted-foreground font-body py-20">
                      {language === 'fr' ? 'Aucun article pour le moment.' : 'No articles yet.'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {filtered(cat).map((post, i) => (
                        <PostCard key={post.id} post={post} language={language} i={i} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default News;
