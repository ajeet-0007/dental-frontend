const IMAGEKIT_HOSTS = [
  "ik.imagekit.io",
];

export interface ImageOptions {
  w?: number;
  q?: number;
}

function isImageKitUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return IMAGEKIT_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export function optimizeImage(url: string, options: ImageOptions = {}): string {
  if (!url || !isImageKitUrl(url) || url.includes("tr=")) return url;

  const { w, q = 75 } = options;
  const parts = ["q-" + q];
  if (w) parts.unshift("w-" + w);

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}tr=${parts.join(",")},f-auto`;
}

export function responsiveSrcSet(
  url: string,
  widths: number[] = [160, 320, 640, 960],
): string {
  if (!url || !isImageKitUrl(url) || url.includes("tr=")) return url;

  return widths
    .map((w) => `${optimizeImage(url, { w, q: 75 })} ${w}w`)
    .join(", ");
}
