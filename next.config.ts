import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Le logo est lu par la route qui génère le PDF : l'inclure dans la fonction serveur déployée.
  outputFileTracingIncludes: {
    "/api/questionnaires": ["./public/logo-assurbatisseurs.png"],
  },
};

export default nextConfig;
