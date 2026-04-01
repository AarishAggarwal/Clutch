/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma on Vercel: avoid bundling the query engine into serverless functions incorrectly
  // Next.js 14: use experimental; `serverExternalPackages` is for Next.js 15+
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

export default nextConfig;
