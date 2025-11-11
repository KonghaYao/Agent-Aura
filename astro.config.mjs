// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

import netlify from "@astrojs/netlify";
// https://astro.build/config
export default defineConfig({
    integrations: [react()],
    output: "static",
    vite: {
        define:
            process.env.NODE_ENV === "production"
                ? {}
                : {
                      "process.env": "import.meta.env",
                  },

        resolve: {
            alias: {
                "@": new URL("./", import.meta.url).pathname,
            },
        },
        plugins: [tailwindcss()],
        server: {
            proxy: {
                "/api": {
                    target: "http://localhost:8123",
                    changeOrigin: true,
                    rewrite: (path) => path,
                },
            },
        },
    },
    adapter: netlify({}),
});
