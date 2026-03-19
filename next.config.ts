import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "r2.saheljeddah.com",
      },
    ],
  },
};

export default nextConfig;
