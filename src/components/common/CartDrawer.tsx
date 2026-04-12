import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { X, Plus, Minus, ShoppingCart, Check, Calendar, Package } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function CartDrawer({ isOpen, onClose, product }: CartDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const productRef = useRef<any>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem, items } = useCartStore();
  const queryClient = useQueryClient();

  const variants = product?.variants || [];
  const activeVariants = variants.filter((v: any) => v.isActive);
  const hasVariants = activeVariants.length > 0;

  // Reset selected variant when drawer opens with new product
  useEffect(() => {
    if (isOpen && product?.id !== productRef.current?.id) {
      setSelectedVariantId(activeVariants[0]?.id || null);
      productRef.current = product;
      setIsInitialized(true);
    } else if (isOpen && !isInitialized && activeVariants.length > 0) {
      setSelectedVariantId(activeVariants[0].id);
      setIsInitialized(true);
    }
  }, [isOpen, product?.id]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  const selectedVariant = selectedVariantId && isInitialized
    ? activeVariants.find((v: any) => v.id === selectedVariantId)
    : null;

  const cartItemKey = selectedVariantId
    ? `${product?.id}-${selectedVariantId}`
    : product?.id?.toString();

  const isInCart = items.some((item) => item.id === cartItemKey);
  const existingItem = items.find((item) => item.id === cartItemKey);
  const currentQuantity = existingItem?.quantity || 0;

  const currentPrice = selectedVariant?.sellingPrice || product?.sellingPrice || 0;
  const currentMrp = selectedVariant?.mrp || product?.mrp || 0;

  const getProductInventory = () => {
    const inventories = product?.inventories || [];
    if (hasVariants) {
      const inv = inventories.find((i: any) => i.productVariantId === selectedVariantId);
      return inv ? inv.quantity - inv.reservedQuantity : 0;
    } else {
      const inv = inventories.find((i: any) => !i.productVariantId);
      return inv ? inv.quantity - inv.reservedQuantity : 0;
    }
  };

  const availableStock = getProductInventory();
  const isOutOfStock = availableStock <= 0;
  const maxQuantity = isOutOfStock ? 0 : Math.min(availableStock, 10);

  const addToCartMutation = useMutation({
    mutationFn: () =>
      api.post("/cart/add", {
        productId: product.id,
        productVariantId: selectedVariantId || undefined,
        quantity,
      }),
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

    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} items available in stock`);
      return;
    }

    try {
      await addToCartMutation.mutateAsync();
      addItem({
        id: cartItemKey,
        quantity,
        product: {
          id: product.id.toString(),
          name: product.name,
          slug: product.slug,
          images: product.images,
          price: product.price,
          sellingPrice: currentPrice,
          mrp: currentMrp,
          unit: product.unit || "unit",
        },
        variant: selectedVariant
          ? {
              id: selectedVariant.id,
              name: selectedVariant.name,
              sku: selectedVariant.sku,
              color: selectedVariant.color,
              size: selectedVariant.size,
              flavor: selectedVariant.flavor,
              packQuantity: selectedVariant.packQuantity,
              price: selectedVariant.price,
              sellingPrice: selectedVariant.sellingPrice,
              mrp: selectedVariant.mrp,
              image: selectedVariant.image,
            }
          : null,
      });
      toast.success("Added to cart!");
      onClose();
      setQuantity(1);
      setSelectedVariantId(null);
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleClose = () => {
    onClose();
    setQuantity(1);
  };

  if (!isOpen || !product) return null;

  const discountPercent = currentMrp > currentPrice
    ? Math.round((1 - currentPrice / currentMrp) * 100)
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
                  ₹{currentPrice.toLocaleString()}
                </span>
                {currentMrp > currentPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{currentMrp.toLocaleString()}
                  </span>
                )}
              </div>
              {discountPercent > 0 && (
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  {discountPercent}% OFF
                </span>
              )}
              {selectedVariant && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">
                    Variant: {selectedVariant.name}
                  </p>
                  {selectedVariant.expiresAt && (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                      <Calendar className="w-3 h-3" />
                      Exp: {new Date(selectedVariant.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Variant Selection */}
          {hasVariants && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Variant
              </label>
              <div className="grid grid-cols-1 gap-2">
                {activeVariants.map((variant: any, index: number) => {
                  const isStandard = index === 0;
                  const variantLabel = variant.options && variant.options.length > 0
                    ? variant.options.map((o: any) => o.optionValue).join(" - ")
                    : [
                        variant.color && `Color: ${variant.color}`,
                        variant.size && `Size: ${variant.size}`,
                        variant.flavor && `Flavor: ${variant.flavor}`,
                      ]
                        .filter(Boolean)
                        .join(" • ");
                  
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        selectedVariantId === variant.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedVariantId === variant.id
                              ? "border-primary-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedVariantId === variant.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {isStandard ? 'Standard' : variantLabel || variant.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isStandard ? variantLabel || variant.name : variant.sku || 'No SKU'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          ₹{variant.sellingPrice.toLocaleString()}
                        </p>
                        {variant.mrp > variant.sellingPrice && (
                          <p className="text-xs text-gray-400 line-through">
                            ₹{variant.mrp.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quantity
            </label>
            <div className="flex items-center justify-between">
              <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-30"
                  disabled={quantity <= 1 || isOutOfStock}
                >
                  <Minus className="h-4 w-4 text-gray-600" />
                </button>
                <span className="px-4 py-2 text-base font-medium text-gray-900 min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(q + 1, maxQuantity))}
                  className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-30"
                  disabled={quantity >= maxQuantity || isOutOfStock}
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Subtotal</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{(currentPrice * quantity).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Info */}
          <div className={`rounded-xl p-3 mb-4 ${isOutOfStock ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className={`flex items-center gap-2 ${isOutOfStock ? 'text-red-600' : 'text-green-700'}`}>
              {isOutOfStock ? (
                <>
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">Out of Stock</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {availableStock} items available in stock
                  </span>
                </>
              )}
            </div>
          </div>

          {isInCart && (
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Already in cart ({currentQuantity} items)
                  {selectedVariant && ` - ${selectedVariant.name}`}
                </span>
              </div>
            </div>
          )}

          {/* Short Description */}
          {product.shortDescription && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 line-clamp-3">{product.shortDescription}</p>
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
            disabled={addToCartMutation.isPending || isOutOfStock}
            className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all ${
              isInCart
                ? "bg-green-600 text-white hover:bg-green-700"
                : isOutOfStock
                  ? "bg-gray-400 text-white"
                  : "bg-primary-600 text-white hover:bg-primary-700"
            } disabled:opacity-50`}
          >
            {addToCartMutation.isPending ? (
              "Adding..."
            ) : isOutOfStock ? (
              <>
                <Package className="h-5 w-5" />
                Out of Stock
              </>
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
