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
  Heart,
  Truck,
  ShieldCheck,
  RotateCw,
  CheckCircle2,
  Minus,
  Plus,
  X,
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
  const [activeTab, setActiveTab] = useState("description");

  const tabs = [
    { id: "description", label: "Description" },
    { id: "features", label: "Features" },
    { id: "specifications", label: "Specifications" },
    { id: "packaging", label: "Packaging" },
    { id: "directions", label: "Directions" },
    { id: "additional", label: "More Info" },
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
  const activeVariants = variants.filter((v) => v.isActive);
  const hasVariants = activeVariants.length > 0;

  const getVariantStock = (variantId: string | undefined) => {
    if (!variantId || !product?.inventories) return -1;
    const inv = product.inventories.find(
      (i: any) => i.productVariantId === variantId
    );
    return inv?.quantity ?? -1;
  };

  const selectedStock = getVariantStock(selectedVariant?.id);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-2xl"></div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-12 bg-gray-200 rounded w-1/3"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
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
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Images - Left Side */}
            <div className="lg:col-span-2 p-8 lg:p-10">
              <div className="sticky top-8">
                {/* Main Image */}
                <div
                  className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => setShowLightbox(true)}
                >
                  <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />

                  {/* Navigation Arrows */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {hasMultipleImages && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {images.map((img: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
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
            <div className="lg:col-span-3 p-8 lg:p-10 border-l border-gray-100">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < 4
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">(4 reviews)</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{selectedPrice.toLocaleString()}
                  </span>
                  {selectedMRP > selectedPrice && selectedMRP > 0 && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        ₹{selectedMRP.toLocaleString()}
                      </span>
                      <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">
                        {Math.round((1 - selectedPrice / selectedMRP) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Variants */}
              {hasVariants && (
                <div className="mb-6">
                  <VariantSelector
                    variants={activeVariants}
                    options={product.options}
                    selectedVariant={selectedVariant}
                    onVariantSelect={handleVariantSelect}
                    inventories={
                      product.inventories?.map((inv: any) => ({
                        variantId: inv.productVariantId,
                        quantity: inv.quantity,
                      })) || []
                    }
                  />
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Quality Assured
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  Genuine Product
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <RotateCw className="h-4 w-4 text-amber-500" />
                  Easy Returns
                </div>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-3 hover:bg-gray-200 rounded-l-xl transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 font-semibold min-w-[48px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-3 hover:bg-gray-200 rounded-r-xl transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending || isOutOfStock}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    isOutOfStock
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]"
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {addToCartMutation.isPending
                    ? "Adding..."
                    : isOutOfStock
                      ? "Out of Stock"
                      : "Add to Cart"}
                </button>

                <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  <Heart className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Short Description */}
              {product.description && (
                <div className="border-t border-gray-100 pt-5 mt-5">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {typeof product.description === 'string' 
                      ? product.description 
                      : Array.isArray(product.description) 
                        ? product.description.join(' ')
                        : ''}
                  </p>
                </div>
              )}

              {/* Tabs */}
              <div className="border-t border-gray-100 pt-6 mt-6">
                {/* Tab Headers */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? "bg-primary-600 text-white shadow-md"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-50 rounded-2xl p-6 min-h-[160px]">
                  {/* Description */}
                  {activeTab === "description" && (
                    <div className="space-y-3">
                      {(product.description
                        ? Array.isArray(product.description)
                          ? product.description
                          : product.description
                              .split("\n")
                              .filter(Boolean)
                        : []
                      ).length > 0 ? (
                        (product.description
                          ? Array.isArray(product.description)
                            ? product.description
                            : product.description.split("\n").filter(Boolean)
                          : []
                        ).map((item: string, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">
                          No description available
                        </p>
                      )}
                    </div>
                  )}

                  {/* Features */}
                  {activeTab === "features" && (
                    <div className="space-y-3">
                      {product.features && product.features.length > 0 ? (
                        product.features.map(
                          (feature: string, index: number) => (
                            <div key={index} className="flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-sm text-gray-400">
                          No features available
                        </p>
                      )}
                    </div>
                  )}

                  {/* Specifications */}
                  {activeTab === "specifications" && (
                    <div className="grid grid-cols-2 gap-3">
                      {product.keySpecifications &&
                      Object.keys(product.keySpecifications).length > 0 ? (
                        Object.entries(product.keySpecifications).map(
                          ([key, value], index) => (
                            <div
                              key={index}
                              className="flex justify-between bg-gray-50 rounded-lg px-4 py-3"
                            >
                              <span className="text-sm text-gray-500">{key}</span>
                              <span className="text-sm font-medium text-gray-900">
                                {value as string}
                              </span>
                            </div>
                          )
                        )
                      ) : (
                        <p className="col-span-2 text-sm text-gray-400">
                          No specifications available
                        </p>
                      )}
                    </div>
                  )}

                  {/* Packaging */}
                  {activeTab === "packaging" && (
                    <div className="space-y-3">
                      {product.packaging ? (
                        (Array.isArray(product.packaging)
                          ? product.packaging
                          : product.packaging.split("\n").filter(Boolean)
                        ).map((item: string, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">
                          No packaging info available
                        </p>
                      )}
                    </div>
                  )}

                  {/* Directions */}
                  {activeTab === "directions" && (
                    <div className="space-y-3">
                      {product.directionToUse ? (
                        (Array.isArray(product.directionToUse)
                          ? product.directionToUse
                          : product.directionToUse
                              .split("\n")
                              .filter(Boolean)
                        ).map((item: string, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">
                          No directions available
                        </p>
                      )}
                    </div>
                  )}

                  {/* Additional */}
                  {activeTab === "additional" && (
                    <div className="space-y-3">
                      {product.additionalInfo ? (
                        (Array.isArray(product.additionalInfo)
                          ? product.additionalInfo
                          : product.additionalInfo
                              .split("\n")
                              .filter(Boolean)
                        ).map((item: string, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">
                          No additional info available
                        </p>
                      )}
                    </div>
                  )}

                  {/* Warranty */}
                  {activeTab === "warranty" && (
                    <div className="space-y-3">
                      {product.warranty ? (
                        (Array.isArray(product.warranty)
                          ? product.warranty
                          : product.warranty.split("\n").filter(Boolean)
                        ).map((item: string, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">
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
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 bg-white/10 rounded-full"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <img
            src={images[currentImageIndex]}
            alt={product.name}
            className="max-w-[85vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 bg-white/10 rounded-full"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
            {images.map((img: string, index: number) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
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
    </div>
  );
}
