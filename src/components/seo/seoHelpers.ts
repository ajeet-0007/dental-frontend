import { SITE_NAME, SITE_URL, absoluteUrl } from "./seoConstants";

export function stripHtml(html: string): string {
  return html
    ? String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : "";
}

export function truncateDescription(text: string, max = 155): string {
  const clean = stripHtml(text || "");
  if (clean.length <= max) return clean;
  const truncated = clean.slice(0, max);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : max)}...`;
}

export function buildTitle(name: string): string {
  return name?.includes(SITE_NAME) ? name : `${name} | ${SITE_NAME}`;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/DentZoo_Logo.svg"),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildProductJsonLd(product: any, reviewStats?: any) {
  const price =
    typeof product.sellingPrice === "number" ? product.sellingPrice : Number(product.sellingPrice || 0);
  const images = Array.isArray(product.images)
    ? product.images.map((img: string) => absoluteUrl(img))
    : product.images
      ? [absoluteUrl(product.images)]
      : [];

  const offers: any = {
    "@type": "Offer",
    price,
    priceCurrency: "INR",
    availability: product.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    url: absoluteUrl(`/products/${product.slug}`),
  };

  const productJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description: product.shortDescription || product.description,
    sku: product.sku || String(product.id),
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand.name || product.brand,
        }
      : undefined,
    offers,
  };

  if (reviewStats && Number(reviewStats.totalReviews) > 0) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(reviewStats.averageRating).toFixed(1),
      reviewCount: reviewStats.totalReviews,
    };
  }

  return productJsonLd;
}

export function buildItemListJsonLd(products: any[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: products?.length || 0,
    itemListElement: (products || []).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/products/${product.slug}`),
      name: product.name,
    })),
  };
}
