import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoLion from '@/assets/logo-lion.png';

interface CollectionScrollNavProps {
  collections: { id: string; title: string }[];
  sectionRefs: React.RefObject<(HTMLElement | null)[]>;
}

const CollectionScrollNav: React.FC<CollectionScrollNavProps> = ({ collections, sectionRefs }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const total = collections.length;

  useEffect(() => {
    const handleScroll = () => {
      const refs = sectionRefs.current;
      if (!refs) return;

      const viewportCenter = window.innerHeight / 2;
      let bestIdx = 0;
      let bestDist = Infinity;

      refs.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      });

      setActiveIndex(bestIdx);
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionRefs, total]);

  const scrollToSection = (index: number) => {
    const el = sectionRefs.current?.[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setOverlayOpen(false);
  };

  if (total <= 1) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      {/* Slim rail — always visible */}
      <motion.nav
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col items-center justify-center w-12 cursor-pointer"
        onMouseEnter={() => setOverlayOpen(true)}
        aria-label="Collection navigation"
      >
        {/* Subtle background strip */}
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Counter */}
          <div className="flex flex-col items-center font-body select-none">
            <AnimatePresence mode="wait">
              <motion.span
                key={activeIndex}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.25 }}
                className="text-sm font-light tracking-widest text-primary"
              >
                {pad(activeIndex + 1)}
              </motion.span>
            </AnimatePresence>
            <span className="text-[9px] tracking-[0.2em] text-muted-foreground/50 my-0.5">/</span>
            <span className="text-[10px] font-light tracking-widest text-muted-foreground/40">
              {pad(total)}
            </span>
          </div>

          {/* Progress track */}
          <div className="relative w-px h-20 rounded-full overflow-hidden bg-primary/15">
            <motion.div
              className="absolute top-0 left-0 w-full rounded-full bg-primary"
              style={{ height: `${progress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Dots */}
          <div className="flex flex-col items-center gap-2.5">
            {collections.map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                animate={{
                  width: i === activeIndex ? 6 : 3,
                  height: i === activeIndex ? 6 : 3,
                  backgroundColor: i === activeIndex ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.2)',
                  boxShadow: i === activeIndex ? '0 0 6px hsl(var(--primary) / 0.4)' : 'none',
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      </motion.nav>

      {/* Full overlay panel */}
      <AnimatePresence>
        {overlayOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setOverlayOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 md:w-96 flex flex-col"
              onMouseLeave={() => setOverlayOpen(false)}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />

              {/* Lion watermark */}
              <img
                src={logoLion}
                alt=""
                className="absolute right-4 top-1/2 -translate-y-1/2 h-48 opacity-[0.08] pointer-events-none select-none"
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full px-8 md:px-10 py-20">
                {/* Header */}
                <div className="mb-10">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-primary-foreground/50 font-body mb-2">
                    Navigation
                  </p>
                  <h3 className="text-display text-2xl tracking-[0.08em] text-primary-foreground/90">
                    Collections
                  </h3>
                  <div className="mt-3 w-8 h-px bg-primary-foreground/20" />
                </div>

                {/* Collection list */}
                <div className="flex-1 flex flex-col justify-center gap-1">
                  {collections.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => scrollToSection(i)}
                      className="group relative flex items-center gap-4 py-3 px-3 -mx-3 rounded-sm transition-colors duration-300 hover:bg-primary-foreground/10 text-left"
                    >
                      {/* Index number */}
                      <span
                        className={`text-xs font-body tracking-widest transition-colors duration-300 ${
                          i === activeIndex ? 'text-primary-foreground' : 'text-primary-foreground/30'
                        }`}
                      >
                        {pad(i + 1)}
                      </span>

                      {/* Separator dash */}
                      <motion.div
                        className="h-px bg-primary-foreground/30"
                        animate={{ width: i === activeIndex ? 20 : 8 }}
                        transition={{ duration: 0.3 }}
                      />

                      {/* Title */}
                      <span
                        className={`text-display text-base md:text-lg tracking-[0.06em] transition-all duration-300 ${
                          i === activeIndex
                            ? 'text-primary-foreground translate-x-0'
                            : 'text-primary-foreground/50 group-hover:text-primary-foreground/80'
                        }`}
                      >
                        {c.title}
                      </span>

                      {/* Active indicator */}
                      {i === activeIndex && (
                        <motion.div
                          layoutId="activeCollectionDot"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Footer progress */}
                <div className="mt-auto pt-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-primary-foreground/40 font-body">
                      Progression
                    </span>
                    <span className="text-[10px] tracking-widest text-primary-foreground/60 font-body">
                      {Math.round(progress * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-px bg-primary-foreground/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-foreground/40 rounded-full"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CollectionScrollNav;
