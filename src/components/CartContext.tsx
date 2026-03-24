"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from "react";
import type { Product, CartItem, SelectedVariant } from "@/lib/types";

const CART_STORAGE_KEY = "printfig-cart-v1";

function isPersistedCartItem(x: unknown): x is CartItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (typeof o.quantity !== "number" || o.quantity < 1 || !Number.isFinite(o.quantity)) return false;
  const p = o.product;
  if (!p || typeof p !== "object") return false;
  const pr = p as Record<string, unknown>;
  return typeof pr.id === "string" && typeof pr.price === "number";
}

function getItemId(product: Product, selectedVariant?: SelectedVariant | null): string {
  if (!selectedVariant) return product.id;
  return `${product.id}::${selectedVariant.variationName}::${selectedVariant.optionLabel}`;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; product: Product; quantity?: number; selectedVariant?: SelectedVariant }
  | { type: "REMOVE"; itemId: string }
  | { type: "UPDATE_QTY"; itemId: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const qty = action.quantity ?? 1;
      const itemId = getItemId(action.product, action.selectedVariant);
      const existing = state.items.find((i) => getItemId(i.product, i.selectedVariant) === itemId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            getItemId(i.product, i.selectedVariant) === itemId
              ? { ...i, quantity: i.quantity + qty }
              : i
          ),
        };
      }
      return {
        items: [...state.items, { product: action.product, quantity: qty, selectedVariant: action.selectedVariant }],
      };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => getItemId(i.product, i.selectedVariant) !== action.itemId) };
    case "UPDATE_QTY":
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => getItemId(i.product, i.selectedVariant) !== action.itemId) };
      }
      return {
        items: state.items.map((i) =>
          getItemId(i.product, i.selectedVariant) === action.itemId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR":
      return { items: [] };
    case "HYDRATE":
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedVariant?: SelectedVariant) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemId: (item: CartItem) => string;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [cartStorageReady, setCartStorageReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { items?: unknown[] };
      const items = Array.isArray(data.items)
        ? (data.items.filter(isPersistedCartItem) as CartItem[])
        : [];
      if (items.length > 0) {
        dispatch({ type: "HYDRATE", items });
      }
    } catch {
      /* ignore corrupt storage */
    } finally {
      setCartStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!cartStorageReady || typeof window === "undefined") return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: state.items }));
    } catch {
      /* quota / private mode */
    }
  }, [state.items, cartStorageReady]);

  const addToCart = useCallback((product: Product, quantity = 1, selectedVariant?: SelectedVariant) => {
    dispatch({ type: "ADD", product, quantity, selectedVariant });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    dispatch({ type: "REMOVE", itemId });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", itemId, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => {
    const price = i.selectedVariant ? i.selectedVariant.price : i.product.price;
    return sum + price * i.quantity;
  }, 0);

  const value: CartContextValue = {
    items: state.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemId: (item) => getItemId(item.product, item.selectedVariant),
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
