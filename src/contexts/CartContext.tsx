import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CartItem, Product, MeasurementData } from '@/types';
import { getUnitPriceEurCents } from '@/lib/pricing';

interface StockSplitInfo {
  inStock: number;
  madeToOrder: number;
  total: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, options?: { size?: string; color?: string; braiding?: string; braiding_color?: string; measurements?: MeasurementData }) => StockSplitInfo | null;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => StockSplitInfo | null;
  clearCart: () => void;
  totalItems: number;
  totalCentsEur: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, options?: { size?: string; color?: string; braiding?: string; braiding_color?: string; measurements?: MeasurementData }): StockSplitInfo | null => {
    let splitInfo: StockSplitInfo | null = null;
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.size === options?.size && i.color === options?.color);
      const currentQty = existing ? existing.quantity : 0;
      const newQty = currentQty + 1;
      const stock = product.stock_qty;

      if (stock != null && newQty > stock) {
        splitInfo = { inStock: stock, madeToOrder: newQty - stock, total: newQty };
      }

      if (existing) {
        return prev.map(i =>
          i.product.id === product.id && i.size === options?.size && i.color === options?.color
            ? { ...i, quantity: newQty }
            : i
        );
      }
      const unitPrice = getUnitPriceEurCents(product, options?.size);
      return [...prev, { product, quantity: 1, unit_price_eur_cents: unitPrice, ...options }];
    });
    return splitInfo;
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number): StockSplitInfo | null => {
    if (qty <= 0) {
      removeItem(productId);
      return null;
    }
    let splitInfo: StockSplitInfo | null = null;
    setItems(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      const stock = i.product.stock_qty;
      if (stock != null && qty > stock) {
        splitInfo = { inStock: stock, madeToOrder: qty - stock, total: qty };
      }
      return { ...i, quantity: qty };
    }));
    return splitInfo;
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
