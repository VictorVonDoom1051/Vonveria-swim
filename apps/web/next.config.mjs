/** @type {import('next').NextConfig} */

// Destino del proxy /api. Permite que el navegador hable con un solo origen
// aunque apps/api este desplegada en otro dominio.
const apiProxyTarget = process.env.API_SERVER_URL ?? "http://localhost:3001";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@vonveria-swim/ui"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiProxyTarget}/:path*` }];
  },
};

export default nextConfig;
