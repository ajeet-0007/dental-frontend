import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api, { reviewsApi } from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import {
  Package,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShieldCheck,
  RotateCw,
  Minus,
  Plus,
  X,
  ArrowRight,
} from "lucide-react";
import { VariantSelector, ProductVariant } from "@/components/common/VariantSelector";
import HtmlRenderer from "@/components/common/HtmlRenderer";
import ProductCarousel from "@/components/common/ProductCarousel";
import CartDrawer from "@/components/common/CartDrawer";
import { ReviewsSection } from "@/components/common/Reviews";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09";

export default function ProductDetail() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [productError, setProductError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeTab, setActiveTab] = useState("description");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [selectedProductForDrawer, setSelectedProductForDrawer] = useState<any>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && hasMultipleImages) {
      nextImage();
    }
    if (isRightSwipe && hasMultipleImages) {
      prevImage();
    }
  };

  const tabs = [
    { id: "features", label: "Features" },
    { id: "description", label: "Description" },
    { id: "specifications", label: "Key Specifications" },
    { id: "packaging", label: "Packaging" },
    { id: "directions", label: "Direction to Use" },
    { id: "additional", label: "Additional Info" },
    { id: "warranty", label: "Warranty" },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      try {
        const res = await api.get(`/products/slug/${slug}`);
        setProductError(false);
        return res.data;
      } catch (error: any) {
        setProductError(true);
        throw error;
      }
    },
  });

  const product = data;

  const { data: recommendedData } = useQuery({
    queryKey: ["products", "recommended", product?.category?.slug],
    queryFn: async () => {
      if (!product?.category?.slug) return [];
      const response = await api.get(
        `/products/recommended?categories=${product.category.slug}&exclude=${product.id}&limit=8`
      );
      return response.data || [];
    },
    enabled: !!product?.category?.slug,
  });

  const { data: reviewStatsData } = useQuery({
    queryKey: ["reviewStats", product?.id],
    queryFn: async () => {
      if (!product?.id) return null;
      const response = await reviewsApi.getStats(String(product.id));
      return response.data;
    },
    enabled: !!product?.id,
  });

  const recommendedProducts = recommendedData || [];
  const variants: ProductVariant[] = product?.variants || [];
  const activeVariants = variants.filter((v) => v.isActive);
  const hasVariants = activeVariants.length > 0;

  const getVariantStock = (variantId: string | undefined) => {
    if (!variantId || !product?.inventories) return 0;
    const inv = product.inventories.find(
      (i: any) => i.productVariantId === variantId
    );
    return inv ? inv.quantity - inv.reservedQuantity : 0;
  };

  const getProductStock = () => {
    const inventories = product?.inventories || [];
    const inv = inventories.find((i: any) => !i.productVariantId);
    return inv ? inv.quantity - inv.reservedQuantity : 0;
  };

  const selectedStock = hasVariants 
    ? getVariantStock(selectedVariant?.id) 
    : getProductStock();
  const isOutOfStock = selectedStock === 0;

  useEffect(() => {
    setActiveTab("description");
  }, []);

  useEffect(() => {
    if (hasVariants && !selectedVariant && activeVariants.length > 0) {
      setSelectedVariant(activeVariants[0]);
    }
  }, [hasVariants, activeVariants, selectedVariant]);

  const selectedPrice =
    (selectedVariant && selectedVariant.sellingPrice > 0
      ? selectedVariant.sellingPrice
      : null) ??
    (product?.sellingPrice && product.sellingPrice > 0
      ? product.sellingPrice
      : product?.price ?? 0);
  const selectedMRP =
    (selectedVariant && selectedVariant.mrp > 0
      ? selectedVariant.mrp
      : null) ??
    (product?.mrp && product.mrp > 0 ? product.mrp : product?.price ?? 0);

  const variantImages = selectedVariant?.images?.filter(Boolean) || [];
  const productImages = Array.isArray(product?.images)
    ? product.images.filter(Boolean)
    : [];
  const images =
    variantImages.length > 0
      ? [...variantImages, ...productImages]
      : productImages.length > 0
        ? productImages
        : [DEFAULT_IMAGE];
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const addToCartMutation = useMutation({
    mutationFn: (payload: {
      productId: string;
      productVariantId?: string;
      quantity: number;
    }) => api.post("/cart/add", payload),
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

    const variantData = selectedVariant
      ? {
          id: selectedVariant.id,
          name: selectedVariant.name || "",
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
        }
      : null;

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
          unit: product.unit || "unit",
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

  const handleToggleWishlist = () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    const productId = product.id.toString();
    const wishlistId = `wishlist-${productId}`;

    if (wishlistItems.some((item) => item.id === wishlistId)) {
      removeFromWishlist(wishlistId);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: wishlistId,
        product: {
          id: productId,
          name: product.name,
          slug: product.slug,
          images: product.images || [],
          price: product.price || 0,
          sellingPrice: product.sellingPrice || product.price || 0,
          mrp: product.mrp || product.price || 0,
          unit: product.unit || "unit",
        },
        addedAt: Date.now(),
      });
      toast.success("Added to wishlist!");
    }
  };

  const isInWishlist = wishlistItems.some((item) => item.id === `wishlist-${product?.id}`);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
              <div className="aspect-square bg-gray-200 rounded-xl md:rounded-2xl"></div>
              <div className="space-y-4 md:space-y-6">
                <div className="h-5 md:h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 md:h-12 bg-gray-200 rounded w-1/3"></div>
                <div className="h-16 md:h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || productError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Product not found
          </h2>
          <p className="text-gray-500 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen overflow-x-hidden">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 lg:px-4 lg:py-12 max-w-full">
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm overflow-hidden max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 max-w-full overflow-hidden">
            {/* Images - Left Side */}
            <div className="lg:col-span-2 p-3 md:p-6 lg:p-10">
              <div className="lg:sticky lg:top-8">
                {/* Main Image */}
                <div
                  ref={imageContainerRef}
                  className="relative aspect-square bg-gray-50 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => setShowLightbox(true)}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain p-2 md:p-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />

                  {/* Navigation Arrows - Always visible on mobile */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-1.5 md:p-2.5 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-1.5 md:p-2.5 transition-all"
                      >
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-black/60 text-white text-[10px] md:text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {hasMultipleImages && (
                  <div className="flex gap-1.5 md:gap-2 mt-3 md:mt-4 overflow-x-auto pb-2">
                    {images.map((img: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg md:rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                          currentImageIndex === index
                            ? "border-primary-600 ring-2 ring-primary-100"
                            : "border-gray-100 hover:border-gray-300"
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
            </div>

            {/* Product Info - Right Side */}
            <div className="lg:col-span-3 p-4 md:p-6 lg:p-10 lg:border-l lg:border-gray-100">
              {/* Header */}
              <div className="mb-4 md:mb-6 lg:mb-8">
                <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-2 md:mb-4 leading-tight">
                  {product.name}
                </h1>

                {/* Rating */}
                {reviewStatsData?.averageRating ? (
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 md:h-4 md:w-4 ${
                          i < Math.round(reviewStatsData?.averageRating || 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs md:text-sm text-gray-500">
                    {reviewStatsData?.averageRating 
                      ? `${reviewStatsData.averageRating.toFixed(1)} (${reviewStatsData.totalReviews} reviews)` 
                      : ''}
                  </span>
                </div>
                ) : null}

                {/* Price */}
                <div className="flex flex-wrap items-baseline gap-1.5 md:gap-3">
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                    ₹{selectedPrice.toLocaleString()}
                  </span>
                  {selectedMRP > selectedPrice && selectedMRP > 0 && (
                    <>
                      <span className="text-sm md:text-lg text-gray-400 line-through">
                        ₹{selectedMRP.toLocaleString()}
                      </span>
                      <span className="bg-green-100 text-green-700 text-[10px] md:text-sm font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                        {Math.round((1 - selectedPrice / selectedMRP) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Variants */}
              {hasVariants && (
                <div className="mb-4 md:mb-6">
                  <VariantSelector
                    variants={activeVariants}
                    options={product.options}
                    selectedVariant={selectedVariant}
                    onVariantSelect={handleVariantSelect}
                    inventories={
                      product.inventories?.map((inv: any) => ({
                        variantId: inv.productVariantId,
                        quantity: inv.quantity - (inv.reservedQuantity || 0),
                      })) || []
                    }
                  />
                </div>
              )}

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2 mb-4 md:mb-6">
                <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600 bg-gray-50 rounded-lg px-1.5 md:px-3 py-1.5 md:py-2">
                  <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  <span>Quality Assured</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600 bg-gray-50 rounded-lg px-1.5 md:px-3 py-1.5 md:py-2">
                  <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                  <span>Genuine Product</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600 bg-gray-50 rounded-lg px-1.5 md:px-3 py-1.5 md:py-2">
                  <RotateCw className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
                  <span>Easy Returns</span>
                </div>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="flex items-center bg-gray-100 rounded-lg md:rounded-xl">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 md:p-3 hover:bg-gray-200 rounded-l-lg md:rounded-l-xl transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </button>
                  <span className="px-2 md:px-4 font-semibold text-sm md:text-base min-w-[36px] md:min-w-[48px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-2 md:p-3 hover:bg-gray-200 rounded-r-lg md:rounded-r-xl transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending || isOutOfStock}
                  className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2.5 md:py-3.5 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all ${
                    isOutOfStock
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]"
                  }`}
                >
                  <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                  {addToCartMutation.isPending
                    ? "Adding..."
                    : isOutOfStock
                      ? "Out of Stock"
                      : "Add to Cart"}
                </button>

                <button
                  onClick={handleToggleWishlist}
                  className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-colors ${
                    isInWishlist
                      ? "bg-red-50 hover:bg-red-100"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 md:h-5 md:w-5 ${
                      isInWishlist ? "text-red-500 fill-red-500" : "text-gray-600"
                    }`}
                  />
                </button>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <div className="border-t border-gray-100 pt-4 md:pt-5 mt-4 md:mt-5">
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                    {product.shortDescription}
                  </p>
                </div>
              )}

              {/* Tabs */}
              <div className="border-t border-gray-100 pt-4 md:pt-6 mt-4 md:mt-6">
                {/* Tab Headers - Horizontal Scroll */}
                <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 max-w-[calc(100vw-1.5rem)]">
                  <div className="flex gap-1.5 md:gap-2 min-w-max pr-6">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-2.5 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-medium whitespace-nowrap rounded-lg transition-all ${
                          activeTab === tab.id
                            ? "bg-primary-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="py-4 md:py-6 h-[250px] md:h-[300px] overflow-y-auto">
                  {/* Features */}
                  {activeTab === "features" && (
                    <div className="text-sm md:text-base">
                      {product.features ? (
                        <HtmlRenderer content={product.features} />
                      ) : (
                        <p className="text-xs md:text-sm text-gray-400">No features available</p>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {activeTab === "description" && (
                    <div className="text-sm md:text-base">
                      {product.description ? (
                        <HtmlRenderer content={product.description} />
                      ) : (
                        <p className="text-xs md:text-sm text-gray-400">No description available</p>
                      )}
                    </div>
                  )}

                  {/* Specifications */}
                  {activeTab === "specifications" && (
                    <div className="text-sm md:text-base">
                      {product.keySpecifications ? (
                        <HtmlRenderer content={product.keySpecifications} />
                      ) : (
                        <p className="text-xs md:text-sm text-gray-400">
                          No specifications available
                        </p>
                      )}
                    </div>
                  )}

                  {/* Packaging */}
                  {activeTab === "packaging" && (
                    <div className="text-sm md:text-base">
                      {product.packaging ? (
                        <HtmlRenderer content={product.packaging} />
                      ) : (
                        <p className="text-xs md:text-sm text-gray-400">
                          No packaging info available
                        </p>
                      )}
                    </div>
                  )}

                  {/* Directions */}
                  {activeTab === "directions" && (
                    <div className="text-sm md:text-base">
                      {product.directionToUse ? (
                        <HtmlRenderer content={product.directionToUse} />
                      ) : (
                        <p className="text-xs md:text-sm text-gray-400">
                          No directions available
                        </p>
                      )}
                    </div>
                  )}

                  {/* Additional */}
                  {activeTab === "additional" && (
                    <div className="text-sm md:text-base">
                      {product.additionalInfo ? (
                        <HtmlRenderer content={product.additionalInfo} />
                      ) : (
                        <p className="text-xs md:text-sm text-gray-400">
                          No additional info available
                        </p>
                      )}
                    </div>
                  )}

                  {/* Warranty */}
                  {activeTab === "warranty" && (
                    <div className="text-sm md:text-base">
                      {product.warranty ? (
                        <HtmlRenderer content={product.warranty} />
                      ) : (
                        <p className="text-xs md:text-sm text-gray-400">
                          No warranty information
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {recommendedProducts.length > 0 && (
          <section className="mt-12">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-5 w-5 text-primary-600" />
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest">
                  Related Products
                </p>
              </div>
              <h2 className="text-xl font-bold text-gray-900">You May Also Like</h2>
            </div>
            <ProductCarousel 
              products={recommendedProducts} 
              onOpenCartDrawer={(product) => {
                setSelectedProductForDrawer(product);
                setIsCartDrawerOpen(true);
              }} 
            />
            <div className="mt-6 text-center">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <span>Explore More Products</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <ReviewsSection productId={product.id} />
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white p-2"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 md:p-3 bg-white/10 rounded-full"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <img
            src={images[currentImageIndex]}
            alt={product.name}
            className="max-w-[90vw] max-h-[70vh] md:max-w-[85vw] md:max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 md:p-3 bg-white/10 rounded-full"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 max-w-[90vw] overflow-x-auto px-4">
            {images.map((img: string, index: number) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-10 h-10 md:w-14 md:h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  currentImageIndex === index
                    ? "border-white"
                    : "border-white/30 hover:border-white/60"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cart Drawer for related products */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => {
          setIsCartDrawerOpen(false);
          setSelectedProductForDrawer(null);
        }}
        product={selectedProductForDrawer}
      />
    </div>
  );
}
