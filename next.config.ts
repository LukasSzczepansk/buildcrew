import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const canonicalOrigin = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL_EN || "https://buildcreww.pl").replace(/\/$/, "");
const canonicalHost = new URL(canonicalOrigin).hostname.toLowerCase();
const knownHosts = ["buildcreww.pl", "www.buildcreww.pl", "buildcreww.com", "www.buildcreww.com"];

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Canonical English aliases for old public Polish URLs.
      { source: "/projekty", destination: "/explore/projects", permanent: true },
      { source: "/hackathony", destination: "/explore/hackathons", permanent: true },
      { source: "/hackathony/:path*", destination: "/explore/hackathons/:path*", permanent: true },
      { source: "/regulamin", destination: "/terms", permanent: true },
      { source: "/polityka-prywatnosci", destination: "/privacy", permanent: true },
      { source: "/ideas", destination: "/projects", permanent: true },
      { source: "/ideas/:path*", destination: "/projects", permanent: true },

      // Keep one canonical domain for crawlers and social previews. The value is
      // controlled by NEXT_PUBLIC_APP_URL on Vercel; buildcreww.pl is the safe fallback.
      ...knownHosts
        .filter((host) => host !== canonicalHost)
        .map((host) => ({
          source: "/:path*",
          has: [{ type: "host" as const, value: host }],
          destination: `${canonicalOrigin}/:path*`,
          permanent: true,
        })),
    ];
  },
};

export default nextConfig;
