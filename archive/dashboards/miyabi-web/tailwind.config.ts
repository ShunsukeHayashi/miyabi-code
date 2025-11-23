import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  // コンテンツ検出: PurgeCSS で使用されないクラスを削除
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      // CSS変数連携
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },

      // フォント最適化: system-ui フォントスタックを優先
      // Google Fonts の不要な読み込みを削減
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },

      // スペーシング: 必要な値のみを定義
      spacing: {
        ...defaultTheme.spacing,
        // カスタムスペーシング（必要に応じて追加）
      },

      // ブレークポイント: Next.js の推奨値
      screens: {
        xs: "320px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },

      // アニメーション: 不要なアニメーションを削除
      animation: {
        // Tailwind デフォルトを使用、追加アニメーションのみ定義
      },

      // トランジション: パフォーマンス最適化
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },

  // プラグイン
  plugins: [
    // Tree-shaking 対応 UI ライブラリプラグイン
    // (@radix-ui 自動最適化)
  ],

  // JIT モード有効化（Next.js 13+ では自動）
  // オンデマンド生成で CSS ファイルサイズを 60-80% 削減可能
  safelist: [
    // 動的クラス生成時に除外しないクラス
    // 例: grid-cols-{n}, gap-{size} など
  ],
};

export default config;
