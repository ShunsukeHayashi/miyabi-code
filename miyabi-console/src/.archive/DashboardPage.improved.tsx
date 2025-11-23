import { Card, CardBody, CardHeader, Button, Chip, Progress } from '@heroui/react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ActivityFeed from '../components/ActivityFeed'

interface SystemStats {
  activeAgents: number
  totalAgents: number
  runningTasks: number
  completedToday: number
  apiStatus: 'healthy' | 'degraded' | 'down'
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<SystemStats>({
    activeAgents: 0,
    totalAgents: 14,
    runningTasks: 0,
    completedToday: 0,
    apiStatus: 'healthy',
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'healthy':
        return 'success'
      case 'degraded':
        return 'warning'
      case 'down':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getUsageColor = (usage: number): 'success' | 'warning' | 'danger' => {
    if (usage < 50) return 'success'
    if (usage < 80) return 'warning'
    return 'danger'
  }

  return (
    <div className="space-y-12">
      {/* Hero Header - Ive Style: Massive, Ultra-Light Title */}
      <div className="text-center py-16">
        <h1 className="text-7xl md:text-8xl lg:text-9xl font-extralight tracking-tighter text-gray-900 leading-none mb-4">
          Miyabi
        </h1>
        <div className="h-px w-32 bg-gray-300 mx-auto my-8"></div>
        <p className="text-2xl text-gray-600 font-light">
          System Overview
        </p>

        {/* Status Indicator - Minimal */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              stats.apiStatus === 'healthy' ? 'bg-gray-900' :
              stats.apiStatus === 'degraded' ? 'bg-gray-600' :
              'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-600 uppercase tracking-wide">
              {stats.apiStatus}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleTimeString('ja-JP')}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid - Clean Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="text-center py-12 border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300">
          <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide">Active Agents</p>
          <p className="text-6xl font-extralight text-gray-900 mb-2">
            {stats.activeAgents}
          </p>
          <p className="text-2xl font-extralight text-gray-400">
            of {stats.totalAgents}
          </p>
        </div>

        <div className="text-center py-12 border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300">
          <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide">Running</p>
          <p className="text-6xl font-extralight text-gray-900">
            {stats.runningTasks}
          </p>
        </div>

        <div className="text-center py-12 border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300">
          <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide">Completed</p>
          <p className="text-6xl font-extralight text-gray-900">
            {stats.completedToday}
          </p>
        </div>

        <div className="text-center py-12 border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300">
          <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide">Success</p>
          <p className="text-6xl font-extralight text-gray-900">
            98.5<span className="text-3xl text-gray-400">%</span>
          </p>
        </div>
      </div>

      {/* System Resources & Activity - Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* System Resources - Minimal Design */}
        <div className="space-y-8">
          <h2 className="text-4xl font-extralight tracking-tight text-gray-900">
            Resources
          </h2>

          <div className="space-y-8 pt-8">
            {/* CPU */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-light text-gray-900">CPU</span>
                <span className="text-3xl font-extralight text-gray-900">
                  {stats.cpuUsage.toFixed(1)}<span className="text-xl text-gray-400">%</span>
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all duration-200"
                  style={{ width: `${stats.cpuUsage}%` }}
                ></div>
              </div>
            </div>

            {/* Memory */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-light text-gray-900">Memory</span>
                <span className="text-3xl font-extralight text-gray-900">
                  {stats.memoryUsage.toFixed(1)}<span className="text-xl text-gray-400">%</span>
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all duration-200"
                  style={{ width: `${stats.memoryUsage}%` }}
                ></div>
              </div>
            </div>

            {/* Disk */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-light text-gray-900">Disk</span>
                <span className="text-3xl font-extralight text-gray-900">
                  {stats.diskUsage.toFixed(1)}<span className="text-xl text-gray-400">%</span>
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all duration-200"
                  style={{ width: `${stats.diskUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-8">
          <h2 className="text-4xl font-extralight tracking-tight text-gray-900">
            Activity
          </h2>
          <ActivityFeed />
        </div>
      </div>

      {/* Quick Actions - Text Only, No Emojis */}
      <div className="space-y-8">
        <h2 className="text-4xl font-extralight tracking-tight text-gray-900 text-center">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/agents"
            className="py-16 text-center border border-gray-200 bg-white hover:border-gray-900 transition-all duration-200 group"
          >
            <p className="text-2xl font-light text-gray-900 group-hover:text-gray-900">
              Agents
            </p>
          </Link>

          <Link
            to="/deployment"
            className="py-16 text-center border border-gray-200 bg-white hover:border-gray-900 transition-all duration-200 group"
          >
            <p className="text-2xl font-light text-gray-900 group-hover:text-gray-900">
              Deploy
            </p>
          </Link>

          <Link
            to="/infrastructure"
            className="py-16 text-center border border-gray-200 bg-white hover:border-gray-900 transition-all duration-200 group"
          >
            <p className="text-2xl font-light text-gray-900 group-hover:text-gray-900">
              Infrastructure
            </p>
          </Link>

          <Link
            to="/database"
            className="py-16 text-center border border-gray-200 bg-white hover:border-gray-900 transition-all duration-200 group"
          >
            <p className="text-2xl font-light text-gray-900 group-hover:text-gray-900">
              Database
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
