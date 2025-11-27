/**
 * Dashboard Page - Jonathan Ive Edition
 *
 * Score Target: 95/100 (Insanely Great)
 *
 * Ive Principles Applied:
 * 1. Extreme Minimalism - No decoration, pure essence
 * 2. Generous Whitespace - py-48 (192px) sections
 * 3. Refined Colors - Grayscale + blue-600 for ONE primary CTA
 * 4. Typography-Focused - text-8xl font-extralight hero
 * 5. Subtle Animation - 200ms ease-in-out only
 */

import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Bot, Zap, Server, Database, AlertCircle, Loader2 } from 'lucide-react'
import { dashboardService } from '@/lib/services'
import { handleApiError } from '@/lib/api/client'
import { useTheme } from '@/contexts/ThemeContext'

interface DashboardStats {
  activeAgents: number
  totalAgents: number
  runningTasks: number
  completedToday: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  uptime: string
}

export default function DashboardPage() {
  const { tokens, isDark } = useTheme()
  const [stats, setStats] = useState<DashboardStats>({
    activeAgents: 0,
    totalAgents: 14,
    runningTasks: 0,
    completedToday: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    uptime: '0h',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null)

        // Use dashboardService to fetch all data
        const { summary, metrics } = await dashboardService.refresh()

        // Convert uptime seconds to human readable
        const hours = Math.floor(metrics.uptime_seconds / 3600)
        const minutes = Math.floor((metrics.uptime_seconds % 3600) / 60)
        const uptimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

        setStats({
          activeAgents: summary.activeAgents,
          totalAgents: summary.totalAgents,
          runningTasks: summary.pendingTasks,
          completedToday: summary.completedTasks,
          cpuUsage: metrics.cpu_usage,
          memoryUsage: metrics.memory_usage,
          diskUsage: metrics.disk_usage,
          uptime: uptimeStr,
        })
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        console.error('Failed to fetch stats:', apiError)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    // Auto-refresh every 30 seconds (as per issue #979 requirements)
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  // Calculate success rate
  const successRate = stats.completedToday > 0
    ? ((stats.completedToday / (stats.completedToday + stats.runningTasks)) * 100).toFixed(1)
    : '100.0'

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{
        background: tokens.colors.background.primary,
      }}
    >
      {/* Hero Section - Massive Title with Generous Whitespace */}
      <section
        className={`${tokens.spacing.sectionY} ${tokens.spacing.sectionX} text-center`}
        style={{ borderBottom: `1px solid ${tokens.colors.surface.cardBorder}` }}
      >
        <div className="max-w-[1600px] mx-auto">
          {/* Massive Ultra-Light Title (Accessibility: font-light instead of extralight) */}
          <h1
            className={tokens.typography.hero}
            style={{ color: tokens.colors.text.primary }}
          >
            Dashboard
          </h1>

          {/* Delicate 1px Divider */}
          <div
            className="h-px w-24 mx-auto mb-16"
            style={{ backgroundColor: tokens.colors.text.tertiary }}
          ></div>

          {/* Subtitle - Light and Minimal */}
          <p
            className="text-xl md:text-2xl font-light max-w-2xl mx-auto"
            style={{ color: tokens.colors.text.secondary }}
          >
            Miyabi System Overview
          </p>

          {/* Connection Status */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: tokens.colors.text.tertiary }} />
            ) : error ? (
              <AlertCircle className="w-4 h-4" style={{ color: tokens.colors.accent.error }} />
            ) : (
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.colors.accent.success }}></div>
            )}
            <span className="text-sm" style={{ color: tokens.colors.text.tertiary }}>
              {loading ? 'Connecting...' : error ? 'Connection Error' : `Uptime: ${stats.uptime}`}
            </span>
          </div>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div
          className="border-b px-5 py-4"
          style={{
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA'
          }}
        >
          <p className="text-center text-sm" style={{ color: tokens.colors.accent.error }}>
            {error} — Using cached data
          </p>
        </div>
      )}

      {/* Stats Section - Generous Spacing */}
      <section className={`${tokens.spacing.sectionY} ${tokens.spacing.sectionX}`}>
        <div className="max-w-[1600px] mx-auto">
          {/* Stats Grid - Minimal Design */}
          <div className={`grid grid-cols-2 lg:grid-cols-4 ${tokens.spacing.cardGap}`}>
            {/* Stat Card 1 */}
            <div className="text-center">
              <p className={`${tokens.typography.caption} mb-3`} style={{ color: tokens.colors.text.tertiary }}>
                Active Agents
              </p>
              <p className={tokens.typography.stat} style={{ color: tokens.colors.text.primary }}>
                {stats.activeAgents}
              </p>
              <p className="text-sm font-light" style={{ color: tokens.colors.text.tertiary }}>
                of {stats.totalAgents}
              </p>
            </div>

            {/* Stat Card 2 */}
            <div className="text-center">
              <p className={`${tokens.typography.caption} mb-3`} style={{ color: tokens.colors.text.tertiary }}>
                Running Tasks
              </p>
              <p className={tokens.typography.stat} style={{ color: tokens.colors.text.primary }}>
                {stats.runningTasks}
              </p>
            </div>

            {/* Stat Card 3 */}
            <div className="text-center">
              <p className={`${tokens.typography.caption} mb-3`} style={{ color: tokens.colors.text.tertiary }}>
                Completed Today
              </p>
              <p className={tokens.typography.stat} style={{ color: tokens.colors.text.primary }}>
                {stats.completedToday}
              </p>
            </div>

            {/* Stat Card 4 */}
            <div className="text-center">
              <p className={`${tokens.typography.caption} mb-3`} style={{ color: tokens.colors.text.tertiary }}>
                Success Rate
              </p>
              <p className={tokens.typography.stat} style={{ color: tokens.colors.text.primary }}>
                {successRate}<span className="text-3xl" style={{ color: tokens.colors.text.tertiary }}>%</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Delicate Section Divider */}
      <div className="h-px max-w-7xl mx-auto" style={{ backgroundColor: tokens.colors.surface.cardBorder }}></div>

      {/* System Resources Section */}
      <section className={`${tokens.spacing.sectionY} ${tokens.spacing.sectionX}`}>
        <div className="max-w-[1600px] mx-auto">
          {/* Section Title */}
          <h2
            className={`${tokens.typography.heading} mb-16 text-center`}
            style={{ color: tokens.colors.text.primary }}
          >
            System Resources
          </h2>

          {/* Resources Grid */}
          <div className="max-w-3xl mx-auto space-y-12">
            {/* CPU Usage */}
            <div>
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xl font-light" style={{ color: tokens.colors.text.primary }}>CPU Usage</span>
                <span className="text-3xl font-normal" style={{ color: tokens.colors.text.primary }}>
                  {stats.cpuUsage.toFixed(1)}
                  <span className="text-lg" style={{ color: tokens.colors.text.tertiary }}>%</span>
                </span>
              </div>
              {/* Progress Bar */}
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: tokens.colors.surface.overlay }}>
                <div
                  className={`h-full ${tokens.effects.transition}`}
                  style={{
                    backgroundColor: tokens.colors.text.primary,
                    width: `${Math.min(stats.cpuUsage, 100)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Memory Usage */}
            <div>
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xl font-light" style={{ color: tokens.colors.text.primary }}>Memory Usage</span>
                <span className="text-3xl font-normal" style={{ color: tokens.colors.text.primary }}>
                  {stats.memoryUsage.toFixed(1)}
                  <span className="text-lg" style={{ color: tokens.colors.text.tertiary }}>%</span>
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: tokens.colors.surface.overlay }}>
                <div
                  className={`h-full ${tokens.effects.transition}`}
                  style={{
                    backgroundColor: tokens.colors.text.primary,
                    width: `${Math.min(stats.memoryUsage, 100)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Disk Usage */}
            <div>
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xl font-light" style={{ color: tokens.colors.text.primary }}>Disk Usage</span>
                <span className="text-3xl font-normal" style={{ color: tokens.colors.text.primary }}>
                  {stats.diskUsage.toFixed(1)}
                  <span className="text-lg" style={{ color: tokens.colors.text.tertiary }}>%</span>
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: tokens.colors.surface.overlay }}>
                <div
                  className={`h-full ${tokens.effects.transition}`}
                  style={{
                    backgroundColor: tokens.colors.text.primary,
                    width: `${Math.min(stats.diskUsage, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delicate Section Divider */}
      <div className="h-px max-w-7xl mx-auto" style={{ backgroundColor: tokens.colors.surface.cardBorder }}></div>

      {/* Quick Actions Section */}
      <section className={`${tokens.spacing.sectionY} ${tokens.spacing.sectionX}`}>
        <div className="max-w-[1600px] mx-auto">
          {/* Section Title */}
          <h2
            className={`${tokens.typography.heading} mb-16 text-center`}
            style={{ color: tokens.colors.text.primary }}
          >
            Quick Actions
          </h2>

          {/* Actions Grid - Minimal Icons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Action 1 - Agents (Secondary) */}
            <Link
              to="/agents"
              className={`group block text-center p-8 md:p-12 ${tokens.effects.transition}`}
              style={{
                border: `1px solid ${tokens.colors.surface.cardBorder}`,
              }}
            >
              <Bot className="w-8 h-8 mx-auto mb-6" style={{ color: tokens.colors.text.tertiary }} />
              <p className="text-lg font-light" style={{ color: tokens.colors.text.primary }}>Agents</p>
            </Link>

            {/* Action 2 - Deploy (PRIMARY CTA) */}
            <Link
              to="/deployment"
              className={`group block text-center p-8 md:p-12 ${tokens.effects.transition}`}
              style={{
                backgroundColor: tokens.colors.accent.primary,
              }}
            >
              <Zap className="w-8 h-8 mx-auto mb-6" style={{ color: tokens.colors.text.inverse }} />
              <p className="text-lg font-light" style={{ color: tokens.colors.text.inverse }}>Deploy</p>
            </Link>

            {/* Action 3 - Infrastructure (Secondary) */}
            <Link
              to="/infrastructure"
              className={`group block text-center p-8 md:p-12 ${tokens.effects.transition}`}
              style={{
                border: `1px solid ${tokens.colors.surface.cardBorder}`,
              }}
            >
              <Server className="w-8 h-8 mx-auto mb-6" style={{ color: tokens.colors.text.tertiary }} />
              <p className="text-lg font-light" style={{ color: tokens.colors.text.primary }}>Infrastructure</p>
            </Link>

            {/* Action 4 - Database (Secondary) */}
            <Link
              to="/database"
              className={`group block text-center p-8 md:p-12 ${tokens.effects.transition}`}
              style={{
                border: `1px solid ${tokens.colors.surface.cardBorder}`,
              }}
            >
              <Database className="w-8 h-8 mx-auto mb-6" style={{ color: tokens.colors.text.tertiary }} />
              <p className="text-lg font-light" style={{ color: tokens.colors.text.primary }}>Database</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Whitespace */}
      <div className="py-24"></div>
    </div>
  )
}
