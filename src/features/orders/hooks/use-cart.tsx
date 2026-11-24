"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import type { CartLine } from "@/features/orders/types/order.types";

const STORAGE_KEY = "fnb-cart-v1";
const EMPTY_CART: CartLine[] = [];

type AddableItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string | null;
};

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (item: AddableItem) => void;
  increment: (menuItemId: string) => void;
  decrement: (menuItemId: string) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
  notes: string;
  setNotes: (notes: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// The store intentionally starts empty on both the server and the first client
// render. localStorage is only read after React subscribes (post-hydration), so
// the initial markup always matches the server HTML.
let snapshot: CartLine[] = EMPTY_CART;
let loadedFromStorage = false;
const listeners = new Set<() => void>();

function readCart(): CartLine[] {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_CART;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return EMPTY_CART;
    }

    return parsed.filter(
      (line): line is CartLine =>
        !!line &&
        typeof line === "object" &&
        typeof (line as CartLine).menuItemId === "string" &&
        typeof (line as CartLine).name === "string" &&
        typeof (line as CartLine).price === "number" &&
        typeof (line as CartLine).quantity === "number"
    );
  } catch {
    return EMPTY_CART;
  }
}

function getSnapshot(): CartLine[] {
  return snapshot;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY_CART;
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (!loadedFromStorage) {
    loadedFromStorage = true;

    // Read localStorage after the current task so the hydration commit and the
    // first server-matching client render finish before the store changes.
    queueMicrotask(() => {
      const stored = readCart();

      if (stored.length > 0) {
        snapshot = stored;
        emitChange();
      }
    });
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      snapshot = readCart();
      emitChange();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function writeCart(next: CartLine[]) {
  snapshot = next;
  loadedFromStorage = true;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  emitChange();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const [notes, setNotes] = useState("");

  const addItem = useCallback((item: AddableItem) => {
    const existing = snapshot.find((line) => line.menuItemId === item.id);

    writeCart(
      existing
        ? snapshot.map((line) =>
            line.menuItemId === item.id
              ? { ...line, quantity: Math.min(99, line.quantity + 1) }
              : line
          )
        : [
            ...snapshot,
            {
              menuItemId: item.id,
              name: item.name,
              price: item.price,
              category: item.category,
              imageUrl: item.imageUrl ?? null,
              quantity: 1,
            },
          ]
    );
  }, []);

  const increment = useCallback((menuItemId: string) => {
    writeCart(
      snapshot.map((line) =>
        line.menuItemId === menuItemId
          ? { ...line, quantity: Math.min(99, line.quantity + 1) }
          : line
      )
    );
  }, []);

  const decrement = useCallback((menuItemId: string) => {
    writeCart(
      snapshot
        .map((line) =>
          line.menuItemId === menuItemId
            ? { ...line, quantity: line.quantity - 1 }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    writeCart(snapshot.filter((line) => line.menuItemId !== menuItemId));
  }, []);

  const clear = useCallback(() => {
    writeCart([]);
    setNotes("");
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, line) => total + line.quantity, 0);
    const subtotal = items.reduce(
      (total, line) => total + line.price * line.quantity,
      0
    );

    return {
      items,
      itemCount,
      subtotal,
      addItem,
      increment,
      decrement,
      removeItem,
      clear,
      notes,
      setNotes,
    };
  }, [items, addItem, increment, decrement, removeItem, clear, notes]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}
