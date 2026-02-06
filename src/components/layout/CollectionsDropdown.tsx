import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface CollectionItem {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  subtitle_fr: string | null;
  subtitle_en: string | null;
  cover_image: string | null;
}

interface CollectionsDropdownProps {
  label: string;
  className?: string;
  onNavigate?: () => void;
}

const CollectionsDropdown = ({ label, className = '', onNavigate }: CollectionsDropdownProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('collections')
      .select('id, slug, title_fr, title_en, subtitle_fr, subtitle_en, cover_image')
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => setCollections(data || []));
  }, []);

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        to="/collections"
        className={className}
        onClick={(e) => {
          if (collections.length > 0) {
            e.preventDefault();
            setOpen(prev => !prev);
          }
        }}
      >
        {label}
      </Link>

      <AnimatePresence>
        {open && collections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed left-0 right-0 top-16 md:top-20 z-[60] bg-background border-b border-foreground/10 shadow-xl"
          >
            <div className="luxury-container py-8">
              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(collections.length, 4)}, 1fr)`,
                }}
              >
                {collections.map((c) => {
                  const title = language === 'fr' ? c.title_fr : c.title_en;
                  const subtitle = language === 'fr' ? c.subtitle_fr : c.subtitle_en;
                  return (
                    <Link
                      key={c.id}
                      to={`/collections/${c.slug}`}
                      className="group block"
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                    >
                      <p className="text-xs tracking-[0.15em] uppercase font-body font-medium mb-1 group-hover:text-primary transition-colors">
                        {title}
                      </p>
                      {subtitle && (
                        <p className="text-[11px] text-muted-foreground font-body mb-3">
                          {subtitle}
                        </p>
                      )}
                      <div className="aspect-[3/4] overflow-hidden bg-muted">
                        {c.cover_image ? (
                          <img
                            src={c.cover_image}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/collections"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground hover:text-foreground transition-colors luxury-link"
                >
                  {language === 'fr' ? 'Voir toutes les collections' : 'View all collections'}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollectionsDropdown;
