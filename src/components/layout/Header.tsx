import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '@/hooks/useCategories';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { Language, Currency } from '@/types';
import { ShoppingBag, Menu, X, Globe, ChevronDown, User, MoreHorizontal, Pencil } from 'lucide-react';
import { useEditMode } from '@/contexts/EditModeContext';
import CollectionsDropdown from './CollectionsDropdown';
import ShopMegaMenu from '@/components/nav/ShopMegaMenu';
import { supabase } from '@/integrations/supabase/client';
import logoWhite from '@/assets/logo-white.png';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const { editMode, toggleEditMode } = useEditMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const [mobileNewsOpen, setMobileNewsOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [collections, setCollections] = useState<{ id: string; slug: string; title_fr: string; title_en: string }[]>([]);
  const location = useLocation();
  const { groups } = useCategories();

  React.useEffect(() => {
    supabase
      .from('collections')
      .select('id, slug, title_fr, title_en')
      .order('created_at', { ascending: false })
      .then(({ data }) => setCollections(data || []));
  }, []);

  const isHome = location.pathname === '/';

  const primaryLinks = [
    { to: '/boutique', label: t('nav.shop') },
    { to: '/collections', label: t('nav.collections') },
    { to: '/a-propos', label: t('nav.about') },
    { to: '/actualites', label: t('nav.news') },
  ];

  const secondaryLinks = [
    { to: '/contact', label: t('nav.contact') },
    { to: '/faq', label: t('nav.faq') },
  ];

  const navLinks = [...primaryLinks, ...secondaryLinks];

  // Close "more" dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-foreground/90 text-background backdrop-blur-md transition-colors duration-500">
      <div className="luxury-container">
        <div className="flex items-center justify-between h-16 md:h-20 flex-nowrap">
          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 -ml-2" aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logoWhite} alt="LÉONA BLOM" className="h-4 md:h-5 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-7 flex-nowrap whitespace-nowrap">
            {primaryLinks.map(link => {
              const isActive = link.to === '/boutique'
                ? location.pathname === '/boutique'
                : link.to === '/collections'
                  ? location.pathname.startsWith('/collections')
                  : location.pathname === link.to;
              const base = "luxury-link text-[10px] md:text-[10px] lg:text-xs tracking-[0.12em] lg:tracking-[0.15em] uppercase font-body whitespace-nowrap";
              const activeClass = isActive ? 'opacity-100 underline underline-offset-4 decoration-current' : '';
              
              if (link.to === '/boutique') return (
                <ShopMegaMenu key={link.to} className={`${base} ${activeClass}`} />
              );
              if (link.to === '/collections') return (
                <CollectionsDropdown key={link.to} className={`${base} ${activeClass}`} />
              );
              return (
                <Link key={link.to} to={link.to} className={`${base} ${activeClass}`}>{link.label}</Link>
              );
            })}

            {/* Secondary links — visible on lg+, hidden on md (in "more" dropdown) */}
            {secondaryLinks.map(link => {
              const isActive = location.pathname === link.to;
              const base = "luxury-link text-[10px] lg:text-xs tracking-[0.12em] lg:tracking-[0.15em] uppercase font-body whitespace-nowrap";
              const activeClass = isActive ? 'opacity-100 underline underline-offset-4 decoration-current' : '';
              return (
                <Link key={link.to} to={link.to} className={`${base} ${activeClass} hidden lg:inline-block`}>{link.label}</Link>
              );
            })}

            {/* "More" dropdown — visible only on md, hidden on lg+ */}
            <div ref={moreRef} className="relative lg:hidden">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="luxury-link text-[10px] lg:text-xs tracking-[0.12em] uppercase font-body flex items-center gap-1"
              >
                <MoreHorizontal size={16} />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-3 min-w-[180px] bg-foreground border border-background/10 py-3 z-50 shadow-lg"
                  >
                    {secondaryLinks.map(link => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMoreOpen(false)}
                        className="block px-5 py-2 text-[11px] tracking-[0.12em] uppercase font-body text-background/80 hover:text-background hover:bg-background/5 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}

                    {/* Language/Currency in dropdown */}
                    <div className="border-t border-background/10 mt-2 pt-2 px-5">
                      <p className="text-[9px] tracking-[0.2em] uppercase text-background/40 mb-2">{t('general.language')}</p>
                      <div className="flex gap-2 mb-3">
                        {(['fr', 'en'] as Language[]).map(l => (
                          <button
                            key={l}
                            onClick={() => { setLanguage(l); setMoreOpen(false); }}
                            className={`text-[11px] tracking-wider uppercase px-2 py-0.5 border transition-colors ${language === l ? 'border-primary text-primary' : 'border-transparent text-background/50 hover:text-background/80'}`}
                          >
                            {l.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] tracking-[0.2em] uppercase text-background/40 mb-2">{t('general.currency')}</p>
                      <div className="flex flex-wrap gap-2">
                        {(['EUR', 'USD', 'GBP', 'CAD'] as Currency[]).map(c => (
                          <button
                            key={c}
                            onClick={() => { setCurrency(c); setMoreOpen(false); }}
                            className={`text-[11px] tracking-wider px-2 py-0.5 border transition-colors ${currency === c ? 'border-primary text-primary' : 'border-transparent text-background/50 hover:text-background/80'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 flex-nowrap">
            {/* Language/Currency selector — hidden on md (available in "more" dropdown), visible lg+ */}
            <div className="relative hidden lg:block">
              <button onClick={() => setSettingsOpen(!settingsOpen)} className="flex items-center gap-1 text-[11px] tracking-wider uppercase font-body whitespace-nowrap">
                <Globe size={14} />
                <span className="hidden sm:inline">{language.toUpperCase()} / {currency}</span>
                <ChevronDown size={12} />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-full mt-2 p-4 min-w-[160px] border bg-background border-foreground/10 text-foreground">
                  <div className="mb-3">
                    <p className="text-[10px] tracking-[0.2em] uppercase mb-2 opacity-50">{t('general.language')}</p>
                    <div className="flex gap-2">
                      {(['fr', 'en'] as Language[]).map(l => (
                        <button key={l} onClick={() => { setLanguage(l); setSettingsOpen(false); }} className={`text-xs tracking-wider uppercase px-2 py-1 border ${language === l ? 'border-primary text-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>{l.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase mb-2 opacity-50">{t('general.currency')}</p>
                    <div className="flex flex-wrap gap-2">
                      {(['EUR', 'USD', 'GBP', 'CAD'] as Currency[]).map(c => (
                        <button key={c} onClick={() => { setCurrency(c); setSettingsOpen(false); }} className={`text-xs tracking-wider px-2 py-1 border ${currency === c ? 'border-primary text-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Edit mode toggle — admin only */}
            {isAdmin && (
              <button
                onClick={toggleEditMode}
                className={`p-2 transition-colors ${editMode ? 'text-primary' : 'opacity-60 hover:opacity-100'}`}
                title={editMode ? 'Désactiver le mode édition' : 'Activer le mode édition'}
              >
                <Pencil size={16} />
              </button>
            )}

            {/* Account */}
            <Link to={user ? '/compte' : '/connexion'} className="p-2">
              <User size={18} />
            </Link>

            {/* Cart */}
            <Link to="/panier" className="relative p-2 -mr-2">
              <ShoppingBag size={18} />
              <AnimatePresence mode="popLayout">
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-background text-foreground text-[9px] flex items-center justify-center rounded-full"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-background/10 bg-foreground">
          <div className="luxury-container py-6 flex flex-col gap-4">
            {navLinks.map(link => {
              if (link.to === '/boutique') {
                return (
                  <div key={link.to}>
                    <button
                      onClick={() => setMobileShopOpen(!mobileShopOpen)}
                      className="text-sm tracking-[0.15em] uppercase font-body flex items-center gap-2"
                    >
                      {link.label}
                      <ChevronDown size={12} className={`transition-transform ${mobileShopOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileShopOpen && (
                      <div className="mt-3 ml-4 space-y-3">
                        <Link to="/boutique" onClick={() => setMobileOpen(false)} className="block text-xs tracking-[0.12em] uppercase font-body opacity-70">
                          {language === 'en' ? 'View all' : 'Voir tout'}
                        </Link>
                        {groups.filter(g => g.is_active).map(group => (
                          <div key={group.id}>
                            <p className="text-[9px] tracking-[0.2em] uppercase font-body opacity-40 mb-1.5">
                              {language === 'en' && group.name_en ? group.name_en : group.name_fr}
                            </p>
                            {group.categories.filter(c => c.is_active).map(cat => (
                              <Link
                                key={cat.id}
                                to={`/boutique?category=${cat.slug}`}
                                onClick={() => setMobileOpen(false)}
                                className="block text-xs tracking-[0.1em] font-body py-1 opacity-80 hover:opacity-100"
                              >
                                {language === 'en' && cat.name_en ? cat.name_en : cat.name_fr}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (link.to === '/collections') {
                return (
                  <div key={link.to}>
                    <button
                      onClick={() => setMobileCollectionsOpen(!mobileCollectionsOpen)}
                      className="text-sm tracking-[0.15em] uppercase font-body flex items-center gap-2"
                    >
                      {link.label}
                      <ChevronDown size={12} className={`transition-transform ${mobileCollectionsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileCollectionsOpen && (
                      <div className="mt-3 ml-4 space-y-2">
                        <Link to="/collections" onClick={() => setMobileOpen(false)} className="block text-xs tracking-[0.12em] uppercase font-body opacity-70">
                          {language === 'en' ? 'View all' : 'Voir tout'}
                        </Link>
                        {collections.map(col => (
                          <Link
                            key={col.id}
                            to={`/collections/${col.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="block text-xs tracking-[0.1em] font-body py-1 opacity-80 hover:opacity-100"
                          >
                            {language === 'en' ? col.title_en : col.title_fr}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (link.to === '/actualites') {
                const newsCategories = [
                  { slug: 'article', labelFr: 'Articles', labelEn: 'Articles' },
                  { slug: 'event', labelFr: 'Événements', labelEn: 'Events' },
                  { slug: 'interview', labelFr: 'Interviews', labelEn: 'Interviews' },
                ];
                return (
                  <div key={link.to}>
                    <button
                      onClick={() => setMobileNewsOpen(!mobileNewsOpen)}
                      className="text-sm tracking-[0.15em] uppercase font-body flex items-center gap-2"
                    >
                      {link.label}
                      <ChevronDown size={12} className={`transition-transform ${mobileNewsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileNewsOpen && (
                      <div className="mt-3 ml-4 space-y-2">
                        <Link to="/actualites" onClick={() => setMobileOpen(false)} className="block text-xs tracking-[0.12em] uppercase font-body opacity-70">
                          {language === 'en' ? 'View all' : 'Voir tout'}
                        </Link>
                        {newsCategories.map(cat => (
                          <Link
                            key={cat.slug}
                            to={`/actualites?category=${cat.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="block text-xs tracking-[0.1em] font-body py-1 opacity-80 hover:opacity-100"
                          >
                            {language === 'en' ? cat.labelEn : cat.labelFr}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="text-sm tracking-[0.15em] uppercase font-body">{link.label}</Link>
              );
            })}
            <Link to={user ? '/compte' : '/connexion'} onClick={() => setMobileOpen(false)} className="text-sm tracking-[0.15em] uppercase font-body">
              {user ? t('nav.account') : t('auth.login')}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
