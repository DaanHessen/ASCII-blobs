import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        vanilla: resolve(__dirname, 'src/vanilla.ts'),
      },
      name: 'AsciiBlobs',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : format === 'cjs' ? 'cjs' : 'js';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        preserveModules: false,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'ascii-blobs.css';
          }
          return assetInfo.name || 'asset';
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 100,
  },
  server: {
    port: 3000,
    open: false,
  },
});
