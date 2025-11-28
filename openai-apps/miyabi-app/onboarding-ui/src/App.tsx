import { useState, useEffect, useCallback } from 'react'
import {
  GitBranch,
  Lock,
  Globe,
  Check,
  Loader2,
  ArrowRight,
  Rocket,
  Github,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import './App.css'

interface Repo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  clone_url: string
  default_branch: string
  language: string | null
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

interface Project {
  project_name: string
  github_repo: string
  created_at: string
}

type Step = 'loading' | 'select-repo' | 'creating' | 'complete'

function App() {
  const [step, setStep] = useState<Step>('loading')
  const [token, setToken] = useState<string>('')
  const [githubUser, setGithubUser] = useState<string>('')
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingProjects, setExistingProjects] = useState<Project[]>([])
  const [createdProject, setCreatedProject] = useState<string | null>(null)

  // Parse token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('access_token')
    const user = params.get('github_user')

    if (accessToken) {
      setToken(accessToken)
      localStorage.setItem('miyabi_token', accessToken)
      if (user) {
        setGithubUser(user)
        localStorage.setItem('miyabi_github_user', user)
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    } else {
      // Try to get from localStorage
      const savedToken = localStorage.getItem('miyabi_token')
      const savedUser = localStorage.getItem('miyabi_github_user')
      if (savedToken) {
        setToken(savedToken)
        if (savedUser) setGithubUser(savedUser)
      } else {
        // No token, redirect to login
        window.location.href = '/auth/github/login'
        return
      }
    }
  }, [])

  // Check onboarding status once we have token
  useEffect(() => {
    if (!token) return

    const checkStatus = async () => {
      try {
        const response = await fetch('/user/onboarding/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('miyabi_token')
            window.location.href = '/auth/github/login'
            return
          }
          throw new Error('Failed to check status')
        }

        const data = await response.json()
        setExistingProjects(data.projects || [])

        if (data.completed && data.project_count > 0) {
          // Already has projects, redirect to dashboard
          window.location.href = '/admin-ui/'
          return
        }

        // Load repos for selection
        setStep('select-repo')
        loadRepos()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStep('select-repo')
      }
    }

    checkStatus()
  }, [token])

  const loadRepos = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/user/github/repos?per_page=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to load repositories')
      }

      const data = await response.json()
      setRepos(data.repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repos')
    } finally {
      setLoading(false)
    }
  }, [token])

  const createProject = async () => {
    if (!selectedRepo || !token) return

    setStep('creating')
    setError(null)

    try {
      const response = await fetch('/user/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repo_full_name: selectedRepo.full_name,
          project_name: selectedRepo.name
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to create project')
      }

      const data = await response.json()
      setCreatedProject(data.project_name)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setStep('select-repo')
    }
  }

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const existingRepoNames = new Set(existingProjects.map(p => p.github_repo))

  if (step === 'loading') {
    return (
      <div className="onboarding-container">
        <div className="loading-screen">
          <Loader2 className="spinner" size={48} />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="onboarding-container">
        <div className="complete-screen">
          <div className="success-icon">
            <Check size={64} />
          </div>
          <h1>Project Created!</h1>
          <p>Your project <strong>{createdProject}</strong> is ready to use.</p>
          <p className="subtext">You can now use Miyabi MCP tools with this repository.</p>
          <button
            className="btn-primary"
            onClick={() => window.location.href = '/admin-ui/'}
          >
            Go to Dashboard
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    )
  }

  if (step === 'creating') {
    return (
      <div className="onboarding-container">
        <div className="loading-screen">
          <Loader2 className="spinner" size={48} />
          <p>Creating project...</p>
          <p className="subtext">Setting up sandbox and cloning repository</p>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <Rocket size={40} className="header-icon" />
          <h1>Welcome to Miyabi</h1>
          <p>Select a GitHub repository to get started</p>
          {githubUser && (
            <div className="user-badge">
              <Github size={16} />
              <span>{githubUser}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="btn-icon"
            onClick={loadRepos}
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
        </div>

        <div className="repos-list">
          {loading ? (
            <div className="loading-repos">
              <Loader2 className="spinner" size={24} />
              <span>Loading repositories...</span>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="no-repos">
              <p>No repositories found</p>
            </div>
          ) : (
            filteredRepos.map(repo => {
              const alreadyAdded = existingRepoNames.has(repo.full_name)
              const isSelected = selectedRepo && selectedRepo.id === repo.id
              return (
                <div
                  key={repo.id}
                  className={`repo-item ${isSelected ? 'selected' : ''} ${alreadyAdded ? 'disabled' : ''}`}
                  onClick={() => !alreadyAdded && setSelectedRepo(repo)}
                >
                  <div className="repo-icon">
                    {repo.private ? <Lock size={20} /> : <Globe size={20} />}
                  </div>
                  <div className="repo-info">
                    <div className="repo-name">
                      <span className="owner">{repo.owner.login}/</span>
                      <span className="name">{repo.name}</span>
                    </div>
                    {repo.description && (
                      <p className="repo-description">{repo.description}</p>
                    )}
                    <div className="repo-meta">
                      {repo.language && <span className="language">{repo.language}</span>}
                      <span className="branch">
                        <GitBranch size={14} />
                        {repo.default_branch}
                      </span>
                    </div>
                  </div>
                  {alreadyAdded ? (
                    <div className="already-added">
                      <Check size={20} />
                      Added
                    </div>
                  ) : isSelected ? (
                    <div className="selected-check">
                      <Check size={20} />
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>

        <div className="onboarding-footer">
          <button
            className="btn-primary"
            disabled={!selectedRepo}
            onClick={createProject}
          >
            Create Project
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
