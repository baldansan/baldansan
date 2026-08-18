import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The /api/hanzi/[char] route reads stroke data from node_modules at
  // runtime; without tracing hints those files are missing on Vercel.
  outputFileTracingIncludes: {
    "/api/hanzi/[char]": ["./node_modules/hanzi-writer-data/**/*.json"],
  },
};

export default nextConfig;
