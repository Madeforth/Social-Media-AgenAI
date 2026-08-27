import type { NextConfig } from 'next';

import { STATIC_SECURITY_HEADERS } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Workspace packages ship TypeScript source and are compiled by Next.
  transpilePackages: ['@apex/ai', '@apex/api', '@apex/types', '@apex/ui'],

  // Never expose which version of Next is running.
  poweredByHeader: false,

  async headers() {
    return [{ source: '/:path*', headers: STATIC_SECURITY_HEADERS }];
  },
};

export default nextConfig;
