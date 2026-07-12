import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipe } from "@/hooks/useSwipe";

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  productCount?: number;
}

interface CategoryCarouselProps {
  categories: Category[];
  itemsPerPage?: number;
}

const DENTAL_IMAGES = [
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1583324113626-70df0f4dea8e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop",
];

function getCategoryImage(category: Category): string {
  if (category.image) return category.image;
  const imageIndex = Math.abs(category.id) % DENTAL_IMAGES.length;
  return DENTAL_IMAGES[imageIndex];
}

export default function CategoryCarousel({ categories, itemsPerPage = 6 }: CategoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = Math.ceil(categories.length / visibleCount);

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

  const displayedCategories = categories.slice(
    currentIndex * visibleCount,
    currentIndex * visibleCount + visibleCount
  );

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
  });

  if (categories.length === 0) return null;

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
          {displayedCategories.map((category, index) => {
            const imageUrl = getCategoryImage(category);

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex-shrink-0"
                style={{ width: `calc(${100 / visibleCount}% - ${(visibleCount - 1) * 16 / visibleCount}px)` }}
              >
                <Link
                  to={`/products?category=${category.slug}&categoryName=${encodeURIComponent(category.name)}`}
                  className="group/card block"
                >
                  <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 group-hover/card:shadow-lg group-hover/card:border-primary-200 group-hover/card:-translate-y-1">
                    <div className="aspect-square flex items-center justify-center p-4 bg-gray-50/50">
                      <img
                        src={imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover/card:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="px-3 pb-3 text-center border-t border-gray-100">
                      <h3 className="font-semibold text-sm text-gray-700 leading-tight line-clamp-2 mt-2 group-hover/card:text-primary-600 transition-colors">
                        {category.name}
                      </h3>
                      {category.productCount !== undefined && (
                        <p className="text-gray-400 text-xs mt-0.5">
                          {category.productCount} Products
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
