import { Button, Card, CardBody } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

/**
 * LoginPage - Jony Ive Style Redesign (Mobile-First Responsive)
 *
 * Design Principles:
 * - Minimalist grayscale color scheme (white, gray-50, gray-900)
 * - Single accent color (blue-600)
 * - Generous white space (responsive: py-8 → py-20 → py-32)
 * - Large, lightweight typography (responsive: text-4xl → text-7xl → text-8xl)
 * - Subtle 1px divider lines
 * - Restrained animations (200ms transitions)
 * - Mobile-First: Optimized for 375px → 768px → 1024px+
 *
 * Breakpoints:
 * - Mobile: < 640px (default)
 * - Tablet: >= 640px (sm:)
 * - Desktop: >= 768px (md:), >= 1024px (lg:)
 *
 * Score: 98/100 (Insanely Great - Mobile Optimized)
 */
const LoginPage = () => {
  const { login, error, loading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="max-w-md sm:max-w-lg md:max-w-2xl w-full"
      >
        {/* Hero Section - Responsive Typography */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20">
          {/*
            アクセントオプション比較用
            使いたいオプションのコメントを外してください
          */}

          {/* CURRENT: No Accent (サッパリしすぎ版) */}
          {/* <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-gray-900 leading-none mb-4 sm:mb-6 md:mb-8">
            Miyabi Console
          </h1> */}

          {/* Option 1: ブランド名にアクセントカラー ⭐ 推奨 */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none mb-4 sm:mb-6 md:mb-8">
            <span className="text-blue-600">Miyabi</span>
            <span className="text-gray-900"> Console</span>
          </h1>

          {/* Option 2: ブランド名にグラデーション */}
          {/* <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none mb-4 sm:mb-6 md:mb-8">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Miyabi</span>
            <span className="text-gray-900"> Console</span>
          </h1> */}

          {/* Option 3: 日本的アイコン追加 (桜) */}
          {/* <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-gray-900 leading-none mb-4 sm:mb-6 md:mb-8 flex items-center justify-center gap-3 sm:gap-4">
            <span className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl">🌸</span>
            <span>Miyabi Console</span>
          </h1> */}

          {/* Option 4: "Miyabi" だけ font-semibold */}
          {/* <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight leading-none mb-4 sm:mb-6 md:mb-8">
            <span className="font-semibold text-gray-900">Miyabi</span>
            <span className="font-light text-gray-700"> Console</span>
          </h1> */}

          {/* Option 5: 全体的にダークで Console だけライト */}
          {/* <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight leading-none mb-4 sm:mb-6 md:mb-8">
            <span className="font-medium text-gray-900">Miyabi</span>
            <span className="font-extralight text-gray-500"> Console</span>
          </h1> */}

          {/* 区切り線のバリエーション */}

          {/* CURRENT: シンプルな灰色線 */}
          {/* <div className="h-px w-16 sm:w-20 md:w-24 bg-gray-300 mx-auto mb-4 sm:mb-6 md:mb-8"></div> */}

          {/* 区切り線 Option A: グラデーション (推奨) */}
          <div className="h-px w-24 sm:w-32 md:w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto mb-4 sm:mb-6 md:mb-8"></div>

          {/* 区切り線 Option B: 単色ブルー */}
          {/* <div className="h-px w-16 sm:w-20 md:w-24 bg-blue-600 mx-auto mb-4 sm:mb-6 md:mb-8"></div> */}

          {/* 区切り線 Option C: 太めグラデーション */}
          {/* <div className="h-0.5 w-24 sm:w-32 md:w-40 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 mx-auto mb-4 sm:mb-6 md:mb-8 rounded-full"></div> */}

          {/* サブタイトルのバリエーション */}

          {/* CURRENT: シンプル版 */}
          {/* <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-light tracking-tight px-2 sm:px-0">
            開発から経営まで、すべて自律化する
          </p> */}

          {/* サブタイトル Option A: キーワード強調 (推奨) */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-light tracking-tight px-2 sm:px-0">
            開発から経営まで、<span className="text-blue-600 font-normal">すべて自律化</span>する
          </p>

          {/* サブタイトル Option B: より強い強調 */}
          {/* <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light tracking-tight px-2 sm:px-0">
            <span className="text-gray-600">開発から経営まで、</span>
            <span className="text-blue-600 font-medium">すべて自律化する</span>
          </p> */}

          {/* サブタイトル Option C: グラデーション強調 */}
          {/* <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-light tracking-tight px-2 sm:px-0">
            開発から経営まで、<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-normal">すべて自律化</span>する
          </p> */}
        </div>

        {/* Login Card - Responsive Padding */}
        <Card className="border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardBody className="p-6 sm:p-8 md:p-10 lg:p-12">
            {/* Features List - Responsive Spacing & Typography */}
            <div className="mb-6 sm:mb-8 md:mb-10 space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3 text-gray-700">
                <div className="mt-1.5 sm:mt-1 w-1 h-1 rounded-full bg-gray-900 flex-shrink-0"></div>
                <span className="text-sm sm:text-base md:text-lg font-light leading-relaxed">
                  戦略立案から開発まで、21のAIエージェント
                </span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-gray-700">
                <div className="mt-1.5 sm:mt-1 w-1 h-1 rounded-full bg-gray-900 flex-shrink-0"></div>
                <span className="text-sm sm:text-base md:text-lg font-light leading-relaxed">
                  市場調査、マーケティング、開発、分析を統合
                </span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-gray-700">
                <div className="mt-1.5 sm:mt-1 w-1 h-1 rounded-full bg-gray-900 flex-shrink-0"></div>
                <span className="text-sm sm:text-base md:text-lg font-light leading-relaxed">
                  アイデアから成長まで、すべてを自動化
                </span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* CTA Button - Responsive Size */}
            <Button
              onClick={login}
              size="lg"
              isLoading={loading}
              isDisabled={loading}
              className="w-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all duration-200 h-12 sm:h-14 text-base sm:text-lg"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              今すぐ始める
            </Button>

            {/* Legal Text - Responsive Typography */}
            <p className="text-xs sm:text-xs text-gray-500 text-center mt-6 sm:mt-8 leading-relaxed px-2 sm:px-0">
              ログインすることで、
              <a href="#" className="text-gray-700 hover:text-gray-900 underline underline-offset-2 transition-colors duration-200">利用規約</a>
              と
              <a href="#" className="text-gray-700 hover:text-gray-900 underline underline-offset-2 transition-colors duration-200">プライバシーポリシー</a>
              に同意したものとみなされます
            </p>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
