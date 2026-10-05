import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl.replace(/\/+$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
