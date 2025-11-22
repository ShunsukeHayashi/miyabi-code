import LayerSection from '@/components/agents/LayerSection'
import { apiClient, handleApiError } from '@/lib/api/client'
import type { Agent, AgentsPageState } from '@/types/agent'
import { Button, Spinner } from '@heroui/react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'

// Lazy load modal component
const AgentDetailModal = lazy(() => import('@/components/agents/AgentDetailModal'))

const LAYER_NAMES: Record<number, string> = {
  0: 'Layer 0: Human (Guardian)',
  1: 'Layer 1: Maestro (Mobile Agents)',
  2: 'Layer 2: Orchestrator (Mac Agent)',
  3: 'Layer 3: Coordinators',
  4: 'Layer 4: Workers',
}

export default function AgentsPage() {
  const [state, setState] = useState<AgentsPageState>({
    agents: [],
    selectedAgent: null,
    isLoading: true,
    sortBy: 'name',
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Fetch agents on mount
  useEffect(() => {
    fetchAgents()
  }, [])

  // Real-time polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAgents()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchAgents = async () => {
    try {
      setError(null)
      const agents = await apiClient.getAgents()
      setState((prev) => ({ ...prev, agents, isLoading: false }))
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
      console.error('Failed to fetch agents:', apiError)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const handleAgentSelect = (agent: Agent) => {
    setState((prev) => ({ ...prev, selectedAgent: agent }))
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  // Group agents by layer
  const agentsByLayer = state.agents.reduce((acc, agent) => {
    if (!acc[agent.layer]) {
      acc[agent.layer] = []
    }
    acc[agent.layer].push(agent)
    return acc
  }, {} as Record<number, Agent[]>)

  // Sort layers
  const sortedLayers = Object.keys(agentsByLayer)
    .map(Number)
    .sort((a, b) => a - b)

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading agents..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-5 py-12 space-y-12">
        {/* Header - Ive Style */}
        <div className="text-center py-16 border-b border-gray-100">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extralight tracking-tighter text-gray-900 leading-none mb-4">
            Agents
          </h1>
          <div className="h-px w-16 bg-gray-300 mx-auto mb-8"></div>
          <p className="text-lg md:text-xl text-gray-500 font-light max-w-2xl mx-auto">
            Manage and monitor your autonomous agents
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="flat"
            onClick={fetchAgents}
            startContent={<RefreshCw className={`w-4 h-4 ${state.isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm flex-1">{error}</p>
              <Button
                size="sm"
                variant="flat"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Stats Overview - Ive Style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
              Total Agents
            </p>
            <p className="text-5xl md:text-6xl font-extralight text-gray-900 leading-none">
              {state.agents.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
              Active
            </p>
            <p className="text-5xl md:text-6xl font-extralight text-green-600 leading-none">
              {state.agents.filter((a) => a.status === 'active').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
              Idle
            </p>
            <p className="text-5xl md:text-6xl font-extralight text-yellow-600 leading-none">
              {state.agents.filter((a) => a.status === 'idle').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
              Error/Offline
            </p>
            <p className="text-5xl md:text-6xl font-extralight text-red-600 leading-none">
              {state.agents.filter((a) => a.status === 'error' || a.status === 'offline').length}
            </p>
          </div>
        </div>

        {/* Section Divider */}
        <div className="h-px bg-gray-200"></div>

        {/* Agents by Layer */}
        <div className="space-y-12">
          {sortedLayers.map((layer) => (
            <LayerSection
              key={layer}
              layer={layer}
              layerName={LAYER_NAMES[layer] || `Layer ${layer}`}
              agents={agentsByLayer[layer]}
              onAgentSelect={handleAgentSelect}
            />
          ))}

          {state.agents.length === 0 && (
            <div className="text-center py-24">
              <p className="text-gray-500 text-lg font-light">
                No agents found. Please check your API connection.
              </p>
            </div>
          )}
        </div>

        {/* Agent Detail Modal - Lazy loaded */}
        {state.selectedAgent && (
          <Suspense fallback={null}>
            <AgentDetailModal
              agent={state.selectedAgent}
              isOpen={isModalOpen}
              onClose={handleModalClose}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}
