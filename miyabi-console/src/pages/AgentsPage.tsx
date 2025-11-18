import { useState, useEffect } from 'react'
import { Card, CardBody, Spinner, Button } from '@heroui/react'
import { apiClient } from '@/lib/api/client'
import type { Agent, AgentsPageState } from '@/types/agent'
import LayerSection from '@/components/agents/LayerSection'
import AgentDetailModal from '@/components/agents/AgentDetailModal'

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agents Management</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            onClick={fetchAgents}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Total Agents</p>
            <p className="text-2xl font-bold">{state.agents.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-success">
              {state.agents.filter((a) => a.status === 'active').length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Idle</p>
            <p className="text-2xl font-bold text-warning">
              {state.agents.filter((a) => a.status === 'idle').length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Error/Offline</p>
            <p className="text-2xl font-bold text-danger">
              {state.agents.filter((a) => a.status === 'error' || a.status === 'offline').length}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Agents by Layer */}
      <div className="space-y-6">
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
          <Card>
            <CardBody>
              <p className="text-center text-gray-500 py-12">
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
