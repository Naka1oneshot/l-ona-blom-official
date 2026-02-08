import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CartItem, Product, MeasurementData } from '@/types';
import { getUnitPriceEurCents } from '@/lib/pricing';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, options?: { size?: string; color?: string; braiding?: string; braiding_color?: string; measurements?: MeasurementData }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalCentsEur: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, options?: { size?: string; color?: string; braiding?: string; braiding_color?: string; measurements?: MeasurementData }) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.size === options?.size && i.color === options?.color);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (product.stock_qty != null && newQty > product.stock_qty) return prev;
        return prev.map(i =>
          i.product.id === product.id && i.size === options?.size && i.color === options?.color
            ? { ...i, quantity: newQty }
            : i
        );
      }
      if (product.stock_qty != null && product.stock_qty <= 0) return prev;
      const unitPrice = getUnitPriceEurCents(product, options?.size);
      return [...prev, { product, quantity: 1, unit_price_eur_cents: unitPrice, ...options }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      if (i.product.stock_qty != null && qty > i.product.stock_qty) return i;
      return { ...i, quantity: qty };
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalCentsEur = items.reduce((sum, i) => {
    const unitPrice = i.unit_price_eur_cents ?? getUnitPriceEurCents(i.product, i.size);
    return sum + unitPrice * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalCentsEur }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
