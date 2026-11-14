import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      "www.inglaterrapremium.com",
      "inglaterrapremium.com.br",
      "www.inglaterrapremium.com.br",
    ].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://inglaterrapremium.com/:path*",
      permanent: true,
    }));
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bogqsbvhkujfhpgaievc.supabase.co",
        pathname: "/storage/v1/object/public/post-images/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "imob.valuegaia.com.br",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
