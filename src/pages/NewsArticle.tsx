import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import SEOHead from '@/components/SEOHead';
import { ArrowLeft } from 'lucide-react';

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

const NewsArticle = () => {
  const { slug } = useParams();
  const { language, t } = useLanguage();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .eq('slug', slug!)
      .maybeSingle()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border border-foreground/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-20 luxury-container luxury-section text-center">
        <p className="text-muted-foreground font-body">
          {language === 'fr' ? 'Article introuvable.' : 'Article not found.'}
        </p>
        <Link to="/actualites" className="luxury-link text-sm mt-4 inline-block">{t('nav.news')}</Link>
      </div>
    );
  }

  const title = language === 'fr' ? post.title_fr : post.title_en;
  const content = language === 'fr' ? post.content_fr : post.content_en;

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead
        title={title}
        description={content ? content.substring(0, 160).replace(/[#*_]/g, '') : ''}
        path={`/actualites/${post.slug}`}
        image={post.cover_image || undefined}
        type="article"
      />
      <article className="luxury-container luxury-section max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link to="/actualites" className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase font-body text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={14} />
            {t('nav.news')}
          </Link>

          {post.cover_image && (
            <div className="aspect-[16/9] overflow-hidden bg-secondary mb-8">
              <img src={post.cover_image} alt={title} className="w-full h-full object-cover" />
            </div>
          )}

          <time className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground">
            {post.published_at ? new Date(post.published_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </time>

          <h1 className="text-display text-3xl md:text-5xl mt-4 mb-8">{title}</h1>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map(tag => (
                <span key={tag} className="text-[10px] tracking-[0.15em] uppercase font-body px-3 py-1 border border-foreground/10">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="prose-luxury">
            {content?.split('\n').map((line, i) => {
              if (!line.trim()) return <br key={i} />;
              if (line.startsWith('## ')) return <h2 key={i} className="text-display text-2xl mt-8 mb-4">{line.replace('## ', '')}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-display text-xl mt-6 mb-3">{line.replace('### ', '')}</h3>;
              return <p key={i} className="text-base font-body text-muted-foreground leading-relaxed mb-4">{line}</p>;
            })}
          </div>
        </motion.div>
      </article>
    </div>
  );
};

export default NewsArticle;
