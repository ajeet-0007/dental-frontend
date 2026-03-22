import { create } from 'zustand'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    price: number
    sellingPrice: number
    mrp: number
    unit: string
  }
  variant: {
    id: string
    name: string
    price: number
    image: string
  } | null
}

interface CartState {
  items: CartItem[]
  total: number
  setCart: (items: CartItem[], total: number) => void
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  total: 0,
  setCart: (items, total) => set({ items, total }),
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        }
      }
      return { items: [...state.items, item] }
    }),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),
  clearCart: () => set({ items: [], total: 0 }),
}))
