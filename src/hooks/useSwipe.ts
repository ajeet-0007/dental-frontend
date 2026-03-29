import { useRef, useCallback } from "react";

interface UseSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: UseSwipeOptions) {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    touchEndX.current = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const diffX = Math.abs(touchEndX.current - touchStartX.current);
    const diffY = Math.abs(touchCurrentY - touchStartY.current);
    
    if (diffY > diffX) {
      isDragging.current = false;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
    
    isDragging.current = false;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
