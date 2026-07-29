import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem } from '@/types/database';

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, optionsKey: string) => void;
  updateQty: (productId: string, optionsKey: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'acil-cart';

const optionsKey = (opts: Array<{ option: string; value: string }>) =>
  opts.map((o) => `${o.option}=${o.value}`).join('|');

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const key = optionsKey(item.options);
      const existing = prev.find((p) => p.productId === item.productId && optionsKey(p.options) === key);
      if (existing) {
        return prev.map((p) =>
          p === existing ? { ...p, quantity: p.quantity + item.quantity } : p,
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (productId: string, key: string) =>
    setItems((prev) => prev.filter((p) => !(p.productId === productId && optionsKey(p.options) === key)));

  const updateQty = (productId: string, key: string, qty: number) =>
    setItems((prev) =>
      prev.map((p) =>
        p.productId === productId && optionsKey(p.options) === key ? { ...p, quantity: Math.max(1, qty) } : p,
      ),
    );

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export { optionsKey };
