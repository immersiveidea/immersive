import {defineConfig} from "vite";

/** @type {import('vite').UserConfig} */
export default defineConfig({
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
            '/.netlify': {
                target: 'http://localhost:9999/',
            }
        }
    },
    base: "/"

})