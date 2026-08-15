import { Helmet } from "react-helmet-async";
import {
  SITE_NAME,
  SITE_URL,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
} from "./seoConstants";
import { buildTitle } from "./seoHelpers";

interface SeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
  jsonLd?: object | object[];
}

function currentPath(): string {
  if (typeof window === "undefined") return "/";
  const { pathname } = window.location;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

export default function Seo({
  title,
  description,
  canonical,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}: SeoProps) {
  const pageTitle = title ? buildTitle(title) : DEFAULT_TITLE;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const pageImage = image || DEFAULT_OG_IMAGE;
  const canonicalUrl = canonical ? absoluteUrl(canonical) : `${SITE_URL}${currentPath()}`;
  const robots = noindex ? "noindex, nofollow" : undefined;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {robots ? (
        <meta name="robots" content={robots} />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:type" content={type} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />

      {jsonLd ? (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      ) : null}
    </Helmet>
  );
}
