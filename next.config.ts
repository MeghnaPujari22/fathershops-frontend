import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sgp1.digitaloceanspaces.com",
      },
    ],
  },
  async rewrites() {
    const backendUrl = (
      process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api"
    ).replace(/\/+$/, "");

    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
