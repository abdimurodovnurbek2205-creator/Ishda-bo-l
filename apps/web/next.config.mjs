/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/database', '@repo/types'],
  experimental: {
    serverComponentsExternalPackages: ['exceljs'],
  },
};

export default nextConfig;
