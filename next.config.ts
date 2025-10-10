import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    turbopack: {
        resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".md", ".css"],
    },
    async headers() {
        return [
            {
                // Allow CORS on all routes (you can scope this to specific routes)
                source: "/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "*",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
