/// <reference types="vitest" />
import {defineConfig} from "vite";

/** @type {import('vite').UserConfig} */
export default defineConfig({
    test: {},
    define: {},
    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'babylon': ['@babylonjs/core'],
                    'crypto': ["js-crypto-aes", "hash-wasm", "uint8-to-b64"]
                }
            }
        }
    },
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
            },
            '^/create-db': {
                target: 'https://www.deepdiagram.com/',
                changeOrigin: true,
            },
            '^/api/images': {
                target: 'https://www.deepdiagram.com/',
                changeOrigin: true,
            },
        }

    },
    preview: {
        port: 3001,
        proxy: {
            '^/sync/.*': {
                target: 'https://www.deepdiagram.com/',
                changeOrigin: true,
            },
            '^/create-db': {
                target: 'https://www.deepdiagram.com/',
                changeOrigin: true,
            },
            '^/api/images': {
                target: 'https://www.deepdiagram.com/',
                changeOrigin: true,
            },
        }
    },
    base: "/"

})