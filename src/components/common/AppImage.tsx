import { useState } from "react";
import { optimizeImage, responsiveSrcSet } from "@/utils/image";

interface AppImageProps {
  src: string;
  alt: string;
  className?: string;
  widths?: number[];
  sizes?: string;
  priority?: boolean;
  responsive?: boolean;
  fallbackSrc?: string;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export default function AppImage({
  src,
  alt,
  className,
  widths,
  sizes,
  priority = false,
  responsive = true,
  fallbackSrc,
  onClick,
  onError,
}: AppImageProps) {
  const [errored, setErrored] = useState(false);
  const currentSrc = errored && fallbackSrc ? fallbackSrc : src;

  return (
    <img
      src={responsive ? optimizeImage(currentSrc, { w: 640 }) : optimizeImage(currentSrc, { w: 160 })}
      srcSet={
        responsive
          ? responsiveSrcSet(currentSrc, widths)
          : undefined
      }
      sizes={sizes}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onClick={onClick}
      onError={(e) => {
        if (!errored && fallbackSrc) {
          setErrored(true);
          return;
        }
        onError?.(e);
      }}
    />
  );
}
