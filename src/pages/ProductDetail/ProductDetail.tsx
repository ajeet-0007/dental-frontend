import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import {
  Package,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { VariantSelector, ProductVariant } from "@/components/common/VariantSelector";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09";

export default function ProductDetail() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [productError, setProductError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      try {
        const res = await api.get(`/products/slug/${slug}`);
        setProductError(false);
        return res.data;
      } catch (error: any) {
        if (error?.response?.status === 404 && slug) {
          const numericId = slug.match(/^\d+$/) ? slug : null;
          if (numericId) {
            const res = await api.get(`/products/${numericId}`);
            setProductError(false);
            return res.data;
          }
        }
        setProductError(true);
        throw error;
      }
    },
  });

  const product = data;
  const variants: ProductVariant[] = product?.variants || [];
  const activeVariants = variants.filter(v => v.isActive);
  
  const hasVariants = activeVariants.length > 0;

  const getVariantStock = (variantId: string | undefined) => {
    if (!variantId || !product?.inventories) return -1;
    const inv = product.inventories.find((i: any) => i.productVariantId === variantId);
    return inv?.quantity ?? -1;
  };

  const selectedStock = getVariantStock(selectedVariant?.id);
  const isOutOfStock = selectedStock === 0;

  useEffect(() => {
    if (hasVariants && !selectedVariant && activeVariants.length > 0) {
      setSelectedVariant(activeVariants[0]);
    }
  }, [hasVariants, activeVariants, selectedVariant]);

  const selectedPrice = (selectedVariant && selectedVariant.sellingPrice > 0 ? selectedVariant.sellingPrice : null) 
    ?? (product?.sellingPrice && product.sellingPrice > 0 ? product.sellingPrice : product?.price ?? 0);
  const selectedMRP = (selectedVariant && selectedVariant.mrp > 0 ? selectedVariant.mrp : null) 
    ?? (product?.mrp && product.mrp > 0 ? product.mrp : product?.price ?? 0);
  
  const variantImages = selectedVariant?.images?.filter(Boolean) || [];
  const productImages = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
  const images = variantImages.length > 0 
    ? [...variantImages, ...productImages]
    : (productImages.length > 0 ? productImages : [DEFAULT_IMAGE]);
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const addToCartMutation = useMutation({
    mutationFn: (payload: { productId: string; productVariantId?: string; quantity: number }) =>
      api.post("/cart/add", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart!");
    },
    onError: () => {
      toast.error("Failed to add to cart");
    },
  });

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (selectedStock === 0) {
      toast.error("This variant is out of stock");
      return;
    }

    if (selectedStock > 0 && quantity > selectedStock) {
      toast.error(`Only ${selectedStock} items available in stock`);
      return;
    }

    const productId = String(product.id);
    const variantId = selectedVariant?.id;
    const cartItemId = variantId ? `${product.id}-${variantId}` : productId;

    const variantData = selectedVariant ? {
      id: selectedVariant.id,
      name: selectedVariant.name || '',
      sku: selectedVariant.sku,
      color: selectedVariant.color,
      size: selectedVariant.size,
      flavor: selectedVariant.flavor,
      packQuantity: selectedVariant.packQuantity || 1,
      price: selectedVariant.price,
      sellingPrice: selectedVariant.sellingPrice,
      mrp: selectedVariant.mrp,
      image: selectedVariant.image,
      weight: selectedVariant.weight,
      weightUnit: selectedVariant.weightUnit,
      options: selectedVariant.options,
    } : null;

    try {
      addToCartMutation.mutate({
        productId,
        productVariantId: variantId,
        quantity,
      });

      addItem({
        id: cartItemId,
        quantity,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          images: product.images || [],
          price: product.price || 0,
          sellingPrice: product.sellingPrice || product.price || 0,
          mrp: product.mrp || product.price || 0,
          unit: product.unit || 'unit',
        },
        variant: variantData,
      });
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setQuantity(1);
    setCurrentImageIndex(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
                <div className="h-12 bg-gray-200 rounded w-1/4 mt-8"></div>
                <div className="h-14 bg-gray-200 rounded w-full mt-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || productError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Product not found
        </h2>
        <p className="text-gray-500 mb-4">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/products" className="text-primary-600 hover:underline">
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => setShowLightbox(true)}
          >
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
              }}
            />

            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  <ZoomIn className="w-4 h-4 inline mr-1" />
                  Click to zoom
                </div>
              </>
            )}
          </div>

          {hasMultipleImages && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === index
                      ? "border-primary-600 ring-2 ring-primary-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-3xl font-bold text-primary-600">
              ₹{selectedPrice}
            </span>
            {selectedMRP > selectedPrice && selectedMRP > 0 && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  ₹{selectedMRP}
                </span>
                <span className="text-green-600 font-medium">
                  {Math.round((1 - selectedPrice / selectedMRP) * 100)}%
                  OFF
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-500">(4 reviews)</span>
          </div>

          {hasVariants && (
            <div className="mb-6">
              <VariantSelector
                variants={activeVariants}
                options={product.options}
                selectedVariant={selectedVariant}
                onVariantSelect={handleVariantSelect}
                inventories={product.inventories?.map((inv: any) => ({
                  variantId: inv.productVariantId,
                  quantity: inv.quantity,
                })) || []}
              />
            </div>
          )}

          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <label className="text-gray-600">Quantity:</label>
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4 py-2">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-4 py-2 hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending || isOutOfStock}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg ${
              isOutOfStock
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            } disabled:opacity-50`}
          >
            <ShoppingCart className="h-5 w-5" />
            {addToCartMutation.isPending ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>

      {showLightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
          >
            <span className="text-3xl">&times;</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <img
            src={images[currentImageIndex]}
            alt={product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((img: string, index: number) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  currentImageIndex === index
                    ? "border-white scale-110"
                    : "border-white/30 hover:border-white/60"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
