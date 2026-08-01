export const SITE_URL = (import.meta.env.VITE_SITE_URL as string) || "https://www.dentzoo.com";

export const SITE_NAME = "Dentzoo";

export const DEFAULT_TITLE = `${SITE_NAME} - Dental Products Online`;

export const DEFAULT_DESCRIPTION =
  "Dentzoo is an online dental store for dental equipment, instruments, materials, and consumables. Shop premium dental products at the best prices.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const absoluteUrl = (path: string): string => {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
