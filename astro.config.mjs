// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
    integrations: [react()],

    vite: {
        define: {
            "process.env": "import.meta.env",
        },
        resolve: {
            alias: {
                "@": new URL("./", import.meta.url).pathname,
            },
        },
        plugins: [tailwindcss()],
    },

    adapter: netlify({
        edgeMiddleware: true,
    }),
});
