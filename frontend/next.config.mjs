/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/:path*', // Proxy to Backend container
      },
      {
        source: '/static/:path*',
        destination: 'http://backend:8000/static/:path*', // Proxy static files (audio)
      },
    ];
  },
};

export default nextConfig;
