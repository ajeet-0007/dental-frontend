import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Brand {
  id: number;
  name: string;
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
      if (width < 640) setVisibleCount(2);
      else if (width < 768) setVisibleCount(3);
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

  if (brands.length === 0) return null;

  const displayedBrands = brands.slice(
    currentIndex * visibleCount,
    currentIndex * visibleCount + visibleCount
  );

  return (
    <div className="relative group">
      <div ref={containerRef} className="overflow-hidden px-2">
        <motion.div
          className="flex gap-4"
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
                className="flex-shrink-0 w-[calc((100%-80px)/6)] min-w-[160px]"
              >
                <Link
                  to={`/products?brandId=${brand.id}`}
                  className="group/card block"
                >
                  <div className={`relative aspect-[4/3] rounded-xl overflow-hidden shadow-md group-hover/card:shadow-xl transition-all duration-300 group-hover/card:-translate-y-1 bg-gradient-to-br ${colorClass}`}>
                    <div className="absolute inset-0 bg-white/10" />
                    
                    <div className="absolute inset-0 flex items-center justify-center p-3">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="max-h-full max-w-full object-contain bg-white rounded-lg p-2 shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              const initial = document.createElement("span");
                              initial.className = "text-2xl font-bold text-white";
                              initial.textContent = getBrandInitial(brand.name);
                              parent.appendChild(initial);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-3xl font-bold text-white drop-shadow-md">
                          {getBrandInitial(brand.name)}
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 drop-shadow-md">
                        {brand.name}
                      </h3>
                      {brand.productCount !== undefined && (
                        <p className="text-white/80 text-xs mt-1">
                          {brand.productCount} Products
                        </p>
                      )}
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
            className="absolute left-2 top-[40%] -translate-y-1/2 bg-white border rounded-full p-2 shadow-md hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all z-10 disabled:opacity-50"
            disabled={totalSlides <= 1}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-[40%] -translate-y-1/2 bg-white border rounded-full p-2 shadow-md hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all z-10 disabled:opacity-50"
            disabled={totalSlides <= 1}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </>
      )}

      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-primary-600 w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
