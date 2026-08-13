import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { X, ShoppingCart, Minus, Plus, Package } from "lucide-react";
import { formatPrice } from "@/utils/format";
import AppImage from "./AppImage";

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

  const { data: fullProduct } = useQuery({
    queryKey: ["cartDrawerProduct", product?.slug],
    queryFn: async () => {
      const res = await api.get(`/products/slug/${product.slug}`);
      return res.data;
    },
    enabled: isOpen && !!product?.slug && !hasVariants,
    staleTime: 5 * 60 * 1000,
  });

  const effectiveProduct = fullProduct || product;
  const resolvedVariants = effectiveProduct?.variants || [];
  const activeResolvedVariants = resolvedVariants.filter((v: any) => v.isActive);
  const resolvedHasVariants = activeResolvedVariants.length > 0;

  const [addingVariantId, setAddingVariantId] = useState<string | null>(null);

  const addToCartMutation = useMutation({
    mutationFn: (payload: { productId: string; productVariantId?: string; quantity: number }) =>
      api.post("/cart/add", payload),
    onSuccess: () => {
      setAddingVariantId(null);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: () => {
      setAddingVariantId(null);
    },
  });

  const handleVariantAddToCart = async (variant: any) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      onClose();
      navigate("/login");
      return;
    }

    setAddingVariantId(variant.id);
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

  const displayPrice = resolvedHasVariants
    ? Math.min(...activeResolvedVariants.map((v: any) => v.sellingPrice || 0))
    : effectiveProduct.sellingPrice || 0;
  const displayMrp = resolvedHasVariants
    ? Math.max(...activeResolvedVariants.map((v: any) => v.mrp || 0))
    : effectiveProduct.mrp || 0;
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
    const inventories = effectiveProduct?.inventories || [];
    const inv = inventories.find((i: any) => i.productVariantId === variant.id);
    if (!inv) return 0;
    return inv.quantity - inv.reservedQuantity;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-primary-600 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-0.5">Quick Add</p>
                <h2 className="text-lg font-bold">Add to Cart</h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Product Info */}
          <div className="flex gap-4 mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
              {product.images?.[0] ? (
                <AppImage
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  widths={[192, 320, 640]}
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                {product.name}
              </h3>
              {effectiveProduct.shortDescription && (
                <p className="text-xs text-gray-400 line-clamp-1 mb-2">{effectiveProduct.shortDescription}</p>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-bold text-primary-600">
                  ₹{formatPrice(displayPrice)}
                </span>
                {displayMrp > displayPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{formatPrice(displayMrp)}
                  </span>
                )}
              </div>
              {discountPercent > 0 && (
                <span className="inline-block px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-full shadow-md">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Variant Rows */}
          {resolvedHasVariants ? (
            <div className="space-y-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Variant</p>
              {activeResolvedVariants.map((variant: any) => {
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
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                      {variantImage ? (
                        <AppImage
                          src={variantImage}
                          alt={variant.name}
                          className="w-full h-full object-cover"
                          widths={[96, 160]}
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {variant.name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-primary-600">
                          ₹{formatPrice(variant.sellingPrice)}
                        </span>
                        {variant.mrp > variant.sellingPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{formatPrice(variant.mrp)}
                          </span>
                        )}
                        {vDiscount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 font-bold rounded-full">
                            {vDiscount}% OFF
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
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
                      disabled={addingVariantId === variant.id || isOutOfStock}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        variantInCart
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-gradient-to-r from-primary-600 to-blue-600 text-white hover:from-primary-700 hover:to-blue-700 shadow-md shadow-primary-500/25"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {addingVariantId === variant.id ? "Adding..." : variantInCart ? "In Cart" : "Add"}
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
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <button
            onClick={() => {
              onClose();
              navigate(`/products/${product.slug}`);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Package className="h-4 w-4" />
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

  const { data: stockData } = useQuery({
    queryKey: ["cartDrawerStock", product?.slug],
    queryFn: async () => {
      const res = await api.get(`/products/slug/${product.slug}`);
      const p = res.data;
      const inv = (p.inventories || []).find((i: any) => !i.productVariantId);
      return inv ? Math.max(0, (inv.quantity || 0) - (inv.reservedQuantity || 0)) : Infinity;
    },
    enabled: !!product?.slug,
    staleTime: 30_000,
  });
  const stock = stockData ?? Infinity;

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

  const isOutOfStock = stock === 0;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-primary-50/30 rounded-2xl p-5 mb-4 border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Quantity</p>
      {stock > 0 && stock <= 5 && (
        <p className="text-xs font-semibold text-amber-600 mb-2">Only {stock} left in stock</p>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-30 rounded-l-xl"
            disabled={quantity <= 1}
            title="Decrease quantity"
          >
            <Minus className="h-4 w-4 text-gray-600" />
          </button>
          <span className="px-5 py-2 text-lg font-bold text-gray-900 min-w-[60px] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(q + 1, stock))}
            className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-30 rounded-r-xl"
            disabled={quantity >= stock}
            title="Increase quantity"
          >
            <Plus className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending || isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
            isOutOfStock
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-primary-600 to-blue-600 text-white hover:from-primary-700 hover:to-blue-700 shadow-primary-500/25"
          } disabled:opacity-50`}
        >
          <ShoppingCart className="h-4 w-4" />
          {addToCartMutation.isPending ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
