import {defineConfig} from "vite";

/** @type {import('vite').UserConfig} */
export default defineConfig({
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