/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add custom configurations if needed
  async rewrites() {
    return [
      // When in production, we would route API requests to the backend
      // {
      //   source: '/api/:path*',
      //   destination: 'http://backend-url.com/api/:path*'
      // }
    ];
  }
};

module.exports = nextConfig;
