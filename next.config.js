/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build — reduces bundle size on Render
  output: 'standalone',

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'CostoBot',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
  },

  // Redirect API calls to backend in production
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/version',
        destination: `${backendUrl}/api/version`,
      },
    ];
  },
};

module.exports = nextConfig;
