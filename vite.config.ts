/// <reference types="vitest" />
import {defineConfig} from "vite";

/** @type {import('vite').UserConfig} */
export default defineConfig({
    test: {},
    define: {},
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'window',
            }
        }
    },
    server: {
        port: 3001,
        proxy: {
            '^/sync/.*': {
                target: 'https://www.deepdiagram.com/',
                changeOrigin: true,
            }
        }
    },
    base: "/"

})