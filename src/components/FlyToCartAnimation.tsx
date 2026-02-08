import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

interface FlyToCartProps {
  imageUrl: string;
  startRect: DOMRect | null;
  onComplete: () => void;
}

const FlyToCartAnimation: React.FC<FlyToCartProps> = ({ imageUrl, startRect, onComplete }) => {
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Find the cart icon in the header
    const cartLink = document.querySelector('a[href="/panier"]');
    if (cartLink) {
      const rect = cartLink.getBoundingClientRect();
      setTarget({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    } else {
      // Fallback top-right
      setTarget({ x: window.innerWidth - 40, y: 32 });
    }
  }, []);

  if (!startRect || !target) return null;

  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-[9999] pointer-events-none"
        initial={{
          left: startX - 40,
          top: startY - 52,
          width: 80,
          height: 104,
          opacity: 1,
          borderRadius: 12,
        }}
        animate={{
          left: target.x - 12,
          top: target.y - 12,
          width: 24,
          height: 24,
          opacity: 0,
          borderRadius: 100,
        }}
        transition={{
          duration: 0.7,
          ease: [0.16, 1, 0.3, 1],
        }}
        onAnimationComplete={onComplete}
      >
        <div className="w-full h-full relative overflow-hidden rounded-[inherit] shadow-2xl ring-1 ring-primary/30">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
        </div>
      </motion.div>

      {/* Pulse on cart icon */}
      <motion.div
        className="fixed z-[9998] pointer-events-none rounded-full bg-primary/20"
        initial={{ left: target.x - 20, top: target.y - 20, width: 40, height: 40, opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.8] }}
        transition={{ duration: 0.6, delay: 0.55, ease: 'easeOut' }}
      />
    </AnimatePresence>
  );
};

export default FlyToCartAnimation;
