import { defineConfig } from "vite";
import nodeExternals from "rollup-plugin-node-externals";
import { viteStaticCopy } from "vite-plugin-static-copy";
// 替换 __filename 为 import.meta.filename
export default defineConfig({
    plugins: [
        nodeExternals({
            builtins: true,
            deps: false,
            devDeps: false,
            peerDeps: false,
            optDeps: false,
            include: [
                "bun:sqlite",
                "path",
                "crypto",
                "util",
                "stream",
                "fs",
                "better-sqlite3", // 线上环境使用 PG，所以可以不需要这个
            ],
        }),
        viteStaticCopy({
            targets: [
                {
                    src: "./node_modules/@langgraph-js/open-smith/dist/public",
                    dest: ".",
                },
            ],
        }),
    ],
    define: {
        __filename: "import.meta.filename",
    },
    resolve: {
        alias: {
            "@": new URL("./", import.meta.url).pathname,
        },
    },
    publicDir: "./node_modules/@langgraph-js/open-smith/dist/public",
    build: {
        outDir: "./build",
        target: "es2022",
        lib: {
            entry: ["./agent/raw-server.ts"],
            formats: ["es"],
        },
        minify: false,
        sourcemap: false,
    },
});
