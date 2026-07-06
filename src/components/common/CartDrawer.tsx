import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { X, ShoppingCart, Minus, Plus } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function CartDrawer({ isOpen, onClose, product }: CartDrawerProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem, items } = useCartStore();
  const queryClient = useQueryClient();

  const variants = product?.variants || [];
  const activeVariants = variants.filter((v: any) => v.isActive);
  const hasVariants = activeVariants.length > 0;

  const addToCartMutation = useMutation({
    mutationFn: (payload: { productId: string; productVariantId?: string; quantity: number }) =>
      api.post("/cart/add", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const handleVariantAddToCart = async (variant: any) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      onClose();
      navigate("/login");
      return;
    }

    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        productVariantId: variant.id,
        quantity: 1,
      });

      addItem({
        id: `${product.id}-${variant.id}`,
        quantity: 1,
        product: {
          id: product.id.toString(),
          name: product.name,
          slug: product.slug,
          images: product.images,
          sellingPrice: variant.sellingPrice || product.sellingPrice || 0,
          mrp: variant.mrp || product.mrp || 0,
          unit: product.unit || "unit",
        },
        variant: {
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          sellingPrice: variant.sellingPrice,
          mrp: variant.mrp,
          image: variant.image,
          packQuantity: variant.packQuantity || 1,
        },
      });

      toast.success("Added to cart!");
      onClose();
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !product) return null;

  const displayPrice = hasVariants
    ? Math.min(...activeVariants.map((v: any) => v.sellingPrice || 0))
    : product.sellingPrice || 0;
  const displayMrp = hasVariants
    ? Math.max(...activeVariants.map((v: any) => v.mrp || 0))
    : product.mrp || 0;
  const discountPercent = displayMrp > displayPrice
    ? Math.round((1 - displayPrice / displayMrp) * 100)
    : 0;

  const getVariantImage = (variant: any) => {
    return variant.image || product.images?.[0] || "";
  };

  const isInCartByVariant = (variantId: string) => {
    return items.some((item) => item.id === `${product.id}-${variantId}`);
  };

  const highestStockByVariant = (variant: any) => {
    const inventories = product?.inventories || [];
    const inv = inventories.find((i: any) => i.productVariantId === variant.id);
    if (!inv) return 0;
    return inv.quantity - inv.reservedQuantity;
  };

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
                  ₹{displayPrice.toLocaleString()}
                </span>
                {displayMrp > displayPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{displayMrp.toLocaleString()}
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

          {/* Variant Rows */}
          {hasVariants ? (
            <div className="space-y-3 mb-4">
              {activeVariants.map((variant: any) => {
                const variantImage = getVariantImage(variant);
                const stock = highestStockByVariant(variant);
                const isOutOfStock = stock <= 0;
                const variantInCart = isInCartByVariant(variant.id);
                const vDiscount = variant.mrp > variant.sellingPrice
                  ? Math.round((1 - variant.sellingPrice / variant.mrp) * 100)
                  : 0;

                return (
                  <div
                    key={variant.id}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 bg-gray-50 rounded-md overflow-hidden flex-shrink-0">
                      {variantImage ? (
                        <img
                          src={variantImage}
                          alt={variant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {variant.name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-primary-600">
                          ₹{variant.sellingPrice.toLocaleString()}
                        </span>
                        {variant.mrp > variant.sellingPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{variant.mrp.toLocaleString()}
                          </span>
                        )}
                        {vDiscount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 font-medium rounded">
                            {vDiscount}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            isOutOfStock ? "bg-red-400" : "bg-green-500"
                          }`}
                        />
                        <span className="text-[10px] text-gray-500">
                          {isOutOfStock ? "Out of Stock" : `${stock} in stock`}
                        </span>
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => handleVariantAddToCart(variant)}
                      disabled={addToCartMutation.isPending || isOutOfStock}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        variantInCart
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-primary-600 text-white hover:bg-primary-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {addToCartMutation.isPending ? "..." : variantInCart ? "In Cart" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* No variants — single product. Show quantity + Add directly inline */
            <SingleProductAdd
              product={product}
              onClose={onClose}
            />
          )}

          {/* Short Description */}
          {product.shortDescription && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 line-clamp-3">{product.shortDescription}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white">
          <button
            onClick={() => {
              onClose();
              navigate(`/products/${product.slug}`);
            }}
            className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
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

function SingleProductAdd({ product, onClose }: { product: any; onClose: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const queryClient = useQueryClient();

  const price = product.sellingPrice || 0;
  const mrp = product.mrp || 0;

  const addToCartMutation = useMutation({
    mutationFn: (payload: { productId: string; quantity: number }) =>
      api.post("/cart/add", payload),
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
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity,
      });

      addItem({
        id: product.id.toString(),
        quantity,
        product: {
          id: product.id.toString(),
          name: product.name,
          slug: product.slug,
          images: product.images,
          sellingPrice: price,
          mrp,
          unit: product.unit || "unit",
        },
        variant: null,
      });

      toast.success("Added to cart!");
      onClose();
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center border border-gray-200 rounded-lg bg-white">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-30"
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4 text-gray-600" />
          </button>
          <span className="px-4 py-2 text-base font-medium text-gray-900 min-w-[60px] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(q + 1, 99))}
            className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-30"
            disabled={quantity >= 99}
          >
            <Plus className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending}
          className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-all disabled:opacity-50"
        >
          {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
