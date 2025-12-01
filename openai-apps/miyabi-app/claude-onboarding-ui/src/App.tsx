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
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
  BookOpen
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

type Step = 'loading' | 'github-connect' | 'select-repo' | 'creating' | 'complete'

const MCP_URL = 'https://mcp.miyabi-world.com'

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
  const [copied, setCopied] = useState(false)

  // Parse OAuth callback from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('access_token')
    const user = params.get('github_user')
    const code = params.get('code')

    if (accessToken) {
      setToken(accessToken)
      localStorage.setItem('miyabi_claude_token', accessToken)
      if (user) {
        setGithubUser(user)
        localStorage.setItem('miyabi_claude_github_user', user)
      }
      window.history.replaceState({}, '', window.location.pathname)
      setStep('select-repo')
    } else if (code) {
      // OAuth code received, exchange for token
      exchangeCodeForToken(code)
    } else {
      // Check localStorage
      const savedToken = localStorage.getItem('miyabi_claude_token')
      const savedUser = localStorage.getItem('miyabi_claude_github_user')
      if (savedToken) {
        setToken(savedToken)
        if (savedUser) setGithubUser(savedUser)
        setStep('select-repo')
      } else {
        setStep('github-connect')
      }
    }
  }, [])

  const exchangeCodeForToken = async (_code: string) => {
    try {
      // For Claude.ai OAuth flow, the token exchange happens server-side
      // Just show the connection step
      window.history.replaceState({}, '', window.location.pathname)
      setStep('github-connect')
    } catch {
      setError('Failed to complete authentication')
      setStep('github-connect')
    }
  }

  useEffect(() => {
    if (step === 'select-repo' && token) {
      loadRepos()
      checkExistingProjects()
    }
  }, [step, token])

  const checkExistingProjects = async () => {
    try {
      const response = await fetch(`${MCP_URL}/user/onboarding/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setExistingProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Failed to check projects:', err)
    }
  }

  const loadRepos = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${MCP_URL}/user/github/repos?per_page=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('miyabi_claude_token')
          setStep('github-connect')
          return
        }
        throw new Error('Failed to load repositories')
      }

      const data = await response.json()
      setRepos(data.repos || [])
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
      const response = await fetch(`${MCP_URL}/user/projects`, {
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
      setCreatedProject(data.project_name || selectedRepo.name)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setStep('select-repo')
    }
  }

  const startGitHubAuth = () => {
    // Redirect to OAuth authorize endpoint
    window.location.href = `${MCP_URL}/oauth/authorize?response_type=code&client_id=claude-web&redirect_uri=${encodeURIComponent(window.location.origin + '/claude-onboarding/')}&scope=mcp:tools&state=${Math.random().toString(36).slice(2)}&code_challenge=dummy&code_challenge_method=S256`
  }

  const copyMcpUrl = () => {
    navigator.clipboard.writeText(`${MCP_URL}/mcp`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const existingRepoNames = new Set(existingProjects.map(p => p.github_repo))

  // Loading state
  if (step === 'loading') {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <div className="loading-screen">
            <Loader2 className="spinner" size={48} />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // GitHub Connect step
  if (step === 'github-connect') {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <div className="onboarding-header">
            <Rocket size={40} className="header-icon" />
            <h1>Miyabi for Claude.ai</h1>
            <p>Connect your GitHub to use Miyabi MCP tools</p>
            <div className="claude-badge">
              <Sparkles size={14} />
              Claude.ai Web Integration
            </div>
          </div>

          <div className="step-indicator">
            <div className="step active">1</div>
            <div className="step">2</div>
            <div className="step">3</div>
          </div>

          <div className="github-connect">
            <div className="github-icon">
              <Github size={40} color="white" />
            </div>
            <h2>Connect GitHub Account</h2>
            <p>
              Miyabi needs access to your GitHub repositories to provide
              intelligent code assistance, issue management, and automated workflows.
            </p>
            <button className="btn-github" onClick={startGitHubAuth}>
              <Github size={20} />
              Connect with GitHub
            </button>
          </div>

          <div className="mcp-url-box">
            <label>MCP Server URL</label>
            <div className="url">
              <code>{MCP_URL}/mcp</code>
              <button className="btn-copy" onClick={copyMcpUrl}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="instructions">
            <h3><BookOpen size={18} /> How to Connect in Claude.ai</h3>
            <ol>
              <li>Open Claude.ai in your browser</li>
              <li>Go to <strong>Settings</strong> &rarr; <strong>Integrations</strong></li>
              <li>Click <strong>Add MCP Server</strong></li>
              <li>Paste the MCP URL: <code>{MCP_URL}/mcp</code></li>
              <li>Complete the GitHub OAuth authentication</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  // Complete step
  if (step === 'complete') {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <div className="step-indicator">
            <div className="step completed"><Check size={16} /></div>
            <div className="step completed"><Check size={16} /></div>
            <div className="step completed"><Check size={16} /></div>
          </div>

          <div className="complete-screen">
            <div className="success-icon">
              <Check size={64} />
            </div>
            <h1>Setup Complete!</h1>
            <p>Your project <strong>{createdProject}</strong> is ready to use with Claude.ai.</p>
            <p className="subtext">You can now use Miyabi MCP tools in your conversations.</p>

            <div className="mcp-url-box">
              <label>MCP Server URL (for Claude.ai)</label>
              <div className="url">
                <code>{MCP_URL}/mcp</code>
                <button className="btn-copy" onClick={copyMcpUrl}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="instructions">
              <h3><Sparkles size={18} /> Try These Commands in Claude.ai</h3>
              <ol>
                <li><code>Use git_status to check the repository</code></li>
                <li><code>List recent issues with list_issues</code></li>
                <li><code>Search the codebase for "TODO"</code></li>
                <li><code>Show me the project status</code></li>
              </ol>
            </div>

            <div className="onboarding-footer" style={{ justifyContent: 'center', marginTop: 24 }}>
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Open Claude.ai
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Creating step
  if (step === 'creating') {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <div className="loading-screen">
            <Loader2 className="spinner" size={48} />
            <p>Creating project...</p>
            <p className="subtext">Setting up sandbox and cloning repository</p>
          </div>
        </div>
      </div>
    )
  }

  // Select repo step
  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <Rocket size={40} className="header-icon" />
          <h1>Select Repository</h1>
          <p>Choose a GitHub repository to work with</p>
          {githubUser && (
            <div className="claude-badge">
              <Github size={14} />
              {githubUser}
            </div>
          )}
        </div>

        <div className="step-indicator">
          <div className="step completed"><Check size={16} /></div>
          <div className="step active">2</div>
          <div className="step">3</div>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>&times;</button>
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
            className="btn-secondary"
            onClick={() => setStep('github-connect')}
          >
            Back
          </button>
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
