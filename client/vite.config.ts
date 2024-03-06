import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from 'path';
import Vue from '@vitejs/plugin-vue';
import Vuetify from 'vite-plugin-vuetify';


// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: 'VUE_APP_',
  assetsInclude: ['**/*.onnx'],
  plugins: [
    Vue(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/onnxruntime-web/dist/*.wasm",
          dest: ".",
        },
      ],
    }),
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((req, res, next) => {
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          if (req.originalUrl.endsWith(".wasm")) {
            res.setHeader("Content-Type", "application/wasm");
          }
          next();
        });
      },
    },
    topLevelAwait(),
    Vuetify({
      autoImport: true
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api": {
        target: `http://localhost:8000`,
        xfwd: true,
      },
    },
    strictPort: true,
  },
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
});
