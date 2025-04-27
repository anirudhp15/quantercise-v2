import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ["resekcyogqnrgrhqqczf.supabase.co"],
  },
  // Configure server middleware to handle cookies
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "quantercise.vercel.app"],
    },
  },
};

export default nextConfig;
