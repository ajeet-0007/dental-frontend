import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

const STORAGE_KEY = 'dentzoo-login-popup-seen';

/**
 * Kept above the prerender script's SETTLE_DELAY_MS (1200ms in
 * scripts/prerender.mjs) so the popup markup is never captured into
 * dist/index.html, which would flash the modal on first paint.
 */
const OPEN_DELAY_MS = 2500;

export function useLoginPopup() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isOpen, setIsOpen] = useState(false);

  const markSeen = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // storage unavailable (private mode) — popup simply reappears next reload
    }
  }, []);

  const close = useCallback(() => {
    markSeen();
    setIsOpen(false);
  }, [markSeen]);

  useEffect(() => {
    if (isAuthenticated) {
      markSeen();
      setIsOpen(false);
      return;
    }

    let hasSeen = false;
    try {
      hasSeen = sessionStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      hasSeen = false;
    }
    if (hasSeen) return;

    const timer = setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated, markSeen]);

  return { isOpen, close, markSeen };
}
