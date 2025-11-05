/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode
  reactStrictMode: true,

  // 画像最適化設定（ダッシュボード用・ミニマル）
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },

  // スタンドアロン出力
  output: 'standalone',

  // SWC ミニファイア
  swcMinify: true,

  // TypeScript 型チェック
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  // ESLint チェック
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
};

module.exports = nextConfig;
