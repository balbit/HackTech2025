/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  // Add custom configurations if needed
  async rewrites() {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8080';
    
    return [
      // Route API requests to the backend
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`
      },
      // WebSocket route
      {
        source: '/ws',
        destination: `${baseUrl}/ws`
      }
    ];
  }
};

module.exports = nextConfig;
