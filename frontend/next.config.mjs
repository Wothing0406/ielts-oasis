/** @type {import('next').NextConfig} */
const backendTarget = process.env.BACKEND_URL || (process.env.DOCKER_ENV ? 'http://backend:8000' : 'http://127.0.0.1:8000');

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendTarget}/api/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${backendTarget}/static/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/',
        permanent: true,
      },
      {
        source: '/auth/register',
        destination: '/',
        permanent: true,
      },
    ];
  },
  experimental: {
    proxyTimeout: 120000,
  },
};

export default nextConfig;
