import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Original Supabase bucket
      {
        protocol: 'https',
        hostname: 'phhczohqidgrvcmszets.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Supabase bucket used for auth panel + community images
      {
        protocol: 'https',
        hostname: 'qsvmgzdaashfsavmfjuz.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Pravatar — reliable real-looking demo face photos
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
};

export default nextConfig;
