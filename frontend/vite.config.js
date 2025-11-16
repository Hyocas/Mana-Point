import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // força pré-bundling do jwt-decode (resolve problemas de import)
    include: ['jwt-decode']
  },
  ssr: {
    // evita que o Vite tente externalizar o pacote em SSR (caso usem ssr)
    noExternal: ['jwt-decode']
  },
  server: {
    proxy: {
      '/api/catalogo_proxy': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/catalogo_proxy/, '/api')
      },
      '/api/usuarios_proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/usuarios_proxy/, '/api')
      },
      '/api/carrinho_proxy': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/carrinho_proxy/, '/api')
      }
    }
  }
});
