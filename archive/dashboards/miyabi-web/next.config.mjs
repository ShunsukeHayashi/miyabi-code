/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode（開発時の警告を強化）
  reactStrictMode: true,

  // 画像最適化設定
  images: {
    // サポートするフォーマット（AVIF = 最新ブラウザで20-35% 削減）
    formats: ['image/avif', 'image/webp'],

    // デバイス別の最適なサイズを自動生成
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // キャッシュ戦略
    // 本番環境では Vercel CDN が 1 年間キャッシュ
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year

    // リモート画像ホスト許可（例：GitHub Avatars）
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '/images/**',
      },
    ],
  },

  // スタンドアロン出力（デプロイサイズを30%削減）
  // Node.js の依存関係を最小化し、Docker コンテナで効率的に実行
  output: 'standalone',

  // SWC ミニファイア（esbuild より高速）
  swcMinify: true,

  // Webpack 最適化（Next.js 14+ 互換性）
  webpack: (config, { isServer }) => {
    // 大きなアセットの警告を設定
    config.performance = {
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };

    return config;
  },

  // 実験的機能（パフォーマンス改善）
  experimental: {
    // Optimizeticularly（生成時最適化）
    optimizePackageImports: [
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-icons',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'lucide-react',
    ],
  },

  // チェック間隔（デフォルト：300秒 → 実装なしでエラー）
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  // ESLint チェック（ビルド時）
  eslint: {
    dirs: ['app', 'components', 'lib', 'utils'],
  },
};

export default nextConfig;
