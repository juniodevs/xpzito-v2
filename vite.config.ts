import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: { 
        entry: 'src/main/index.ts', 
        vite: { 
          build: { 
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['bufferutil', 'utf-8-validate']
            }
          } 
        } 
      },
      preload: { input: path.join(__dirname, 'src/preload/index.ts'), vite: { build: { outDir: 'dist-electron/preload' } } },
    })
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src/renderer') } },
  build: { outDir: 'dist-react', emptyOutDir: true }
});
