import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Papaki/Plesk shared hosting has a low process ceiling. Keep production
  // builds on one worker; local development remains otherwise unchanged.
  experimental: {
    cpus: 1,
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      ],
    }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "acadimies.gr" },
      { protocol: "https", hostname: "www.acadimies.gr" },
    ],
  },
};

export default nextConfig;
