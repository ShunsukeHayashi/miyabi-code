import AgentDetailModal from '@/components/agents/AgentDetailModal'
import LayerSection from '@/components/agents/LayerSection'
import { apiClient } from '@/lib/api/client'
import type { Agent, AgentsPageState } from '@/types/agent'
import { Button, Card, CardBody, Spinner } from '@heroui/react'
import { useEffect, useState } from 'react'

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
      const agents = await apiClient.getAgents()
      setState((prev) => ({ ...prev, agents, isLoading: false }))
    } catch (error) {
      console.error('Failed to fetch agents:', error)
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-5xl font-light tracking-tight text-gray-900 leading-tight">
            Agents
          </h1>
          <p className="text-base text-gray-600 font-light mt-2">
            {state.agents.length} agents across {sortedLayers.length} layers
          </p>
        </div>
        <Button
          size="sm"
          variant="flat"
          onClick={fetchAgents}
          className="w-full sm:w-auto"
        >
          🔄 Refresh
        </Button>
      </div>

      {/* Stats Overview - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardBody className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl sm:text-2xl font-light text-gray-900">{state.agents.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardBody className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-xl sm:text-2xl font-light text-blue-600">
              {state.agents.filter((a) => a.status === 'active').length}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardBody className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Idle</p>
            <p className="text-xl sm:text-2xl font-light text-gray-900">
              {state.agents.filter((a) => a.status === 'idle').length}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardBody className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Error</p>
            <p className="text-xl sm:text-2xl font-light text-gray-900">
              {state.agents.filter((a) => a.status === 'error' || a.status === 'offline').length}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Agents by Layer */}
      <div className="space-y-4 sm:space-y-6">
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
          <Card className="bg-white shadow-sm">
            <CardBody>
              <p className="text-center text-gray-500 py-8 sm:py-12 text-sm sm:text-base">
                No agents found. Please check your API connection.
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Agent Detail Modal */}
      {state.selectedAgent && (
        <AgentDetailModal
          agent={state.selectedAgent}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}
