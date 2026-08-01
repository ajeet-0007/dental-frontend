import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

try {
  process.loadEnvFile(".env.production");
} catch {
  try {
    process.loadEnvFile(".env");
  } catch {
    // no env files available - use defaults
  }
}

const API_URL = (process.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
const API_BASE = `${API_URL}/api`;
const SITE_URL = (process.env.VITE_SITE_URL || "https://dentzoo.com").replace(/\/$/, "");

const today = new Date().toISOString().slice(0, 10);

function xmlEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function encodePathSegment(value = "") {
  return String(value)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${path} -> ${response.status}`);
  return response.json();
}

function urlSet(entries, changefreq, priority) {
  return entries
    .map(
      ({ loc, lastmod }) => `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${xmlEscape(lastmod || today)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join("\n");
}

async function main() {
  const staticPages = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/products`, changefreq: "daily", priority: "0.8" },
    { loc: `${SITE_URL}/categories`, changefreq: "weekly", priority: "0.7" },
    { loc: `${SITE_URL}/departments`, changefreq: "weekly", priority: "0.7" },
    { loc: `${SITE_URL}/brands`, changefreq: "weekly", priority: "0.7" },
    { loc: `${SITE_URL}/help`, changefreq: "monthly", priority: "0.4" },
    { loc: `${SITE_URL}/gallery`, changefreq: "weekly", priority: "0.4" },
  ];

  let products = [];
  let categories = [];
  let departments = [];
  let brands = [];

  try {
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      const data = await fetchJson(`/products?limit=100&page=${page}&sortBy=newest`);
      const list = Array.isArray(data.products) ? data.products : [];
      products = products.concat(list);
      totalPages = Number(data.totalPages || 1);
      page += 1;
    }

    const categoriesData = await fetchJson("/categories");
    categories = Array.isArray(categoriesData.data) ? categoriesData.data : Array.isArray(categoriesData) ? categoriesData : [];

    const departmentsData = await fetchJson("/departments");
    departments = Array.isArray(departmentsData.data) ? departmentsData.data : departmentsData;

    const brandsData = await fetchJson("/brands");
    brands = Array.isArray(brandsData.data) ? brandsData.data : brandsData;
  } catch (error) {
    console.warn(
      `[generate-sitemap] Could not fetch catalog data from ${API_BASE}: ${error.message}. Generating sitemap with static pages only.`
    );
  }

  const lastmodOf = (item) =>
    (item.updatedAt || item.createdAt || "").toString().slice(0, 10) || today;

  const staticEntryLines = staticPages
    .map(
      ({ loc, changefreq, priority }) => `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join("\n");

  const dynamicEntries = products
    .map((p) => ({ loc: `${SITE_URL}/products/${encodePathSegment(p.slug)}`, lastmod: lastmodOf(p) }))
    .concat(
      categories.map((c) => ({ loc: `${SITE_URL}/categories/${encodePathSegment(c.slug)}`, lastmod: lastmodOf(c) })),
      departments.map((d) => ({ loc: `${SITE_URL}/departments/${encodePathSegment(d.slug)}`, lastmod: lastmodOf(d) })),
      brands.map((b) => ({ loc: `${SITE_URL}/brands/${encodePathSegment(b.slug)}`, lastmod: lastmodOf(b) }))
    );

  const seen = new Set();
  const uniqueDynamicEntries = dynamicEntries.filter((entry) => {
    if (seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });

  const dynamicEntryLines = urlSet(uniqueDynamicEntries, "weekly", "0.6");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntryLines}
${dynamicEntryLines}
</urlset>
`;

  const outputPath = resolve("public/sitemap.xml");
  writeFileSync(outputPath, sitemap, "utf8");
  console.log(
    `[generate-sitemap] Wrote ${outputPath} (${products.length} products, ${categories.length} categories, ${departments.length} departments, ${brands.length} brands)`
  );
}

main().catch((error) => {
  console.error(`[generate-sitemap] Failed: ${error.message}`);
  process.exit(1);
});
