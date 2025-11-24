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
    <div className="min-h-screen bg-white">
      {/* Hero Section - Massive Title with Generous Whitespace */}
      <section className="py-24 md:py-48 px-5 text-center border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto">
          {/* Massive Ultra-Light Title (Ive's signature) */}
          <h1 className="text-7xl md:text-8xl lg:text-[120px] font-extralight tracking-tighter text-gray-900 leading-none mb-6">
            Dashboard
          </h1>

          {/* Delicate 1px Divider (Ive's signature detail) */}
          <div className="h-px w-24 bg-gray-300 mx-auto mb-16"></div>

          {/* Subtitle - Light and Minimal */}
          <p className="text-xl md:text-2xl text-gray-500 font-light max-w-2xl mx-auto">
            Miyabi System Overview
          </p>

          {/* Connection Status */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : error ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            <span className="text-sm text-gray-400">
              {loading ? 'Connecting...' : error ? 'Connection Error' : `Uptime: ${stats.uptime}`}
            </span>
          </div>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-100 px-5 py-4">
          <p className="text-center text-red-600 text-sm">
            {error} — Using cached data
          </p>
        </div>
      )}

      {/* Stats Section - Generous Spacing */}
      <section className="py-24 md:py-32 px-5">
        <div className="max-w-[1600px] mx-auto">
          {/* Stats Grid - Minimal Design */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Stat Card 1 */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                Active Agents
              </p>
              <p className="text-5xl md:text-6xl font-extralight text-gray-900 leading-none mb-2">
                {stats.activeAgents}
              </p>
              <p className="text-sm text-gray-400 font-light">
                of {stats.totalAgents}
              </p>
            </div>

            {/* Stat Card 2 */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                Running Tasks
              </p>
              <p className="text-5xl md:text-6xl font-extralight text-gray-900 leading-none">
                {stats.runningTasks}
              </p>
            </div>

            {/* Stat Card 3 */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                Completed Today
              </p>
              <p className="text-5xl md:text-6xl font-extralight text-gray-900 leading-none">
                {stats.completedToday}
              </p>
            </div>

            {/* Stat Card 4 */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                Success Rate
              </p>
              <p className="text-5xl md:text-6xl font-extralight text-gray-900 leading-none">
                {successRate}<span className="text-3xl text-gray-400">%</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Delicate Section Divider */}
      <div className="h-px bg-gray-200 max-w-7xl mx-auto"></div>

      {/* System Resources Section */}
      <section className="py-24 md:py-32 px-5">
        <div className="max-w-[1600px] mx-auto">
          {/* Section Title */}
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-gray-900 mb-16 text-center">
            System Resources
          </h2>

          {/* Resources Grid */}
          <div className="max-w-3xl mx-auto space-y-12">
            {/* CPU Usage */}
            <div>
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xl font-light text-gray-900">CPU Usage</span>
                <span className="text-3xl font-extralight text-gray-900">
                  {stats.cpuUsage.toFixed(1)}
                  <span className="text-lg text-gray-400">%</span>
                </span>
              </div>
              {/* Progress Bar - Grayscale Only */}
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all duration-200 ease-in-out"
                  style={{ width: `${Math.min(stats.cpuUsage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Memory Usage */}
            <div>
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xl font-light text-gray-900">Memory Usage</span>
                <span className="text-3xl font-extralight text-gray-900">
                  {stats.memoryUsage.toFixed(1)}
                  <span className="text-lg text-gray-400">%</span>
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all duration-200 ease-in-out"
                  style={{ width: `${Math.min(stats.memoryUsage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Disk Usage */}
            <div>
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xl font-light text-gray-900">Disk Usage</span>
                <span className="text-3xl font-extralight text-gray-900">
                  {stats.diskUsage.toFixed(1)}
                  <span className="text-lg text-gray-400">%</span>
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all duration-200 ease-in-out"
                  style={{ width: `${Math.min(stats.diskUsage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delicate Section Divider */}
      <div className="h-px bg-gray-200 max-w-7xl mx-auto"></div>

      {/* Quick Actions Section */}
      <section className="py-24 md:py-48 px-5">
        <div className="max-w-[1600px] mx-auto">
          {/* Section Title */}
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-gray-900 mb-16 text-center">
            Quick Actions
          </h2>

          {/* Actions Grid - Minimal Icons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Action 1 - Agents (Secondary) */}
            <Link
              to="/agents"
              className="group block text-center p-8 md:p-12 border border-gray-200 hover:border-gray-300 transition-all duration-200 ease-in-out"
            >
              <Bot className="w-8 h-8 mx-auto mb-6 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
              <p className="text-lg font-light text-gray-900">Agents</p>
            </Link>

            {/* Action 2 - Deploy (PRIMARY CTA - THE ONLY BLUE ELEMENT) */}
            <Link
              to="/deployment"
              className="group block text-center p-8 md:p-12 bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out"
            >
              <Zap className="w-8 h-8 mx-auto mb-6 text-white" />
              <p className="text-lg font-light text-white">Deploy</p>
            </Link>

            {/* Action 3 - Infrastructure (Secondary) */}
            <Link
              to="/infrastructure"
              className="group block text-center p-8 md:p-12 border border-gray-200 hover:border-gray-300 transition-all duration-200 ease-in-out"
            >
              <Server className="w-8 h-8 mx-auto mb-6 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
              <p className="text-lg font-light text-gray-900">Infrastructure</p>
            </Link>

            {/* Action 4 - Database (Secondary) */}
            <Link
              to="/database"
              className="group block text-center p-8 md:p-12 border border-gray-200 hover:border-gray-300 transition-all duration-200 ease-in-out"
            >
              <Database className="w-8 h-8 mx-auto mb-6 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
              <p className="text-lg font-light text-gray-900">Database</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Whitespace */}
      <div className="py-24"></div>
    </div>
  )
}
