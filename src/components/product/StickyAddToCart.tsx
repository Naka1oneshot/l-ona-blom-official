import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronUp } from 'lucide-react';
import { siteConfig } from '@/lib/siteConfig';
import brandLogoText from '@/assets/logo-text-brand.png';

interface Props {
  ctaRef: React.RefObject<HTMLElement>;
  optionsRef: React.RefObject<HTMLElement>;
  isReady: boolean;
  onAddToCart: () => void;
  label: string;
  price: string;
  productName: string;
}

const StickyAddToCart: React.FC<Props> = ({
  ctaRef,
  optionsRef,
  isReady,
  onAddToCart,
  label,
  price,
  productName,
}) => {
  const [ctaHidden, setCtaHidden] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCtaHidden(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ctaRef]);

  // Detect when user is near the bottom of the page
  useEffect(() => {
    const update = () => {
      const scrollBottom = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      setAtBottom(docHeight - scrollBottom < 120);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const visible = ctaHidden;

  const handleClick = () => {
    if (isReady) {
      onAddToCart();
    } else {
      optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed left-0 right-0 bottom-0 z-50"
        >
          <div className="bg-background border-t border-foreground/10 shadow-[0_-4px_20px_-6px_rgba(0,0,0,0.1)]">
            <div className="luxury-container py-2.5 md:py-4 flex items-center gap-4">
              {/* Product info - hidden on mobile for more CTA space */}
              <div className="hidden md:flex flex-col flex-1 min-w-0">
                <p className="text-sm font-body truncate text-foreground/80">{productName}</p>
                <p className="text-base font-body font-light tracking-wide">{price}</p>
              </div>

              {/* CTA button */}
              <button
                onClick={handleClick}
                className="flex-1 md:flex-none md:min-w-[280px] flex items-center justify-center gap-2.5 bg-primary text-primary-foreground py-3.5 md:py-4 text-xs tracking-[0.2em] uppercase font-body rounded-xl hover:bg-luxury-magenta-light transition-all duration-300 group"
              >
                {isReady ? (
                  <>
                    <ShoppingBag size={15} className="transition-transform group-hover:scale-110" />
                    {label}
                  </>
                ) : (
                  <>
                    <ChevronUp size={15} className="animate-bounce" />
                    {label}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer content — only visible when at page bottom */}
          <AnimatePresence>
            {atBottom && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="overflow-hidden"
                style={{ background: 'hsl(var(--footer-bg))' }}
              >
                <div className="luxury-container py-5 md:py-6 flex flex-col items-center gap-4">
                  {/* Brand logo */}
                  <img src={brandLogoText} alt="LÉONA BLOM" className="h-5 md:h-7 object-contain opacity-90 invert" />

                  {/* Social icons */}
                  <div className="flex items-center gap-5 text-background">
                    <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="opacity-80 hover:opacity-100 transition-opacity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                      </svg>
                    </a>
                    <a href={siteConfig.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="opacity-80 hover:opacity-100 transition-opacity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                      </svg>
                    </a>
                    <a href={siteConfig.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="opacity-80 hover:opacity-100 transition-opacity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                      </svg>
                    </a>
                    <a href={siteConfig.pinterest} target="_blank" rel="noopener noreferrer" aria-label="Pinterest" className="opacity-80 hover:opacity-100 transition-opacity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 12a4 4 0 1 1 8 0c0 2.5-1.5 5-3 6.5L12 22l-1-3.5"/><path d="M12 2a10 10 0 1 0 4 19.17"/>
                      </svg>
                    </a>
                    <a href={siteConfig.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="opacity-80 hover:opacity-100 transition-opacity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                      </svg>
                    </a>
                    <a href="https://www.linkedin.com/in/l%C3%A9ona-blom-716618382/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="opacity-80 hover:opacity-100 transition-opacity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                      </svg>
                    </a>
                  </div>

                  {/* Copyright */}
                  <p className="text-[10px] font-body text-background/60">
                    © 2026 LÉONA BLOM. Tous droits réservés.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyAddToCart;
