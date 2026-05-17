const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  // Estrategia de caché:
  //   - Estáticos (JS, CSS, fuentes, imágenes) → CacheFirst
  //   - Páginas → NetworkFirst (red, cae a caché si offline)
  //   - API → StaleWhileRevalidate (respuesta inmediata desde caché,
  //     actualiza en segundo plano). Así la app carga datos al instante
  //     incluso antes del login, y sigue funcionando offline.
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      // Navegaciones: red primero, cae a caché si no hay red.
      urlPattern: ({ request, url }) =>
        request.mode === 'navigate' && !url.pathname.startsWith('/api'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
    {
      // API (bins, stats, me, leaderboard, reports): responde desde
      // caché al instante y refresca en segundo plano.
      urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.externals.push('better-sqlite3');
    }
    // La BD SQLite vive en data/ ; sus ficheros WAL/SHM cambian en cada
    // consulta y dispararían un bucle infinito de recompilación de Next.
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: ['**/node_modules/**', '**/.git/**', '**/data/**'],
      };
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
