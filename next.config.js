/** @type {import('next').NextConfig} */
const { version } = require('./frontend/package.json');

const nextConfig = {
  // Output standalone build — reduces bundle size on Render
  output: 'standalone',

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'CostoBot',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || version,
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

  // Security headers — COOP must be same-origin-allow-popups so Firebase Auth
  // popup can use window.closed to detect when the sign-in window closes.
  // same-origin-allow-popups retains cross-origin popup references that opt
  // out of COOP (unsafe-none), which covers the Firebase/Google auth domain.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
