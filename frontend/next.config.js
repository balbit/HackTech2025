/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add custom configurations if needed
  async rewrites() {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8080';
    
    return [
      // Route API requests to the backend
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`
      },
      // Socket.IO specific routes - each of these patterns is used by Socket.IO
      {
        source: '/ws/socket.io',
        destination: `${baseUrl}/ws/socket.io`
      },
      {
        source: '/ws/socket.io/:path*',
        destination: `${baseUrl}/ws/socket.io/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
