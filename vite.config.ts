import { defineConfig } from "vite";
import { pluginAPI } from "vite-plugin-api";

export default defineConfig({
    server: {
      port: 3000
    },
    plugins: [
        pluginAPI({
            // routeBase?: "api",
            // dirs?: [{ dir: "src/api"; route: "", exclude?: ["*.txt", ".csv", "data/*.*"] }],
            // include?: ["**/*.js", "**/*.ts"],
            // exclude?: ["node_modules", ".git"],
            // moduleId?: "virtual:vite-plugin-api",
            // mapper?: { default: "use", GET: "get", ... },
            // entry?: "[node_module:lib]/server.js",
            // handler?: "[node_module:lib]/handler.js",
        }),
    ],
});