import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      // {
      //   protocol: "https",
      //   hostname: "cdn11.bigcommerce.com",
      //   port: "",
      // },
      {
        protocol: "https",
        hostname: "*", // Allow images from all domains
      },
      {
        protocol: "http",
        hostname: "*", // Allow images from all domains
      },
    ],
  },
};

export default nextConfig;
