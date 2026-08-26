import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "frame-src 'self' https://www.youtube.com https://youtube.com",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' ws: http://localhost:* https:",
  "worker-src 'self' blob:",
  isProduction ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Editorials are authored as MDX under src/content and imported by the
  // [slug] route, so .mdx must be a recognised module extension.
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  // Don't advertise the framework via the X-Powered-By response header.
  poweredByHeader: false,
  turbopack: {
    // Pin the workspace root. Turbopack otherwise infers it and can land on
    // src/app, where next/package.json is not resolvable, failing the build.
    root: __dirname,
  },
  experimental: {
    cpus: 4,
    optimizePackageImports: ["lucide-react", "clsx", "tailwind-merge", "lru-cache", "framer-motion"],
    webVitalsAttribution: ["CLS", "LCP", "INP"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 390, 640, 750, 828, 1080, 1200, 1440],
    imageSizes: [48, 64, 96, 128, 160, 192, 256, 384],
    // Every quality a component actually asks for must be listed here or the
    // request is rejected at runtime. 40 is used by small preview strips, 80 & 90 by cards.
    qualities: [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90],
    // Source images (book covers, thumbnails) are stable, so keep optimized
    // variants cached for ~31 days to avoid re-running sharp on every miss.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Fonts and brand assets are content-stable binaries — cache immutably.
        source: "/:dir(fonts|assets)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Archive media/PDFs rarely change; cache a day, then serve stale while
        // revalidating so repeat visits and downloads stay fast.
        source: "/content/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
          { key: "Accept-Ranges", value: "bytes" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/other", destination: "/written", permanent: true },
      { source: "/content/audio/:path*", destination: "/content/audios/:path*", permanent: true },
      { source: "/content/video/:path*", destination: "/content/videos/:path*", permanent: true },
      { source: "/content/books/:path*", destination: "/content/written/books/:path*", permanent: true },
      { source: "/content/newsletter/:path*", destination: "/content/written/newsletters/:path*", permanent: true },
      {
        source: "/content/appendix/pdfs/1982/1981_Appendices.pdf",
        destination: "/content/quran/organized_appendices/1981/appendices.pdf",
        permanent: true,
      },
      {
        source: "/content/appendix/pdfs/appendix_:number(\\d+).pdf",
        destination: "/content/quran/organized_appendices/1992/appendix-:number.pdf",
        permanent: true,
      },
      {
        source: "/content/appendix/pdfs/:document(introduction|proclamation).pdf",
        destination: "/content/quran/organized_appendices/1992/:document.pdf",
        permanent: true,
      },
      // Scripture route migration: /quran/* → /scripture/*
      { source: "/quran", destination: "/scripture/quran", permanent: true },
      { source: "/quran/old-testament", destination: "/scripture/old-testament", permanent: true },
      { source: "/quran/new-testament", destination: "/scripture/new-testament", permanent: true },
      { source: "/quran/appendices", destination: "/scripture/quran/appendices", permanent: true },
      { source: "/quran/:chapter(\\d+)", destination: "/scripture/quran/:chapter", permanent: true },
      { source: "/quran/bible/:book", destination: "/scripture/bible/:book", permanent: true },
      { source: "/scriptures/:path*", destination: "/scripture/:path*", permanent: true },
    ];
  },
};

// Turbopack cannot receive JavaScript functions, so plugins are named as
// strings and resolved on the Rust side.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
