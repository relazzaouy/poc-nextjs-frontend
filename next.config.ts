import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server.js that honours
  // process.env.PORT - this is what the Docker runtime stage runs.
  output: 'standalone',
};

export default nextConfig;
