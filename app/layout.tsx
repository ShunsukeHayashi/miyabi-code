import './globals.css'
import type { Metadata } from 'next'
import ErrorBoundary from '@/components/errors/ErrorBoundary'
import PerformanceMonitor from '@/components/errors/PerformanceMonitor'
import { FloatingFeedbackButton } from '@/components/errors/FeedbackCollector'

export const metadata: Metadata = {
  title: 'Miyabi Dashboard',
  description: 'Autonomous AI Development Platform Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-white min-h-screen">
        <ErrorBoundary>
          <PerformanceMonitor />
          {children}
          <FloatingFeedbackButton />
        </ErrorBoundary>
      </body>
    </html>
  )
}
