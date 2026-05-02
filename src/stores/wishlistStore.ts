import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    sellingPrice: number;
    mrp: number;
    unit: string;
  };
  addedAt: number;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) return state;
          return { items: [...state.items, item] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      clearWishlist: () => set({ items: [] }),
      isInWishlist: (id) => get().items.some((i) => i.id === id),
    }),
    {
      name: "dentalkart-wishlist",
    },
  ),
);
