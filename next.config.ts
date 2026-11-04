import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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
      {
        source: '/admin/cultural-circles',
        destination: '/admin/communities',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
