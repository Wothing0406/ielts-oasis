/** @type {import('next').NextConfig} */
const nextConfig = {
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
  experimental: {
    proxyTimeout: 120000,
  },
};

export default nextConfig;
