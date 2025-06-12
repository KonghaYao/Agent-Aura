import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return {
      fallback: [
        {
          source: "/api/langgraph/:path*",
          destination: `${process.env.LANGGRAPH_API_URL}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
