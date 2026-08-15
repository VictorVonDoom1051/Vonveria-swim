/** @type {import('next').NextConfig} */

// El proxy hacia apps/api vive en app/api/[...path]/route.ts y no aqui: los
// rewrites de next.config se compilan dentro del build, y la URL de la api solo
// se conoce en runtime.
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@vonveria-swim/ui"],
};

export default nextConfig;
