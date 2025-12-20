/// <reference types="vitest" />
import {defineConfig, loadEnv} from "vite";

/** @type {import('vite').UserConfig} */
export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
    test: {},
    define: {},
    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'babylon': ['@babylonjs/core']
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
        allowedHosts: true,
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
            '^/api/claude': {
                target: 'https://api.anthropic.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/claude/, ''),
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {

                        const apiKey = env.ANTHROPIC_API_KEY;
                        console.log(` API KEY: ${apiKey}`);
                        if (apiKey) {
                            proxyReq.setHeader('x-api-key', apiKey);
                            proxyReq.setHeader('anthropic-version', '2023-06-01');
                        }
                    });
                }
            }
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
            '^/api/claude': {
                target: 'https://api.anthropic.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/claude/, ''),
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {
                        const apiKey = env.ANTHROPIC_API_KEY;
                        console.log(` API KEY: ${apiKey}`);
                        if (apiKey) {
                            proxyReq.setHeader('x-api-key', apiKey);
                            proxyReq.setHeader('anthropic-version', '2023-06-01');
                        }
                    });
                }
            }
        }
    },
    base: "/"
    };
});