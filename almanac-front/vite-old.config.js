import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    base: '/',

    server: {
      port: 5173,
      proxy: mode === 'development'
        ? {
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
            },
          }
        : undefined,
    },

    define: {
      __API__: JSON.stringify(env.VITE_API_URL ?? ''),
    },
  };
});
