import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface CollectionItem {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  cover_image: string | null;
}

interface CollectionsDropdownProps {
  className?: string;
  onNavigate?: () => void;
}

const CollectionsDropdown = ({ className, onNavigate }: CollectionsDropdownProps) => {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('collections')
      .select('id, slug, title_fr, title_en, cover_image, published_at')
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

  const handleClick = () => {
    setOpen(false);
    onNavigate?.();
  };

  if (collections.length === 0) {
    return (
      <Link to="/collections" className={className} onClick={onNavigate}>
        {t('nav.collections')}
      </Link>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link to="/collections" className={className}>
        {t('nav.collections')}
      </Link>

      {open && (
        <div className="fixed left-0 right-0 top-16 md:top-20 z-50 bg-background border-b border-foreground/10 shadow-lg">
          <div className="luxury-container py-8">
            <div
              className="grid gap-6"
              style={{
                gridTemplateColumns: `repeat(${Math.min(collections.length, 4)}, 1fr)`,
              }}
            >
              {collections.map((col) => {
                const title = language === 'fr' ? col.title_fr : col.title_en;
                return (
                  <Link
                    key={col.id}
                    to={`/collections/${col.slug}`}
                    className="group block"
                    onClick={handleClick}
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-secondary mb-3">
                      {col.cover_image ? (
                        <img
                          src={col.cover_image}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                    <p className="text-xs tracking-[0.15em] uppercase font-body text-foreground group-hover:text-primary transition-colors">
                      {title}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsDropdown;
