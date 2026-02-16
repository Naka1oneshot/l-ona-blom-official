import React, { createContext, useContext, ReactNode } from 'react';
import { useWishlist } from '@/hooks/useWishlist';

type WishlistContextType = ReturnType<typeof useWishlist>;

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const wishlist = useWishlist();
  return (
    <WishlistContext.Provider value={wishlist}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlistContext = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlistContext must be used within WishlistProvider');
  return ctx;
};
