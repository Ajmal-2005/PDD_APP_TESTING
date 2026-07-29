/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
      ],
    },
    {
      // Weight shards carry a content hash in the filename, so a new model means new
      // filenames. Safe to cache for a year.
      source: '/model/:shard(group\\d+-shard\\d+of\\d+\\.bin)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/model/:file(model\\.json|labels\\.json)',
      headers: [{ key: 'Cache-Control', value: 'no-cache' }],
    },
  ],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};
export default nextConfig;
