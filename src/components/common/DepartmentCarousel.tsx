import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipe } from "@/hooks/useSwipe";

interface Department {
  id: number;
  name: string;
  slug: string;
  image?: string;
  productCount?: number;
}

interface DepartmentCarouselProps {
  departments: Department[];
  itemsPerPage?: number;
}

const DEPARTMENT_COLORS = [
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
];

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1583324113626-70df0f4dea8e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=400&h=300&fit=crop",
];

function getDepartmentImage(department: Department): string {
  if (department.image) return department.image;
  const imageIndex = Math.abs(department.id - 1) % DEFAULT_IMAGES.length;
  return DEFAULT_IMAGES[imageIndex];
}

export default function DepartmentCarousel({ departments, itemsPerPage = 6 }: DepartmentCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = Math.ceil(departments.length / visibleCount);

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

  const displayedDepartments = departments.slice(
    currentIndex * visibleCount,
    currentIndex * visibleCount + visibleCount
  );

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
  });

  if (departments.length === 0) return null;

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
          {displayedDepartments.map((department, index) => {
            const colorIndex = Math.abs(department.id - 1) % DEPARTMENT_COLORS.length;
            const colorClass = DEPARTMENT_COLORS[colorIndex];
            const imageUrl = getDepartmentImage(department);

            return (
              <motion.div
                key={department.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="flex-shrink-0 w-[calc(50%-6px)] md:w-[calc((100%-80px)/4)] lg:w-[calc((100%-80px)/6)]"
              >
                <Link
                  to={`/products?department=${department.slug}`}
                  className="group/card block"
                >
                  <div className={`relative aspect-[4/3] rounded-xl overflow-hidden shadow-md group-hover/card:shadow-xl transition-all duration-300 group-hover/card:-translate-y-1 bg-gradient-to-br ${colorClass}`}>
                    <img
                      src={imageUrl}
                      alt={department.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
                      <h3 className="text-white font-semibold text-xs md:text-sm leading-tight line-clamp-2 drop-shadow-md">
                        {department.name}
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
