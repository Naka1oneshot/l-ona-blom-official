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

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem('lb_cart');
    return raw ? JSON.parse(raw) : [];
  } catch (_e) { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);

  // Persist to localStorage
  React.useEffect(() => {
    localStorage.setItem('lb_cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, options?: { size?: string; color?: string; braiding?: string; braiding_color?: string; measurements?: MeasurementData }): StockSplitInfo | null => {
    let splitInfo: StockSplitInfo | null = null;
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.size === options?.size && i.color === options?.color);
      const currentQty = existing ? existing.quantity : 0;
      const newQty = currentQty + 1;

      // Determine stock for the specific size, fallback to global stock_qty
      const sizeStock = options?.size && product.stock_by_size?.[options.size] != null
        ? product.stock_by_size[options.size]
        : product.stock_qty;

      if (sizeStock != null && newQty > sizeStock) {
        splitInfo = { inStock: sizeStock, madeToOrder: newQty - sizeStock, total: newQty };
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
      // Determine stock for the specific size, fallback to global stock_qty
      const sizeStock = i.size && i.product.stock_by_size?.[i.size] != null
        ? i.product.stock_by_size[i.size]
        : i.product.stock_qty;
      if (sizeStock != null && qty > sizeStock) {
        splitInfo = { inStock: sizeStock, madeToOrder: qty - sizeStock, total: qty };
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
