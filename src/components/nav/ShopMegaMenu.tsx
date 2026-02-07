import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories, GroupWithCategories } from '@/hooks/useCategories';
import logoIcon from '@/assets/logo-icon.png';

interface Props {
  className?: string;
  onNavigate?: () => void;
}

const ShopMegaMenu = ({ className, onNavigate }: Props) => {
  const { language, t } = useLanguage();
  const { groups } = useCategories();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = () => { clearTimeout(timeoutRef.current); setOpen(true); };
  const handleLeave = () => { timeoutRef.current = setTimeout(() => setOpen(false), 200); };
  const handleClick = () => { setOpen(false); onNavigate?.(); };

  const getName = (item: { name_fr: string; name_en: string | null }) =>
    language === 'en' && item.name_en ? item.name_en : item.name_fr;

  const activeGroups = groups.filter(g => g.is_active);

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link to="/boutique" className={className}>
        {t('nav.shop')}
      </Link>

      {open && activeGroups.length > 0 && (
        <div
          className="fixed left-0 right-0 top-16 md:top-20 z-50 border-b border-white/10 shadow-2xl bg-foreground"
        >
          <div className="luxury-container py-8">
            <div className="flex justify-between items-start">
              <div className="flex gap-16">
                {activeGroups.map(group => (
                  <div key={group.id} className="min-w-[160px]">
                    <p className="text-xs tracking-[0.25em] uppercase font-body text-white mb-4">
                      {getName(group)}
                    </p>
                    <ul className="space-y-2.5">
                      {group.categories.filter(c => c.is_active).map(cat => (
                        <li key={cat.id}>
                          <Link
                            to={`/boutique?category=${cat.slug}`}
                            onClick={handleClick}
                            className="text-sm font-body text-white/80 hover:text-white transition-colors hover:underline underline-offset-4 decoration-white/30"
                          >
                            {getName(cat)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={`/boutique?group=${group.slug}`}
                      onClick={handleClick}
                      className="inline-block mt-4 text-xs tracking-[0.15em] uppercase font-body text-white hover:text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors"
                    >
                      {language === 'en' ? 'View all' : 'Voir tout'}
                    </Link>
                  </div>
                ))}
              </div>
              <div className="hidden lg:flex items-center self-center">
                <img src={logoIcon} alt="" className="h-24 w-auto opacity-30" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopMegaMenu;
