import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api, { reviewsApi } from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useRecentlyViewedStore } from "@/stores/recentlyViewedStore";
import {
  Package, ShoppingCart, Star, ChevronLeft, ChevronRight, Heart,
  Minus, Plus, X, ArrowRight, Layers, Share2
} from "lucide-react";
import type { ProductVariant } from "@/components/common/VariantSelector";
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
  const { addItem: addToRecentlyViewed } = useRecentlyViewedStore();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [productError, setProductError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
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

  const productStock = getProductStock();

  useEffect(() => {
    setActiveTab("description");
  }, []);

  useEffect(() => {
    if (product) {
      addToRecentlyViewed({
        id: String(product.id),
        name: product.name,
        slug: product.slug,
        images: product.images || [],
        sellingPrice: product.sellingPrice || 0,
        mrp: product.mrp || 0,
        unit: product.unit || "unit",
      });
    }
  }, [product?.id]);

  const displayPrice = hasVariants
    ? Math.min(...activeVariants.map(v => v.sellingPrice).filter(p => p > 0))
    : (product?.sellingPrice ?? 0);
  const displayMRP = hasVariants
    ? Math.max(...activeVariants.map(v => v.mrp).filter(p => p > 0))
    : (product?.mrp ?? 0);

  const productImages = Array.isArray(product?.images)
    ? product.images.filter(Boolean)
    : [];
  const images = productImages.length > 0 ? productImages : [DEFAULT_IMAGE];
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

    if (productStock === 0) {
      toast.error("This product is out of stock");
      return;
    }

    if (productStock > 0 && quantity > productStock) {
      toast.error(`Only ${productStock} items available in stock`);
      return;
    }

    try {
      addToCartMutation.mutate({
        productId: String(product.id),
        quantity,
      });

      addItem({
        id: String(product.id),
        quantity,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          images: product.images || [],
          sellingPrice: product.sellingPrice || 0,
          mrp: product.mrp || 0,
          unit: product.unit || "unit",
        },
        variant: null,
      });
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleVariantAddToCart = (variant: ProductVariant) => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    const stock = getVariantStock(variant.id);
    if (stock === 0) {
      toast.error("This variant is out of stock");
      return;
    }

    addToCartMutation.mutate({
      productId: String(product.id),
      productVariantId: variant.id,
      quantity: 1,
    });

    addItem({
      id: `${product.id}-${variant.id}`,
      quantity: 1,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        images: product.images || [],
        sellingPrice: product.sellingPrice || 0,
        mrp: product.mrp || 0,
        unit: product.unit || "unit",
      },
      variant: {
        id: variant.id,
        name: variant.name || "",
        sku: variant.sku,
        sellingPrice: variant.sellingPrice,
        mrp: variant.mrp,
        image: variant.image,
        packQuantity: variant.packQuantity || 1,
      },
    });
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
          sellingPrice: product.sellingPrice || 0,
          mrp: product.mrp || 0,
          unit: product.unit || "unit",
        },
        addedAt: Date.now(),
      });
      toast.success("Added to wishlist!");
    }
  };

  const isInWishlist = wishlistItems.some((item) => item.id === `wishlist-${product?.id}`);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: product?.name || "Check out this product",
      text: `Check out ${product?.name} on Dentalkart`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard!");
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

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
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Images - Left Side */}
            <div className="lg:col-span-2 p-4 md:p-6 lg:p-8">
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
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-2 md:mb-4 leading-tight">
                    {product.name}
                  </h1>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <Share2 className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                  </button>
                </div>

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
                  {hasVariants && (
                    <span className="text-sm md:text-base font-medium text-gray-500 mr-1">
                      Starting at
                    </span>
                  )}
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                    ₹{displayPrice.toLocaleString()}
                  </span>
                  {displayMRP > displayPrice && displayMRP > 0 && (
                    <>
                      <span className="text-sm md:text-lg text-gray-400 line-through">
                        ₹{displayMRP.toLocaleString()}
                      </span>
                      <span className="bg-green-100 text-green-700 text-[10px] md:text-sm font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                        {Math.round((1 - displayPrice / displayMRP) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Short Description */}
                {product.shortDescription && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 pt-2">
                    {product.shortDescription}
                  </p>
                )}
              </div>

              {/* Variant List */}
              {hasVariants && (
                <div className="mb-4 md:mb-6">
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Variants</h3>
                  <div className="space-y-2">
                    {activeVariants.map((variant) => {
                      const stock = getVariantStock(variant.id);
                      const isOutOfStock = stock === 0;
                      const variantPrice = variant.sellingPrice || displayPrice;
                      const variantMRP = variant.mrp || displayMRP;
                      const discount = variantMRP > variantPrice
                        ? Math.round((1 - variantPrice / variantMRP) * 100)
                        : 0;

                      return (
                        <div
                          key={variant.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            isOutOfStock
                              ? "opacity-55 bg-gray-50"
                              : "bg-white hover:border-primary-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border">
                            <img
                              src={variant.image || variant.images?.[0] || product?.images?.[0] || DEFAULT_IMAGE}
                              alt={variant.name || "Variant"}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm leading-tight truncate">
                              {variant.name || variant.sku || "Variant"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-sm font-bold text-gray-900">
                                ₹{variantPrice.toLocaleString()}
                              </span>
                              {variantMRP > variantPrice && variantMRP > 0 && (
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{variantMRP.toLocaleString()}
                                </span>
                              )}
                              {discount > 0 && (
                                <span className="text-[10px] bg-green-100 text-green-700 font-medium px-1.5 py-0.5 rounded">
                                  {discount}% OFF
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                isOutOfStock ? "bg-red-500" : stock <= 5 ? "bg-orange-500" : "bg-green-500"
                              }`} />
                              <span className={`text-xs ${
                                isOutOfStock ? "text-red-500" : stock <= 5 ? "text-orange-500" : "text-green-600"
                              }`}>
                                {isOutOfStock ? "Out of Stock" : stock <= 5 ? `Only ${stock} left` : "In Stock"}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleVariantAddToCart(variant)}
                            disabled={addToCartMutation.isPending || isOutOfStock}
                            className={`flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex-shrink-0 ${
                              isOutOfStock
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.97]"
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {addToCartMutation.isPending ? "Adding..." : "Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart (single product) */}
              {!hasVariants && (
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
                    disabled={addToCartMutation.isPending || productStock === 0}
                    className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2.5 md:py-3.5 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all ${
                      productStock === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                    {addToCartMutation.isPending
                      ? "Adding..."
                      : productStock === 0
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

                  <button
                    onClick={handleShare}
                    className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                  </button>
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
            <div className="flex items-end justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest">
                    Related Products
                  </p>
                  <h2 className="text-xl font-bold text-gray-900">You May Also Like</h2>
                </div>
              </div>
              <Link
                to="/products"
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <span>Explore More</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ProductCarousel 
              products={recommendedProducts} 
              onOpenCartDrawer={(product) => {
                setSelectedProductForDrawer(product);
                setIsCartDrawerOpen(true);
              }} 
            />
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
