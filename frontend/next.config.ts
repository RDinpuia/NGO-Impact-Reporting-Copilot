import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack uses the frontend folder as the project root
  // Use an absolute path so Turbopack doesn't warn about relative roots
  turbopack: { root: __dirname as unknown as string },
};

export default nextConfig;
