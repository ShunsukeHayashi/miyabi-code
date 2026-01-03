import './globals.css';
import type { Metadata } from 'next';
import ErrorBoundary from '@/components/errors/ErrorBoundary';
import PerformanceMonitor from '@/components/errors/PerformanceMonitor';
import { FloatingFeedbackButton } from '@/components/errors/FeedbackCollector';

/**
 * Miyabi Mission Control - SEO Optimized Metadata
 * Issue #1267: Comprehensive SEO optimization for better discoverability
 */
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://miyabi-dashboard.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Miyabi Mission Control - 自律AIエージェント オーケストレーション プラットフォーム',
    template: '%s | Miyabi Mission Control',
  },
  description: '自律AIエージェントオーケストレーションのためのリアルタイムコントロールパネル。21の専門AIエージェントによる完全自動化開発プラットフォーム。',
  keywords: ['AI', '自律エージェント', 'オーケストレーション', 'ダッシュボード', 'Miyabi', '開発プラットフォーム', 'リアルタイム制御'],
  authors: [{ name: 'Miyabi Development Team' }],
  creator: 'Miyabi',
  publisher: 'Miyabi',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'technology',
  classification: 'Software Development Platform',

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: baseUrl,
    siteName: 'Miyabi Mission Control',
    title: 'Miyabi Mission Control - 自律AIエージェント オーケストレーション プラットフォーム',
    description: '自律AIエージェントオーケストレーションのためのリアルタイムコントロールパネル。21の専門AIエージェントによる完全自動化開発プラットフォーム。',
    images: [
      {
        url: '/assets/miyabi-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Miyabi Mission Control Dashboard',
      },
    ],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Miyabi Mission Control - 自律AIエージェント オーケストレーション',
    description: '21の専門AIエージェントによる完全自動化開発プラットフォーム',
    images: ['/assets/miyabi-twitter-card.jpg'],
    creator: '@miyabi_dev',
    site: '@miyabi_dev',
  },

  // Verification tags (if needed)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons
  icons: {
    icon: '/icon',
    shortcut: '/favicon.ico',
    apple: '/apple-icon',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },

  // Manifest
  manifest: '/manifest',

  // App-specific
  applicationName: 'Miyabi Mission Control',
  referrer: 'origin-when-cross-origin',

  // Additional metadata
  other: {
    'theme-color': '#667eea',
    'color-scheme': 'dark',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Miyabi',
    'application-name': 'Miyabi Mission Control',
    'msapplication-TileColor': '#667eea',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  // 構造化データ（JSON-LD）
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Miyabi Mission Control',
    'applicationCategory': 'DeveloperApplication',
    'operatingSystem': 'Web Browser',
    'description': '自律AIエージェントオーケストレーションのためのリアルタイムコントロールパネル。21の専門AIエージェントによる完全自動化開発プラットフォーム。',
    'url': baseUrl,
    'creator': {
      '@type': 'Organization',
      'name': 'Miyabi Development Team',
    },
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
    'featureList': [
      '自律AIエージェント管理',
      'リアルタイムオーケストレーション',
      'ダッシュボード監視',
      'タスク自動化',
      'エージェント間通信',
    ],
    'screenshot': '/assets/miyabi-dashboard-screenshot.jpg',
  };

  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="bg-gray-950 text-white min-h-screen">
        <ErrorBoundary>
          <PerformanceMonitor />
          {children}
          <FloatingFeedbackButton />
        </ErrorBoundary>
      </body>
    </html>
  );
}
