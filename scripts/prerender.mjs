import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { spawn, execSync } from "node:child_process";
import { chromium } from "playwright";

const PREVIEW_PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PREVIEW_PORT}`;
const CONCURRENCY = 5;
const SETTLE_DELAY_MS = 1200;

function log(message) {
  console.log(`[prerender] ${message}`);
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Preview server did not become ready at ${url}`);
}

async function ensureChromium() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    if (process.env.VERCEL) {
      log("Skipping Chromium install on Vercel");
      throw error;
    }
    log("Chromium not found, attempting to install...");
  }
  try {
    execSync("npx playwright install chromium", { stdio: "inherit" });
  } catch (error) {
    log(`Chromium install failed: ${error.message}`);
    throw error;
  }
  return await chromium.launch({ headless: true });
}

function writeHtml(pathname, html) {
  const decoded = pathname
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/");
  if (decoded === "/") {
    writeFileSync(resolve("dist/index.html"), html);
    return;
  }
  const filePath = resolve("dist", `${decoded.slice(1)}.html`);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, html);
}

async function renderPage(page, pathname, baseHtml) {
  await page.goto(`${BASE_URL}${pathname}`, { waitUntil: "load", timeout: 45000 });
  await page
    .waitForFunction(() => {
      const el = document.querySelector("#root");
      return el && el.children.length > 0 && typeof window.__DENTZOO_SNAPSHOT__ === "function";
    }, { timeout: 20000 })
    .catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(SETTLE_DELAY_MS);

  const dehydrated = await page.evaluate(() => {
    try {
      return typeof window.__DENTZOO_SNAPSHOT__ === "function"
        ? window.__DENTZOO_SNAPSHOT__()
        : null;
    } catch {
      return null;
    }
  });

  let html = await page.content();
  if (html.length < 1000) {
    log(`skipping ${pathname}: rendered output too small (${html.length} bytes)`);
    return false;
  }

  const hasQueries = dehydrated && Array.isArray(dehydrated.queries) && dehydrated.queries.length > 0;
  if (hasQueries) {
    const payload = JSON.stringify(dehydrated).replace(/</g, "\\u003c");
    html = html.replace("</head>", `<script>window.__DENTZOO_DEHYDRATED__=${payload}</script></head>`);
  }

  writeHtml(pathname, html);
  const queries = hasQueries ? dehydrated.queries.length : 0;
  log(`rendered ${pathname} (${html.length} bytes, ${queries} cached queries)`);
  return true;
}

async function main() {
  const sitemapPath = resolve("public/sitemap.xml");
  const sitemap = readFileSync(sitemapPath, "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const paths = locs
    .map((loc) => {
      try {
        return new URL(loc).pathname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  log(`${paths.length} routes found in sitemap`);

  const baseHtml = readFileSync(resolve("dist/index.html"), "utf8");

  const server = spawn(
    process.execPath,
    [resolve("node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", String(PREVIEW_PORT), "--strictPort"],
    { stdio: "ignore" }
  );

  try {
    await waitForServer(`${BASE_URL}/`);
    log("preview server ready");
  } catch (error) {
    log(`Preview server failed to start: ${error.message}`);
    process.exit(1);
  }

  let browser;
  try {
    browser = await ensureChromium();
  } catch {
    log("Chromium unavailable. Writing SPA shell fallback for all routes.");
    for (const pathname of paths) {
      writeHtml(pathname, baseHtml);
    }
    log(`done: ${paths.length}/${paths.length} routes written as SPA shell (no browser)`);
    server.kill();
    process.exit(0);
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (compatible; DentzooPrerender/1.0; +https://www.dentzoo.com)",
  });

  let nextIndex = 0;
  let succeeded = 0;
  const failures = [];

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= paths.length) break;
      const pathname = paths[index];
      const page = await context.newPage();
      try {
        const ok = await renderPage(page, pathname, baseHtml);
        if (ok) succeeded += 1;
        else failures.push(pathname);
      } catch (error) {
        failures.push(pathname);
        log(`failed ${pathname}: ${error.message}`);
        writeHtml(pathname, baseHtml);
      } finally {
        await page.close();
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await browser.close();
  server.kill();

  log(`done: ${succeeded}/${paths.length} pages prerendered${failures.length ? `, ${failures.length} fell back to SPA shell` : ""}`);
}

main().catch((error) => {
  console.error(`[prerender] Failed: ${error.message}`);
  process.exit(1);
});
