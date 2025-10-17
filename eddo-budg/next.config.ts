import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Empêche le build de s'arrêter à cause d'erreurs ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Empêche le build de s'arrêter à cause d'erreurs TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
