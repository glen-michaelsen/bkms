import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      // The consent screen must never be framed: an overlay could trick users into approving.
      source: "/oauth/authorize",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    }]
  },
};

export default nextConfig;
