/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma on Vercel: avoid bundling the query engine into serverless functions incorrectly
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
