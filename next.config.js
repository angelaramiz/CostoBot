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

  // COOP: unsafe-none — requerido para Firebase Auth signInWithPopup en móvil.
  // Google (accounts.google.com) usa COOP: same-origin, lo que rompe window.closed
  // con same-origin-allow-popups. unsafe-none permite la comunicación postMessage
  // del popup sin restricciones de ventana cruzada.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
