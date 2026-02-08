import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '@/hooks/useCategories';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { Language, Currency } from '@/types';
import { ShoppingBag, Menu, X, Globe, ChevronDown, User } from 'lucide-react';
import CollectionsDropdown from './CollectionsDropdown';
import ShopMegaMenu from '@/components/nav/ShopMegaMenu';
import { supabase } from '@/integrations/supabase/client';
import logoWhite from '@/assets/logo-white.png';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const [mobileNewsOpen, setMobileNewsOpen] = useState(false);
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

  const navLinks = [
    { to: '/boutique', label: t('nav.shop') },
    { to: '/collections', label: t('nav.collections') },
    { to: '/a-propos', label: t('nav.about') },
    { to: '/actualites', label: t('nav.news') },
    { to: '/contact', label: t('nav.contact') },
    { to: '/faq', label: t('nav.faq') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-foreground/90 text-background backdrop-blur-md transition-colors duration-500">
      <div className="luxury-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 -ml-2" aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logoWhite} alt="LÉONA BLOM" className="h-4 md:h-5 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => {
              const isActive = link.to === '/boutique'
                ? location.pathname === '/boutique'
                : link.to === '/collections'
                  ? location.pathname.startsWith('/collections')
                  : location.pathname === link.to;
              const base = "luxury-link text-xs tracking-[0.15em] uppercase font-body";
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
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Language/Currency selector */}
            <div className="relative">
              <button onClick={() => setSettingsOpen(!settingsOpen)} className="flex items-center gap-1 text-xs tracking-wider uppercase font-body">
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
