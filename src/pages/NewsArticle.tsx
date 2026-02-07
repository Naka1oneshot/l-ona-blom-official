import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import SEOHead from '@/components/SEOHead';
import AdminEditButton from '@/components/AdminEditButton';
import EditableDBField from '@/components/EditableDBField';
import EditableDBImage from '@/components/EditableDBImage';
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
  category: string;
  event_link: string | null;
  event_date: string | null;
  event_location: string | null;
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

  const titleField = language === 'fr' ? 'title_fr' : 'title_en';
  const contentField = language === 'fr' ? 'content_fr' : 'content_en';
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

          <div className="relative aspect-[16/9] overflow-hidden bg-secondary mb-8">
            <EditableDBImage
              table="posts"
              id={post.id}
              field="cover_image"
              value={post.cover_image}
              onSaved={(url) => setPost(p => p ? { ...p, cover_image: url } : p)}
              alt={title}
              className="w-full h-full object-cover"
              folder="posts"
            />
          </div>

          <time className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground">
            {post.published_at ? new Date(post.published_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </time>

          <div className="mt-4 mb-8">
            <EditableDBField
              table="posts"
              id={post.id}
              field={titleField}
              value={title}
              onSaved={(v) => setPost(p => p ? { ...p, [titleField]: v } : p)}
              as="h1"
              className="text-display text-3xl md:text-5xl"
            />
          </div>

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
            <EditableDBField
              table="posts"
              id={post.id}
              field={contentField}
              value={content || ''}
              onSaved={(v) => setPost(p => p ? { ...p, [contentField]: v } : p)}
              as="div"
              className="text-base font-body text-muted-foreground leading-relaxed whitespace-pre-line"
              multiline
            />
          </div>

          {post.category === 'event' && post.event_link && (
            <div className="mt-12 text-center">
              <a
                href={post.event_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary text-primary-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-luxury-magenta-light transition-all duration-500"
              >
                {language === 'fr' ? 'Réserver sa place' : 'Book your spot'}
              </a>
            </div>
          )}
        </motion.div>
      </article>
    </div>
  );
};

export default NewsArticle;
