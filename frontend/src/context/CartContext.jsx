import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import api from "@/lib/api";

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

  // El carrito vive en localStorage y puede tener horas o días de antigüedad:
  // el precio/stock guardado ahí puede haber quedado desactualizado si el admin
  // los cambió mientras tanto. Antes de mostrar el total a pagar, se resincroniza
  // contra el catálogo real para que lo que ve el cliente sea lo que se le cobra.
  const syncWithCatalog = useCallback(async () => {
    if (items.length === 0) return { priceChanges: [], removedItems: [], quantityReduced: [] };

    const results = await Promise.allSettled(
      items.map((i) => api.get(`/public/products/${i.sku}`).then((r) => r.data))
    );

    const priceChanges = [];
    const removedItems = [];
    const quantityReduced = [];
    const nextItems = [];

    items.forEach((i, idx) => {
      const result = results[idx];
      if (result.status !== "fulfilled") {
        removedItems.push({ name: i.name, reason: "ya no está disponible" });
        return;
      }
      const fresh = result.value;
      if (!fresh.stock || fresh.stock <= 0) {
        removedItems.push({ name: i.name, reason: "se agotó" });
        return;
      }
      const freshPrice = Number(fresh.price);
      if (freshPrice !== i.price) {
        priceChanges.push({ name: i.name, oldPrice: i.price, newPrice: freshPrice });
      }
      let quantity = i.quantity;
      if (quantity > fresh.stock) {
        quantityReduced.push({ name: i.name, from: quantity, to: fresh.stock });
        quantity = fresh.stock;
      }
      nextItems.push({ ...i, price: freshPrice, max_stock: fresh.stock, quantity });
    });

    setItems(nextItems);
    return { priceChanges, removedItems, quantityReduced };
  }, [items]);

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
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, totals, syncWithCatalog }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
