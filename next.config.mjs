/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Production build optimizations ───────────────────────────────────────
  // Don't leak the framework in headers.
  poweredByHeader: false,
  // Gzip handled by Vercel's edge; keep on for self-hosted fallback too.
  compress: true,
  // Source maps for the browser bundle are a info-leak + size cost in prod.
  productionBrowserSourceMaps: false,

  experimental: {
    typedRoutes: false,
    // Trim what ships to the client for these heavy libs.
    optimizePackageImports: ["lucide-react", "@tanstack/react-query"],
  },

  // Remote images (none yet) — declare patterns here when product art lands.
  images: {
    remotePatterns: [],
  },

  // The API base + WS URL are the only runtime-public config. They're read
  // through src/lib/env.ts, never hardcoded. Listing them here documents the
  // contract and lets `next build` fail fast in CI if they're referenced
  // before being defined.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },

  // Development-only API proxy.
  //
  // `next dev` on localhost is not in the API's CORS allowlist, and it must not
  // be: that allowlist protects a credentialed production endpoint, and widening
  // it so a developer can point a local UI at prod would trade a real security
  // boundary for convenience. Proxying through the dev server instead makes the
  // browser see a same-origin request, so no CORS is involved at all.
  //
  // Opt-in via DEV_API_PROXY_TARGET, never on by default — an accidental proxy
  // to prod is how local experiments reach real data. Set it in .env.local
  // alongside NEXT_PUBLIC_API_URL=http://localhost:3000.
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    const target = process.env.DEV_API_PROXY_TARGET;
    if (!target) return [];
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
