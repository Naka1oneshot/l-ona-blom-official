import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background">
      <div className="luxury-container py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-display text-2xl tracking-[0.2em] mb-4">LÉONA BLOM</h3>
            <p className="text-sm opacity-60 leading-relaxed max-w-sm font-body">
              {t('hero.tagline')}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[10px] tracking-[0.3em] uppercase mb-6 opacity-40 font-body">Navigation</h4>
            <div className="flex flex-col gap-3">
              <Link to="/boutique" className="luxury-link text-sm opacity-70 hover:opacity-100 font-body">{t('nav.shop')}</Link>
              <Link to="/collections" className="luxury-link text-sm opacity-70 hover:opacity-100 font-body">{t('nav.collections')}</Link>
              <Link to="/a-propos" className="luxury-link text-sm opacity-70 hover:opacity-100 font-body">{t('nav.about')}</Link>
              <Link to="/contact" className="luxury-link text-sm opacity-70 hover:opacity-100 font-body">{t('nav.contact')}</Link>
              <Link to="/faq" className="luxury-link text-sm opacity-70 hover:opacity-100 font-body">{t('nav.faq')}</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] tracking-[0.3em] uppercase mb-6 opacity-40 font-body">Informations</h4>
            <div className="flex flex-col gap-3">
              <span className="text-sm opacity-70 font-body">{t('footer.legal')}</span>
              <span className="text-sm opacity-70 font-body">{t('footer.cgv')}</span>
              <span className="text-sm opacity-70 font-body">{t('footer.privacy')}</span>
              <span className="text-sm opacity-70 font-body">{t('footer.cookies')}</span>
              <a href="mailto:contact@leonablom.com" className="luxury-link text-sm opacity-70 hover:opacity-100 font-body">
                contact@leonablom.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-40 font-body">
            © {new Date().getFullYear()} LÉONA BLOM. {t('footer.rights')}
          </p>
          <div className="flex gap-6">
            <span className="text-xs opacity-40 font-body">Instagram</span>
            <span className="text-xs opacity-40 font-body">Pinterest</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
