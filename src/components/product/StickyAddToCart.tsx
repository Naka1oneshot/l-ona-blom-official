import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronUp } from 'lucide-react';

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
  const [footerOffset, setFooterOffset] = useState(0);

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

  // Push bar up when footer is visible
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const update = () => {
      const footerRect = footer.getBoundingClientRect();
      const overlap = window.innerHeight - footerRect.top;
      setFooterOffset(overlap > 0 ? overlap : 0);
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
      // Scroll to options section
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
          className="fixed left-0 right-0 z-50 transition-[bottom] duration-200"
          style={{ bottom: footerOffset }}
        >
          {/* Gradient fade above */}
          <div className="h-6 bg-gradient-to-t from-background to-transparent" />
          
          <div className="bg-background/95 backdrop-blur-xl border-t border-foreground/5 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.12)]">
            <div className="luxury-container py-3 md:py-4 flex items-center gap-4">
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyAddToCart;
