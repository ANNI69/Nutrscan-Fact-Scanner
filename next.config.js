/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "jxz4xw9z-3000.inc1.devtunnels.ms", // your dev tunnel hostname
      ],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { hostname: "images.openfoodfacts.org" },
      { hostname: "api.dicebear.com" },
    ],
  },
};

module.exports = nextConfig;
