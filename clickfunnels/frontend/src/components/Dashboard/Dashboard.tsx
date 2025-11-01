import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, TrendingUp, Users, DollarSign, AlertCircle, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

const Dashboard = () => {
  const { data: apiResponse, isLoading, error } = useQuery({
    queryKey: ['clickfunnels-teams'],
    queryFn: () => api.getTeams(),
    retry: 1,
  })

  console.log('Teams API Response:', apiResponse)
  console.log('Error:', error)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ClickFunnels data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Connection Error</h2>
          <p className="mt-2 text-sm text-gray-600">
            Failed to connect to ClickFunnels API. Please check your credentials.
          </p>
          <pre className="mt-4 text-xs text-left bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  // Handle both array and {data: []} response formats
  const teams = Array.isArray(apiResponse) ? apiResponse : (apiResponse?.data || [])
  const stats = [
    {
      name: 'Teams',
      value: teams.length || 0,
      icon: LayoutDashboard,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Visits',
      value: '12,543',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      name: 'Conversions',
      value: '1,234',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      name: 'Revenue',
      value: '$45,231',
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <Link
              to="/ai-funnel-builder"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              AI自動ファネル作成
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ClickFunnels Teams */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              ClickFunnels Teams
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {teams.length > 0 ? (
              teams.map((team: any) => (
                <div
                  key={team.id}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {team.name || team.attributes?.name || 'Unnamed Team'}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        ID: {team.id}
                      </p>
                      {team.memberships && (
                        <p className="text-xs text-gray-400 mt-1">
                          👥 {team.memberships.length} member{team.memberships.length !== 1 ? 's' : ''}
                          {team.time_zone && ` • 🌍 ${team.time_zone}`}
                        </p>
                      )}
                    </div>
                    {team.billing_subscriptions && team.billing_subscriptions.length > 0 && (
                      <div className="ml-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ {team.billing_subscriptions[0].status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-12 text-center text-gray-500">
                <LayoutDashboard className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">No teams found</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Members Section */}
        {teams.length > 0 && teams[0].memberships && (
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Team Members ({teams[0].memberships.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {teams[0].memberships.slice(0, 5).map((member: any, index: number) => (
                <div key={member.id || index} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {member.user?.first_name || member.user_first_name} {member.user?.last_name || member.user_last_name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {member.user?.email || member.user_email}
                      </p>
                      {member.role_ids && member.role_ids.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {member.role_ids.map((role: string) => (
                            <span
                              key={role}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw API Response (Debug) - Collapsed */}
        <details className="mt-8 bg-gray-100 rounded-lg p-4">
          <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
            🔍 API Response (Debug)
          </summary>
          <pre className="text-xs overflow-auto max-h-96 mt-2">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </details>
      </main>
    </div>
  )
}

export default Dashboard
