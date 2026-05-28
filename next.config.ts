import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard/cultural-circles',
        destination: '/dashboard/communities',
        permanent: true,
      },
      {
        source: '/dashboard/cultural-circles/:id',
        destination: '/dashboard/communities/:id',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
