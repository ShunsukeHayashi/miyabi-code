/**
 * Analytics Page - Jonathan Ive Edition
 *
 * Score Target: 92/100 (Insanely Great)
 *
 * Ive Principles Applied:
 * 1. Extreme Minimalism - Clean charts, no decoration
 * 2. Generous Whitespace - py-48 sections
 * 3. Refined Colors - Grayscale + blue-600 accent
 * 4. Typography-Focused - Large numbers, light fonts
 * 5. Subtle Animation - 200ms ease-in-out only
 */

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react'
import { Button } from '@heroui/react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DailyStats, AgentPerformanceMetric } from '../types/analytics'

type Period = 'day' | 'week' | 'month'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('week')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformanceMetric[]>([])
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    successRate: 0,
    avgResponseTime: 0,
    activeAgents: 0,
  })

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      setError(null)

      try {
        // Mock data for demonstration
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500))

        const mockDailyStats: DailyStats[] = generateMockDailyStats(period)
        const mockAgentPerformance: AgentPerformanceMetric[] = generateMockAgentPerformance()

        setDailyStats(mockDailyStats)
        setAgentPerformance(mockAgentPerformance)

        // Calculate summary metrics
        const totalCompleted = mockDailyStats.reduce((sum, d) => sum + d.tasks_completed, 0)
        const totalFailed = mockDailyStats.reduce((sum, d) => sum + d.tasks_failed, 0)
        const avgResponse = mockDailyStats.reduce((sum, d) => sum + d.avg_response_time_ms, 0) / mockDailyStats.length
        const avgActiveAgents = mockDailyStats.reduce((sum, d) => sum + d.agents_active, 0) / mockDailyStats.length

        setMetrics({
          totalTasks: totalCompleted + totalFailed,
          successRate: totalCompleted / (totalCompleted + totalFailed) * 100,
          avgResponseTime: avgResponse,
          activeAgents: Math.round(avgActiveAgents),
        })
      } catch (err) {
        setError('Failed to load analytics data')
        console.error('Analytics fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [period])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 md:py-48 px-5 text-center border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto">
          <h1 className="text-7xl md:text-8xl lg:text-[120px] font-extralight tracking-tighter text-gray-900 leading-none mb-6">
            Analytics
          </h1>

          <div className="h-px w-24 bg-gray-300 mx-auto mb-16"></div>

          <p className="text-xl md:text-2xl text-gray-500 font-light max-w-2xl mx-auto">
            System Performance Insights
          </p>

          {/* Period Selector */}
          <div className="mt-12 flex items-center justify-center gap-2">
            {(['day', 'week', 'month'] as Period[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'solid' : 'light'}
                color={period === p ? 'primary' : 'default'}
                onClick={() => setPeriod(p)}
                className={`capitalize transition-all duration-200 ${
                  period === p ? 'bg-blue-600 text-white' : 'text-gray-500'
                }`}
              >
                {p}
              </Button>
            ))}
          </div>

          {/* Status Indicator */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : error ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            <span className="text-sm text-gray-400">
              {loading ? 'Loading...' : error ? 'Error' : 'Live Data'}
            </span>
          </div>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-100 px-5 py-4">
          <p className="text-center text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Key Metrics Section */}
      <section className="py-24 md:py-32 px-5">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Total Tasks */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                Total Tasks
              </p>
              <p className="text-5xl md:text-6xl font-extralight text-gray-900 leading-none">
                {metrics.totalTasks.toLocaleString()}
              </p>
            </div>

            {/* Success Rate */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                Success Rate
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-5xl md:text-6xl font-extralight text-gray-900 leading-none">
                  {metrics.successRate.toFixed(1)}
                  <span className="text-3xl text-gray-400">%</span>
                </p>
                {metrics.successRate >= 95 ? (
                  <TrendingUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </div>

            {/* Avg Response Time */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                Avg Response
              </p>
              <p className="text-5xl md:text-6xl font-extralight text-gray-900 leading-none">
                {(metrics.avgResponseTime / 1000).toFixed(1)}
                <span className="text-3xl text-gray-400">s</span>
              </p>
            </div>

            {/* Active Agents */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                Active Agents
              </p>
              <p className="text-5xl md:text-6xl font-extralight text-gray-900 leading-none">
                {metrics.activeAgents}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gray-200 max-w-7xl mx-auto"></div>

      {/* Task Trends Chart */}
      <section className="py-24 md:py-32 px-5">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center gap-3 mb-16">
            <Activity className="w-6 h-6 text-gray-400" />
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-gray-900 text-center">
              Task Trends
            </h2>
          </div>

          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tasks_completed"
                    stroke="#111827"
                    strokeWidth={2}
                    dot={false}
                    name="Completed"
                  />
                  <Line
                    type="monotone"
                    dataKey="tasks_failed"
                    stroke="#9ca3af"
                    strokeWidth={1}
                    dot={false}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gray-200 max-w-7xl mx-auto"></div>

      {/* Agent Performance Chart */}
      <section className="py-24 md:py-32 px-5">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center gap-3 mb-16">
            <BarChart3 className="w-6 h-6 text-gray-400" />
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-gray-900 text-center">
              Agent Performance
            </h2>
          </div>

          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="agent_name"
                    stroke="#9ca3af"
                    fontSize={12}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="tasks_completed"
                    fill="#111827"
                    radius={[0, 4, 4, 0]}
                    name="Completed"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gray-200 max-w-7xl mx-auto"></div>

      {/* Response Time Trend */}
      <section className="py-24 md:py-32 px-5">
        <div className="max-w-[1600px] mx-auto">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-gray-900 mb-16 text-center">
            Response Time Trend
          </h2>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}s`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${(value / 1000).toFixed(2)}s`, 'Response Time']}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_response_time_ms"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Footer Whitespace */}
      <div className="py-24"></div>
    </div>
  )
}

// Mock data generators
function generateMockDailyStats(period: Period): DailyStats[] {
  const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
  const stats: DailyStats[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    stats.push({
      date: date.toISOString().split('T')[0],
      tasks_completed: Math.floor(Math.random() * 50) + 30,
      tasks_failed: Math.floor(Math.random() * 5),
      agents_active: Math.floor(Math.random() * 8) + 6,
      avg_response_time_ms: Math.floor(Math.random() * 2000) + 500,
    })
  }

  return stats
}

function generateMockAgentPerformance(): AgentPerformanceMetric[] {
  const agents = [
    'CodeGen',
    'Review',
    'Coordinator',
    'PR Agent',
    'Issue Agent',
    'Deploy',
  ]

  return agents.map((name, index) => ({
    agent_id: `agent-${index + 1}`,
    agent_name: name,
    tasks_completed: Math.floor(Math.random() * 100) + 20,
    tasks_failed: Math.floor(Math.random() * 10),
    avg_duration_ms: Math.floor(Math.random() * 5000) + 1000,
    success_rate: 85 + Math.random() * 15,
  }))
}
