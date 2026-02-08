import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollectionScrollNavProps {
  collections: { id: string; title: string }[];
  sectionRefs: React.RefObject<(HTMLElement | null)[]>;
}

const CollectionScrollNav: React.FC<CollectionScrollNavProps> = ({ collections, sectionRefs }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
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
        const sectionCenter = rect.top + rect.height / 2;
        const dist = Math.abs(sectionCenter - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      setActiveIndex(bestIdx);

      // Calculate overall scroll progress
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
  };

  if (total <= 1) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <motion.nav
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="fixed right-6 xl:right-10 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-5"
      aria-label="Collection navigation"
    >
      {/* Current / Total counter */}
      <div className="flex flex-col items-center font-body select-none">
        <AnimatePresence mode="wait">
          <motion.span
            key={activeIndex}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-light tracking-widest"
            style={{ color: 'hsl(40 50% 65%)' }}
          >
            {pad(activeIndex + 1)}
          </motion.span>
        </AnimatePresence>
        <span className="text-[10px] tracking-[0.2em] text-muted-foreground/60 my-1">/</span>
        <span
          className="text-xs font-light tracking-widest text-muted-foreground/50"
        >
          {pad(total)}
        </span>
      </div>

      {/* Progress track */}
      <div className="relative w-px h-28 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(40 20% 75% / 0.2)' }}>
        <motion.div
          className="absolute top-0 left-0 w-full rounded-full"
          style={{
            background: 'linear-gradient(180deg, hsl(40 50% 65%), hsl(40 40% 50%))',
            height: `${progress * 100}%`,
          }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Dot indicators */}
      <div className="flex flex-col items-center gap-3">
        {collections.map((c, i) => (
          <button
            key={c.id}
            onClick={() => scrollToSection(i)}
            className="group relative flex items-center justify-center"
            aria-label={c.title}
          >
            <motion.div
              className="rounded-full transition-colors duration-300"
              animate={{
                width: i === activeIndex ? 8 : 4,
                height: i === activeIndex ? 8 : 4,
                backgroundColor: i === activeIndex ? 'hsl(40 50% 65%)' : 'hsl(0 0% 60% / 0.3)',
                boxShadow: i === activeIndex ? '0 0 8px hsl(40 50% 65% / 0.5)' : 'none',
              }}
              transition={{ duration: 0.3 }}
            />
            {/* Tooltip on hover */}
            <span className="absolute right-5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[11px] font-body tracking-[0.12em] uppercase text-foreground/70 pointer-events-none pr-2">
              {c.title}
            </span>
          </button>
        ))}
      </div>

      {/* Active collection name — rotated */}
      <div className="relative mt-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={activeIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="block text-[10px] tracking-[0.18em] uppercase font-body text-muted-foreground/60 origin-center whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
            }}
          >
            {collections[activeIndex]?.title}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default CollectionScrollNav;
