import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    turbopack: {
        resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".md", ".css"],
    },
};

export default nextConfig;
