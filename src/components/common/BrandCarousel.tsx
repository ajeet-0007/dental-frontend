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

const BRAND_COLORS = [
  "from-blue-500 to-blue-600",
  "from-green-500 to-green-600",
  "from-purple-500 to-purple-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-red-500 to-red-600",
  "from-indigo-500 to-indigo-600",
  "from-cyan-500 to-cyan-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-violet-500 to-violet-600",
];

function getBrandInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function BrandCarousel({ brands, itemsPerPage = 6 }: BrandCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = Math.ceil(brands.length / visibleCount);

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 640) setVisibleCount(4);
      else if (width < 768) setVisibleCount(4);
      else if (width < 1024) setVisibleCount(4);
      else if (width < 1280) setVisibleCount(5);
      else setVisibleCount(itemsPerPage);
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [itemsPerPage]);

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)));
  };

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
            const colorIndex = Math.abs(brand.id - 1) % BRAND_COLORS.length;
            const colorClass = BRAND_COLORS[colorIndex];

            return (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="flex-shrink-0 w-[calc(25%-9px)] md:w-[calc((100%-80px)/4)] lg:w-[calc((100%-80px)/6)]"
              >
                <Link
                  to={`/products?brand=${brand.slug}`}
                  className="group/card block"
                >
                  <div className={`relative aspect-[4/3] rounded-xl overflow-hidden shadow-md group-hover/card:shadow-xl transition-all duration-300 group-hover/card:-translate-y-1 bg-gradient-to-br ${colorClass}`}>
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-full h-full object-contain p-2 md:p-3 bg-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white">
                        <span className="text-2xl md:text-3xl font-bold text-gray-600">
                          {getBrandInitial(brand.name)}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
                      <h3 className="text-white font-semibold text-xs md:text-sm leading-tight line-clamp-2 drop-shadow-md">
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
            className="absolute left-2 top-[40%] -translate-y-1/2 bg-white border rounded-full p-2 shadow-md hover:bg-gray-50 transition-all z-10 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
            disabled={totalSlides <= 1}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-[40%] -translate-y-1/2 bg-white border rounded-full p-2 shadow-md hover:bg-gray-50 transition-all z-10 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
            disabled={totalSlides <= 1}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </>
      )}

      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4 md:mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all touch-manipulation ${
                index === currentIndex
                  ? "bg-primary-600 w-6"
                  : "bg-gray-300 hover:bg-gray-400 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
