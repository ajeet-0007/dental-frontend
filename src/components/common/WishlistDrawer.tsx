import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCartStore } from "@/stores/cartStore";
import { X, Heart, ShoppingCart, Trash2 } from "lucide-react";

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Wishlist ({items.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-gray-500 mb-6">
                Save items you love by clicking the heart icon
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-gray-50 rounded-xl p-3"
                >
                  <Link
                    to={`/products/${item.product.slug}`}
                    onClick={onClose}
                    className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0"
                  >
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product.slug}`}
                      onClick={onClose}
                      className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <div className="mt-1">
                      <span className="text-base font-bold text-primary-600">
                        ₹{item.product.sellingPrice}
                      </span>
                      {item.product.mrp > item.product.sellingPrice && (
                        <span className="ml-2 text-xs text-gray-400 line-through">
                          ₹{item.product.mrp}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleRemove(item.id, parseInt(item.product.id))}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-white">
            <Link
              to="/wishlist"
              onClick={onClose}
              className="block w-full py-3 text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All ({items.length} items)
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
