import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Workspace packages ship TypeScript source and are compiled by Next.
  transpilePackages: ['@apex/ai', '@apex/api', '@apex/types', '@apex/ui'],
};

export default nextConfig;
