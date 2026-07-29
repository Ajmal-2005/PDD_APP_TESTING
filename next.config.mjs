/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  headers: async () => [
    {
      // Weight shards carry a content hash in the filename, so a new model means new
      // filenames. Safe to cache for a year.
      source: '/model/:shard(group\\d+-shard\\d+of\\d+\\.bin)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      /*
       * model.json and labels.json have STABLE names and are replaced in place when the
       * model is swapped. Caching them immutably meant a browser that had seen the old
       * pair would keep it for a year — and because labels are positional, a new model
       * served with cached old labels mislabels every prediction silently, with no error
       * anywhere. Revalidate these two on every load; they are small.
       */
      source: '/model/:file(model\\.json|labels\\.json)',
      headers: [{ key: 'Cache-Control', value: 'no-cache' }],
    },
  ],
  experimental: {
    // Tree-shake barrel re-exports so we only ship the icons / modules that
    // are actually imported rather than every icon in the library.
    optimizePackageImports: ['lucide-react'],
  },
};
export default nextConfig;
