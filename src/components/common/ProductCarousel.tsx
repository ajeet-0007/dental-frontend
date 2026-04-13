import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { ShoppingCart, Heart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import toast from "react-hot-toast";
import { useSwipe } from "@/hooks/useSwipe";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop";

interface ProductCarouselProps {
  products: any[];
  onOpenCartDrawer?: (product: any) => void;
}

export default function ProductCarousel({ products, onOpenCartDrawer }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { items } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, items: wishlistItems } = useWishlistStore();

  const totalSlides = Math.ceil(products.length / visibleCount);
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < totalSlides - 1;

  const updateVisibleCount = useCallback(() => {
    if (typeof window === "undefined") return;
    const width = window.innerWidth;
    if (width < 640) setVisibleCount(2);
    else if (width < 1024) setVisibleCount(3);
    else setVisibleCount(5);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", updateVisibleCount);
      window.removeEventListener("resize", checkMobile);
    };
  }, [updateVisibleCount]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => {
        document.getElementById("product-grid-view")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)));
  };

  const nextSlide = () => {
    if (canScrollRight) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (canScrollLeft) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(totalSlides - 1);
    }
  };

  useEffect(() => {
    if (isPaused || products.length === 0) return;

    intervalRef.current = setInterval(() => {
      nextSlide();
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, currentIndex, products.length]);

  const handleQuickAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (onOpenCartDrawer) {
      onOpenCartDrawer(product);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();

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

  const displayedProducts = products.slice(
    currentIndex * visibleCount,
    currentIndex * visibleCount + visibleCount
  );

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
  });

  if (products.length === 0) return null;

  const cardWidth = isMobile 
    ? "w-[calc(50%-8px)] min-w-[160px]" 
    : "w-[calc((100%-64px)/5)] min-w-[200px]";

  return (
    <div>
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            id="product-grid-view"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-3"
          >
            {products.map((product, index) => {
              const isInCart = items.some((item) => item.id === product.id.toString());
              const wishlistId = `wishlist-${product.id}`;
              const isInWishlist = wishlistItems.some((item) => item.id === wishlistId);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full"
                >
                  <Link
                    to={`/products/${product.slug}`}
                    className="block bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={DEFAULT_IMAGE}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                        <button
                          onClick={(e) => handleToggleWishlist(e, product)}
                          className={`p-2.5 rounded-full shadow-md transition-colors touch-manipulation ${
                            isInWishlist
                              ? "bg-red-500 text-white"
                              : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-500"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isInWishlist ? "fill-white" : ""}`} />
                        </button>
                        <button
                          onClick={(e) => handleQuickAddToCart(e, product)}
                          className={`p-2.5 rounded-full shadow-md transition-colors touch-manipulation ${
                            isInCart
                              ? "bg-green-500 text-white"
                              : "bg-primary-600 text-white hover:bg-primary-700"
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                      {product.mrp > product.sellingPrice && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                          {Math.round((1 - product.sellingPrice / product.mrp) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-primary-600">
                          ₹{product.sellingPrice || product.price}
                        </span>
                        {product.mrp > product.sellingPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{product.mrp}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative group touch-pan-y"
          >
            <div
              ref={containerRef}
              className="overflow-hidden -mx-4 px-4 md:mx-0 md:px-0"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <motion.div
                className="flex gap-4 md:gap-4"
                initial={false}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {displayedProducts.map((product, index) => {
                  const isInCart = items.some((item) => item.id === product.id.toString());
                  const wishlistId = `wishlist-${product.id}`;
                  const isInWishlist = wishlistItems.some((item) => item.id === wishlistId);

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className={`${cardWidth} flex-shrink-0`}
                    >
                      <Link
                        to={`/products/${product.slug}`}
                        className="block bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group/card"
                      >
                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                            />
                          ) : (
                            <img
                              src={DEFAULT_IMAGE}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className={`absolute top-2 right-2 flex flex-col gap-1.5 transition-opacity md:opacity-0 group-hover/card:opacity-100 ${isMobile ? 'opacity-100' : ''}`}>
                            <button
                              onClick={(e) => handleToggleWishlist(e, product)}
                              className={`p-2.5 rounded-full shadow-md transition-colors touch-manipulation ${
                                isInWishlist
                                  ? "bg-red-500 text-white"
                                  : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-500"
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isInWishlist ? "fill-white" : ""}`} />
                            </button>
                            <button
                              onClick={(e) => handleQuickAddToCart(e, product)}
                              className={`p-2.5 rounded-full shadow-md transition-colors touch-manipulation ${
                                isInCart
                                  ? "bg-green-500 text-white"
                                  : "bg-primary-600 text-white hover:bg-primary-700"
                              }`}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </div>
                          {product.mrp > product.sellingPrice && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                              {Math.round((1 - product.sellingPrice / product.mrp) * 100)}% OFF
                            </div>
                          )}
                        </div>
                        <div className="p-3 md:p-3">
                          <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 min-h-[40px]">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-primary-600">
                              ₹{product.sellingPrice || product.price}
                            </span>
                            {product.mrp > product.sellingPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹{product.mrp}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Navigation Arrows */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-0 top-[40%] -translate-y-1/2 -translate-x-2 bg-white border rounded-full p-2 shadow-md hover:bg-gray-50 transition-all z-10 disabled:opacity-50 opacity-0 group-hover:opacity-100"
                  disabled={totalSlides <= 1}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-0 top-[40%] -translate-y-1/2 translate-x-2 bg-white border rounded-full p-2 shadow-md hover:bg-gray-50 transition-all z-10 disabled:opacity-50 opacity-0 group-hover:opacity-100"
                  disabled={totalSlides <= 1}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}

            {/* Dot Indicators */}
            {totalSlides > 1 && (
              <div className="flex justify-center gap-1.5 md:gap-2 mt-4">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 md:h-2 rounded-full transition-all touch-manipulation ${
                      index === currentIndex
                        ? "bg-primary-600 w-6 md:w-6"
                        : "bg-gray-300 hover:bg-gray-400 w-2"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
