import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { formatPrice } from "@/utils/format";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCartStore } from "@/stores/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingCart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import AppImage from "./AppImage";

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { isAuthenticated } = useAuthStore();
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: (productId: number) => api.delete(`/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const handleRemove = async (id: string, productId: number) => {
    if (isAuthenticated) {
      try {
        await removeMutation.mutateAsync(productId);
      } catch (error) {
        // Continue with local removal even if API fails
      }
    }
    removeItem(id);
    toast.success("Removed from wishlist");
  };

  const handleAddToCart = async (item: any) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart')
      return
    }

    const productId = String(item.product.id)
    const cartItemId = productId

    try {
      const res = await api.get(`/products/slug/${item.product.slug}`);
      const product = res.data;
      const inventories = product.inventories || [];
      const baseInv = inventories.find((i: any) => !i.productVariantId);
      const stock = baseInv ? Math.max(0, (baseInv.quantity || 0) - (baseInv.reservedQuantity || 0)) : Infinity;
      if (stock <= 0) {
        toast.error('This product is out of stock');
        return;
      }

      await api.post('/cart/add', { productId, quantity: 1 })
      addItem({
        id: cartItemId,
        quantity: 1,
        product: item.product,
        variant: null,
      })
      toast.success('Added to cart!')
    } catch {
      toast.error('Failed to add to cart')
    }
  }

  const getDiscount = (mrp: number, selling: number) => {
    if (mrp > selling) {
      return Math.round(((mrp - selling) / mrp) * 100)
    }
    return 0
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-primary-600 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-0.5">Saved items</p>
                    <h2 className="text-lg font-bold">Wishlist ({items.length})</h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-br from-blue-100 to-primary-100 rounded-3xl flex items-center justify-center mb-6"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Heart className="h-12 w-12 text-primary-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Your wishlist is empty
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-xs">
                    Save items you love by clicking the heart icon on any product
                  </p>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-500/25"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {items.map((item, index) => {
                    const discount = getDiscount(item.product.mrp, item.product.sellingPrice)
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100 hover:shadow-md transition-all duration-300 group"
                      >
                        <Link
                          to={`/products/${item.product.slug}`}
                          onClick={onClose}
                          className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 relative"
                        >
                          {item.product.images?.[0] ? (
                            <AppImage
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              widths={[160, 320]}
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Heart className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                          {discount > 0 && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[8px] font-bold rounded-full shadow-sm">
                              {discount}% OFF
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.product.slug}`}
                            onClick={onClose}
                            className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors leading-snug"
                          >
                            {item.product.name}
                          </Link>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-base font-bold text-gray-900">
                              ₹{formatPrice(item.product.sellingPrice)}
                            </span>
                            {item.product.mrp > item.product.sellingPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹{formatPrice(item.product.mrp)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xs font-medium rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-md shadow-primary-500/20"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              Add to Cart
                            </button>
                            <button
                              onClick={() => handleRemove(item.id, parseInt(item.product.id))}
                              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-white">
                <Link
                  to="/wishlist"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-blue-700 transition-all shadow-lg shadow-primary-500/25"
                >
                  View All Wishlist
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
