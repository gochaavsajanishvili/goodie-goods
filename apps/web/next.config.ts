import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.ambebi.ge' },
      { protocol: 'https', hostname: 'static.ambebi.ge' },
      { protocol: 'https', hostname: '*.ambebi.ge' },
    ],
  },
};

export default nextConfig;
