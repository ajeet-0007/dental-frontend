import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { X, Plus, Minus, ShoppingCart, Check } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function CartDrawer({ isOpen, onClose, product }: CartDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem, items } = useCartStore();
  const queryClient = useQueryClient();

  const isInCart = items.some((item) => item.id === product?.id?.toString());
  const existingItem = items.find((item) => item.id === product?.id?.toString());
  const currentQuantity = existingItem?.quantity || 0;

  const addToCartMutation = useMutation({
    mutationFn: () => api.post("/cart/add", { productId: product.id, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      onClose();
      navigate("/login");
      return;
    }

    try {
      await addToCartMutation.mutateAsync();
      addItem({
        id: product.id.toString(),
        quantity,
        product: {
          id: product.id.toString(),
          name: product.name,
          slug: product.slug,
          images: product.images,
          price: product.price,
          sellingPrice: product.sellingPrice,
          mrp: product.mrp,
          unit: product.unit || "unit",
        },
        variant: null,
      });
      toast.success("Added to cart!");
      onClose();
      setQuantity(1);
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleClose = () => {
    onClose();
    setQuantity(1);
  };

  if (!isOpen || !product) return null;

  const discountPercent = product.mrp > product.sellingPrice
    ? Math.round((1 - product.sellingPrice / product.mrp) * 100)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Add to Cart</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Product Info */}
          <div className="flex gap-4 mb-6">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-primary-600">
                  ₹{product.sellingPrice}
                </span>
                {product.mrp > product.sellingPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{product.mrp}
                  </span>
                )}
              </div>
              {discountPercent > 0 && (
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quantity
            </label>
            <div className="flex items-center justify-between">
              <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4 text-gray-600" />
                </button>
                <span className="px-4 py-2 text-base font-medium text-gray-900 min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-3 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Subtotal</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{(product.sellingPrice * quantity).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Info */}
          {isInCart && (
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Already in cart ({currentQuantity} items)
                </span>
              </div>
            </div>
          )}

          {/* Product Details */}
          {product.description && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-500 line-clamp-3">{product.description}</p>
            </div>
          )}

          {/* SKU */}
          {product.sku && (
            <div className="text-xs text-gray-400">
              SKU: {product.sku}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white">
          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all ${
              isInCart
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-primary-600 text-white hover:bg-primary-700"
            } disabled:opacity-50`}
          >
            {addToCartMutation.isPending ? (
              "Adding..."
            ) : isInCart ? (
              <>
                <Check className="h-5 w-5" />
                Update Cart
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </>
            )}
          </button>
          <button
            onClick={() => {
              onClose();
              navigate(`/products/${product.slug}`);
            }}
            className="w-full mt-3 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            View Full Details
          </button>
        </div>
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
