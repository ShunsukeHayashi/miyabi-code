/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable ESLint during builds (we run it separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
