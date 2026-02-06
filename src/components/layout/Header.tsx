import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { Language, Currency } from '@/types';
import { ShoppingBag, Menu, X, Globe, ChevronDown } from 'lucide-react';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isDark = isHome;

  const navLinks = [
    { to: '/boutique', label: t('nav.shop') },
    { to: '/collections', label: t('nav.collections') },
    { to: '/a-propos', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
    { to: '/faq', label: t('nav.faq') },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${isDark ? 'bg-foreground/90 text-background backdrop-blur-md' : 'bg-background/90 text-foreground backdrop-blur-md'}`}>
      <div className="luxury-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 -ml-2"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/" className="text-display tracking-[0.2em] text-lg md:text-xl">
            LÉONA BLOM
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="luxury-link text-xs tracking-[0.15em] uppercase font-body"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Language/Currency selector */}
            <div className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="flex items-center gap-1 text-xs tracking-wider uppercase font-body"
              >
                <Globe size={14} />
                <span className="hidden sm:inline">{language.toUpperCase()} / {currency}</span>
                <ChevronDown size={12} />
              </button>
              {settingsOpen && (
                <div className={`absolute right-0 top-full mt-2 p-4 min-w-[160px] border ${isDark ? 'bg-foreground border-background/20 text-background' : 'bg-background border-foreground/10 text-foreground'}`}>
                  <div className="mb-3">
                    <p className="text-[10px] tracking-[0.2em] uppercase mb-2 opacity-50">{t('general.language')}</p>
                    <div className="flex gap-2">
                      {(['fr', 'en'] as Language[]).map(l => (
                        <button
                          key={l}
                          onClick={() => { setLanguage(l); setSettingsOpen(false); }}
                          className={`text-xs tracking-wider uppercase px-2 py-1 border ${language === l ? 'border-primary text-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase mb-2 opacity-50">{t('general.currency')}</p>
                    <div className="flex flex-wrap gap-2">
                      {(['EUR', 'USD', 'GBP', 'CAD'] as Currency[]).map(c => (
                        <button
                          key={c}
                          onClick={() => { setCurrency(c); setSettingsOpen(false); }}
                          className={`text-xs tracking-wider px-2 py-1 border ${currency === c ? 'border-primary text-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <Link to="/panier" className="relative p-2 -mr-2">
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className={`md:hidden border-t ${isDark ? 'border-background/10 bg-foreground' : 'border-foreground/10 bg-background'}`}>
          <div className="luxury-container py-6 flex flex-col gap-4">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="text-sm tracking-[0.15em] uppercase font-body"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
