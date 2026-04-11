import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipe } from "@/hooks/useSwipe";

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
}

interface HeroCarouselProps {
  banners: Banner[];
}

const getImageAspectRatio = (src: string): Promise<number> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      resolve(ratio);
    };
    img.onerror = () => {
      resolve(16 / 9);
    };
    img.src = src;
  });
};

export default function HeroCarousel({ banners }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [aspectRatios, setAspectRatios] = useState<Record<number, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeBanners = banners.filter((b) => b.isActive);
  const totalSlides = activeBanners.length;

  useEffect(() => {
    const loadAspectRatios = async () => {
      const ratios: Record<number, number> = {};
      for (const banner of activeBanners) {
        ratios[banner.id] = await getImageAspectRatio(banner.image);
      }
      setAspectRatios(ratios);
    };
    loadAspectRatios();
  }, [activeBanners]);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
  });

  if (totalSlides === 0) return null;

  const currentBanner = activeBanners[currentIndex];

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl shadow-lg group touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full"
          style={{
            aspectRatio: aspectRatios[currentBanner.id] || "auto",
          }}
        >
          <Link
            to={currentBanner.link || "/products"}
            className="block w-full h-full"
          >
            <img
              src={currentBanner.image}
              alt={currentBanner.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&h=500&fit=crop";
              }}
            />
          </Link>
        </motion.div>
      </AnimatePresence>

      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border rounded-full p-1.5 md:p-2 shadow-md transition-all z-10 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border rounded-full p-1.5 md:p-2 shadow-md transition-all z-10 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-800" />
          </button>
        </>
      )}

      {totalSlides > 1 && (
        <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 md:h-2 rounded-full transition-all touch-manipulation ${
                index === currentIndex
                  ? "bg-white w-4 md:w-6"
                  : "bg-white/50 hover:bg-white/75 w-1.5 md:w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
