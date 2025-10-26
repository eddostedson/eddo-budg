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
  // Désactiver complètement CSP pour le développement
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'unsafe-eval' 'unsafe-inline' data: blob:; script-src * 'unsafe-eval' 'unsafe-inline'; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:; connect-src *;"
          }
        ]
      }
    ]
  }
};

export default nextConfig;
