import {defineConfig} from "vite";

/** @type {import('vite').UserConfig} */
export default defineConfig({
    server: {
      port: 3001,
        proxy: { '/api': 'https://local.immersiveidea.com' ,
            '/login': 'https://local.immersiveidea.com',
            '/callback': 'https://local.immersiveidea.com'
        }
    },

    base: "/"

})