import { createContext, useContext, useEffect, useState, useMemo } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "motonation_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
            : i
        );
      }
      return [...prev, {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        quantity: Math.min(quantity, product.stock),
        max_stock: product.stock,
      }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems((prev) => prev
      .map((i) => i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.max_stock)) } : i)
      .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      count,
    };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, totals }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
