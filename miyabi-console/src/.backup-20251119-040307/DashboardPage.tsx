import { Card, CardBody, CardHeader, Button, Chip, Progress, Switch } from '@heroui/react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ActivityFeed from '../components/ActivityFeed'
import DynamicUIOrchestrator from '../components/dynamic-ui/DynamicUIOrchestrator'
import { heroUIColorMapping } from '../design-system/colors'

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
  const [useAdaptiveUI, setUseAdaptiveUI] = useState(false)

  useEffect(() => {
    // Fetch system stats from API
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/v1/infrastructure/status')
        if (response.ok) {
          const data = await response.json()
          setStats({
            ...stats,
            // Map infrastructure data to stats
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return heroUIColorMapping.success
      case 'degraded':
        return heroUIColorMapping.warning
      case 'down':
        return heroUIColorMapping.error
      default:
        return 'default'
    }
  }

  const getUsageColor = (usage: number) => {
    if (usage < 50) return heroUIColorMapping.success
    if (usage < 80) return heroUIColorMapping.warning
    return heroUIColorMapping.error
  }

  // If Adaptive UI is enabled, use Dynamic UI Orchestrator
  if (useAdaptiveUI) {
    return (
      <div className="relative">
        {/* Toggle button overlay */}
        <div className="fixed top-4 right-4 z-50">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Adaptive UI
                </span>
                <Switch
                  isSelected={useAdaptiveUI}
                  onValueChange={setUseAdaptiveUI}
                  color="primary"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Dynamic UI Orchestrator */}
        <DynamicUIOrchestrator
          prompt="Create an impactful, visually stunning dashboard that shows the Miyabi system status. Use bold typography, smooth animations, and clear visual hierarchy. Show active agents, system resources, and recent activity in an engaging way."
          adaptive={false}
          onAction={(actionType, payload) => {
            console.log('[Dashboard] Action:', actionType, payload)
            // Handle actions here
          }}
        />
      </div>
    )
  }

  // Standard static UI
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Adaptive UI Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-light tracking-tight text-gray-900 leading-tight">
            Dashboard
          </h1>
          <p className="text-base text-gray-600 font-light mt-2">
            Miyabi System Overview
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Chip color={getStatusColor(stats.apiStatus)} variant="flat" size="sm">
            API: {stats.apiStatus.toUpperCase()}
          </Chip>
          <Chip color="primary" variant="flat" size="sm">
            {new Date().toLocaleTimeString('ja-JP')}
          </Chip>

          {/* Adaptive UI Toggle */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-700">
                  ✨ Adaptive UI
                </span>
                <Switch
                  isSelected={useAdaptiveUI}
                  onValueChange={setUseAdaptiveUI}
                  color="secondary"
                  size="sm"
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardBody className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">Active Agents</p>
            <p className="text-2xl sm:text-3xl font-light text-gray-900">
              {stats.activeAgents}<span className="text-gray-400">/{stats.totalAgents}</span>
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardBody className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">Running Tasks</p>
            <p className="text-2xl sm:text-3xl font-light text-blue-600">
              {stats.runningTasks}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardBody className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">Completed Today</p>
            <p className="text-2xl sm:text-3xl font-light text-gray-900">
              {stats.completedToday}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardBody className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">Success Rate</p>
            <p className="text-2xl sm:text-3xl font-light text-gray-900">
              98.5%
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Two Column Layout for Resources and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* System Resources */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <h2 className="text-lg sm:text-xl font-normal text-gray-900">System Resources</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">CPU Usage</span>
                <span className="text-gray-500">{stats.cpuUsage.toFixed(1)}%</span>
              </div>
              <Progress
                value={stats.cpuUsage}
                color={getUsageColor(stats.cpuUsage)}
                size="sm"
                className="max-w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Memory Usage</span>
                <span className="text-gray-500">{stats.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress
                value={stats.memoryUsage}
                color={getUsageColor(stats.memoryUsage)}
                size="sm"
                className="max-w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Disk Usage</span>
                <span className="text-gray-500">{stats.diskUsage.toFixed(1)}%</span>
              </div>
              <Progress
                value={stats.diskUsage}
                color={getUsageColor(stats.diskUsage)}
                size="sm"
                className="max-w-full"
              />
            </div>
          </CardBody>
        </Card>

        {/* Activity Feed */}
        <ActivityFeed />
      </div>

      {/* Quick Actions */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-2 sm:pb-3">
          <h2 className="text-lg sm:text-xl font-normal text-gray-900">Quick Actions</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Button
              as={Link}
              to="/agents"
              color="primary"
              variant="flat"
              className="h-auto py-3 sm:py-4"
              fullWidth
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg sm:text-xl">🤖</span>
                <span className="text-xs sm:text-sm">View Agents</span>
              </div>
            </Button>

            <Button
              as={Link}
              to="/deployment"
              color="success"
              variant="flat"
              className="h-auto py-3 sm:py-4"
              fullWidth
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg sm:text-xl">🚀</span>
                <span className="text-xs sm:text-sm">Deploy</span>
              </div>
            </Button>

            <Button
              as={Link}
              to="/infrastructure"
              color="warning"
              variant="flat"
              className="h-auto py-3 sm:py-4"
              fullWidth
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg sm:text-xl">⚙️</span>
                <span className="text-xs sm:text-sm">Infrastructure</span>
              </div>
            </Button>

            <Button
              as={Link}
              to="/database"
              color="secondary"
              variant="flat"
              className="h-auto py-3 sm:py-4"
              fullWidth
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg sm:text-xl">💾</span>
                <span className="text-xs sm:text-sm">Database</span>
              </div>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
