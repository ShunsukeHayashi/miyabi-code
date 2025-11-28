import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Activity,
  DollarSign,
  Server,
  Ban,
  CheckCircle,
  RefreshCw,
  LogOut,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react'
import './App.css'

// Types
interface User {
  user_id: string
  github_id?: string
  github_username: string | null
  email?: string | null
  plan: string | null
  status: string | null
  created_at: string
  last_active: string | null
}

interface Stats {
  total_users: number
  active_users?: number
  suspended_users?: number
  total_projects?: number
  active_sandboxes: number
  active_subscriptions?: number
  total_api_calls?: number
  total_tokens_used?: number
  plan_breakdown?: Record<string, number>
  recent_signups?: number
  usage_today?: {
    tool_calls: number
    tokens: number
  }
}

interface AdminState {
  isAuthenticated: boolean
  token: string
  users: User[]
  stats: Stats | null
  loading: boolean
  error: string | null
}

// API is on the same domain (served via /admin-ui/, API at root)
const API_BASE = ''

function App() {
  const [state, setState] = useState<AdminState>({
    isAuthenticated: false,
    token: localStorage.getItem('admin_token') || '',
    users: [],
    stats: null,
    loading: false,
    error: null,
  })

  const [tokenInput, setTokenInput] = useState('')
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard')

  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${state.token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    return response.json()
  }, [state.token])

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const [usersData, statsData] = await Promise.all([
        fetchWithAuth('/admin/users'),
        fetchWithAuth('/admin/stats'),
      ])
      setState(prev => ({
        ...prev,
        users: usersData.users || [],
        stats: statsData,
        loading: false,
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
        loading: false,
      }))
    }
  }, [fetchWithAuth])

  const handleLogin = async () => {
    if (!tokenInput.trim()) return

    localStorage.setItem('admin_token', tokenInput)
    setState(prev => ({ ...prev, token: tokenInput, isAuthenticated: true }))
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setState({
      isAuthenticated: false,
      token: '',
      users: [],
      stats: null,
      loading: false,
      error: null,
    })
  }

  const handleSuspendUser = async (userId: string) => {
    try {
      await fetchWithAuth(`/admin/user/${userId}/suspend`, { method: 'POST' })
      await loadData()
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to suspend user',
      }))
    }
  }

  const handleReactivateUser = async (userId: string) => {
    try {
      await fetchWithAuth(`/admin/user/${userId}/reactivate`, { method: 'POST' })
      await loadData()
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to reactivate user',
      }))
    }
  }

  const handleChangePlan = async (userId: string, newPlan: string) => {
    try {
      await fetchWithAuth(`/admin/user/${userId}/plan`, {
        method: 'POST',
        body: JSON.stringify({ plan: newPlan }),
      })
      await loadData()
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to change plan',
      }))
    }
  }

  useEffect(() => {
    if (state.token) {
      setState(prev => ({ ...prev, isAuthenticated: true }))
      loadData()
    }
  }, [state.token, loadData])

  if (!state.isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Shield size={48} />
            <h1>Miyabi Admin</h1>
            <p>Enter your admin token to continue</p>
          </div>
          <div className="login-form">
            <input
              type="password"
              placeholder="Admin Token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button onClick={handleLogin} className="btn-primary">
              Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Miyabi Admin</h2>
        </div>
        <ul className="nav-links">
          <li
            className={selectedTab === 'dashboard' ? 'active' : ''}
            onClick={() => setSelectedTab('dashboard')}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </li>
          <li
            className={selectedTab === 'users' ? 'active' : ''}
            onClick={() => setSelectedTab('users')}
          >
            <Users size={20} />
            <span>Users</span>
          </li>
          <li
            className={selectedTab === 'settings' ? 'active' : ''}
            onClick={() => setSelectedTab('settings')}
          >
            <Settings size={20} />
            <span>Settings</span>
          </li>
        </ul>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        <header className="content-header">
          <h1>
            {selectedTab === 'dashboard' && 'Dashboard'}
            {selectedTab === 'users' && 'User Management'}
            {selectedTab === 'settings' && 'Settings'}
          </h1>
          <button onClick={loadData} className="btn-refresh" disabled={state.loading}>
            <RefreshCw size={20} className={state.loading ? 'spinning' : ''} />
            Refresh
          </button>
        </header>

        {state.error && (
          <div className="error-banner">
            {state.error}
            <button onClick={() => setState(prev => ({ ...prev, error: null }))}>×</button>
          </div>
        )}

        {selectedTab === 'dashboard' && state.stats && (
          <div className="dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <h3>Total Users</h3>
                  <p className="stat-value">{state.stats.total_users}</p>
                  <span className="stat-detail">{state.stats.active_subscriptions || 0} active subscriptions</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon active">
                  <Activity size={24} />
                </div>
                <div className="stat-content">
                  <h3>API Calls</h3>
                  <p className="stat-value">{(state.stats.total_api_calls || 0).toLocaleString()}</p>
                  <span className="stat-detail">Total API calls</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon projects">
                  <Server size={24} />
                </div>
                <div className="stat-content">
                  <h3>Sandboxes</h3>
                  <p className="stat-value">{state.stats.active_sandboxes}</p>
                  <span className="stat-detail">Active sandboxes</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon revenue">
                  <DollarSign size={24} />
                </div>
                <div className="stat-content">
                  <h3>Tokens Used</h3>
                  <p className="stat-value">{(state.stats.total_tokens_used || 0).toLocaleString()}</p>
                  <span className="stat-detail">Total tokens consumed</span>
                </div>
              </div>
            </div>

            {state.stats.plan_breakdown && Object.keys(state.stats.plan_breakdown).length > 0 && (
              <div className="charts-section">
                <div className="chart-card">
                  <h3>Plan Distribution</h3>
                  <div className="plan-bars">
                    {Object.entries(state.stats.plan_breakdown).map(([plan, count]) => (
                      <div key={plan} className="plan-bar">
                        <span className="plan-name">{plan}</span>
                        <div className="bar-container">
                          <div
                            className={`bar ${plan}`}
                            style={{ width: `${(count / state.stats!.total_users) * 100}%` }}
                          />
                        </div>
                        <span className="plan-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="users-section">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.users.map((user) => (
                  <tr key={user.user_id}>
                    <td>
                      <div className="user-info">
                        {user.github_username ? (
                          <img
                            src={`https://github.com/${user.github_username}.png`}
                            alt={user.github_username}
                            className="user-avatar"
                          />
                        ) : (
                          <div className="user-avatar placeholder">?</div>
                        )}
                        <div>
                          <span className="username">{user.github_username || 'Unknown'}</span>
                          <span className="user-id">{user.user_id.slice(0, 16)}...</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.email || '-'}</td>
                    <td>
                      <select
                        value={user.plan || 'free'}
                        onChange={(e) => handleChangePlan(user.user_id, e.target.value)}
                        className={`plan-select ${user.plan || 'free'}`}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${user.status || 'active'}`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>{user.last_active ? new Date(user.last_active).toLocaleDateString() : '-'}</td>
                    <td>
                      {user.status !== 'suspended' ? (
                        <button
                          onClick={() => handleSuspendUser(user.user_id)}
                          className="btn-action suspend"
                          title="Suspend User"
                        >
                          <Ban size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateUser(user.user_id)}
                          className="btn-action reactivate"
                          title="Reactivate User"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="settings-section">
            <div className="settings-card">
              <h3>Server Configuration</h3>
              <div className="settings-group">
                <label>API Endpoint</label>
                <input type="text" value="https://mcp.miyabi-world.com" disabled />
              </div>
              <div className="settings-group">
                <label>Sandbox Mode</label>
                <input type="text" value="Enabled" disabled />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
