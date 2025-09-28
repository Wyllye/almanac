import { defineConfig, loadEnv } from 'vite';

// This configuration is scoped to the almanac-front directory. When building
// via Vite (e.g. during a Vercel deployment), it ensures that assets are
// referenced from the root of the deployed site (base: '/'). Without this
// file, Vite falls back to its defaults and may pick up a different
// configuration file in the parent directory, which can cause incorrect
// asset paths in production. The loadEnv call allows you to access
// variables prefixed with `VITE_` from the appropriate `.env` file. For
// example, `VITE_API_URL` can be used to configure API endpoints.

export default defineConfig(({ mode }) => {
  // Load environment variables that start with VITE_.* from the current
  // working directory. This allows you to define VITE_API_URL in
  // .env.development or .env.production and have it injected at build time.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    // Base URL for assets. When deploying on Vercel or another provider
    // serving the site from the root, this should be '/'. If you publish
    // to GitHub Pages under a subdirectory (e.g. /almanac/), adjust this
    // accordingly.
    base: '/',

    server: {
      port: 5173,
      // During development, proxy API calls starting with `/api` to the
      // backend server. In production, this proxy is disabled and real
      // requests should go directly to your deployed API endpoint.
      proxy: mode === 'development'
        ? {
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
            },
          }
        : undefined,
    },

    // Define global constants that can be replaced at build time. This
    // exposes VITE_API_URL (if set) as __API__ in your code. You can
    // reference it by using the __API__ constant, or you can continue
    // accessing import.meta.env.VITE_API_URL directly.
    define: {
      __API__: JSON.stringify(env.VITE_API_URL ?? ''),
    },
  };
});