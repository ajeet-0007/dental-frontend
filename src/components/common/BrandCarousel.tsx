import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipe } from "@/hooks/useSwipe";

interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  productCount?: number;
}

interface BrandCarouselProps {
  brands: Brand[];
  itemsPerPage?: number;
}

function getBrandInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

const INITIAL_COLORS = [
  "from-blue-500 to-blue-600",
  "from-green-500 to-green-600",
  "from-purple-500 to-purple-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-red-500 to-red-600",
  "from-indigo-500 to-indigo-600",
];

export default function BrandCarousel({ brands, itemsPerPage = 6 }: BrandCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = Math.ceil(brands.length / visibleCount);

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 640) setVisibleCount(3);
      else if (width < 768) setVisibleCount(3);
      else if (width < 1024) setVisibleCount(4);
      else setVisibleCount(6);
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [itemsPerPage]);

  const nextSlide = () => {
    if (currentIndex < totalSlides - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(totalSlides - 1);
    }
  };

  const displayedBrands = brands.slice(
    currentIndex * visibleCount,
    currentIndex * visibleCount + visibleCount
  );

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
  });

  if (brands.length === 0) return null;

  return (
    <div className="relative group touch-pan-y">
      <div
        ref={containerRef}
        className="overflow-hidden -mx-4 px-4 md:mx-0 md:px-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <motion.div
          className="flex gap-3 md:gap-4"
          initial={false}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {displayedBrands.map((brand, index) => {
            const colorIndex = Math.abs(brand.id - 1) % INITIAL_COLORS.length;
            const gradientClass = INITIAL_COLORS[colorIndex];

            return (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex-shrink-0"
                style={{ width: `calc(${100 / visibleCount}% - ${(visibleCount - 1) * 16 / visibleCount}px)` }}
              >
                <Link
                  to={`/products?brand=${brand.slug}`}
                  className="group/card block"
                >
                  <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 group-hover/card:shadow-lg group-hover/card:border-primary-200 group-hover/card:-translate-y-1">
                    <div className="aspect-square flex items-center justify-center p-4 bg-gray-50/50">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover/card:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md`}>
                          <span className="text-2xl font-bold text-white">
                            {getBrandInitial(brand.name)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="px-3 pb-3 text-center border-t border-gray-100">
                      <h3 className="font-semibold text-sm text-gray-700 leading-tight line-clamp-2 mt-2 group-hover/card:text-primary-600 transition-colors">
                        {brand.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full p-2.5 shadow-md hover:bg-white hover:shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full p-2.5 shadow-md hover:bg-white hover:shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </>
      )}
    </div>
  );
}
