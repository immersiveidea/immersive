import {defineConfig} from "vite";

/** @type {import('vite').UserConfig} */
export default defineConfig({
    define: {
        "global": {}
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