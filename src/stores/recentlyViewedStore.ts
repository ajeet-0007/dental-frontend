import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentlyViewedItem {
  id: string;
  name: string;
  slug: string;
  images: string[];
  sellingPrice: number;
  mrp: number;
  unit: string;
  viewedAt: number;
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  addItem: (product: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clearItems: () => void;
}

const MAX_ITEMS = 10;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          const filtered = state.items.filter((i) => i.id !== product.id);
          const updated = [
            { ...product, viewedAt: Date.now() },
            ...filtered,
          ].slice(0, MAX_ITEMS);
          return { items: updated };
        }),
      clearItems: () => set({ items: [] }),
    }),
    {
      name: "dentalkart-recently-viewed",
    },
  ),
);
