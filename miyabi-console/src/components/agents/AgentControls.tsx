import { useState } from 'react'
import { Button, Card, CardBody } from '@heroui/react'
import type { Agent } from '@/types/agent'
import { apiClient } from '@/lib/api/client'

interface AgentControlsProps {
  agent: Agent
}

export default function AgentControls({ agent }: AgentControlsProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleStart = async () => {
    setIsStarting(true)
    setMessage(null)
    try {
      await apiClient.startAgent(agent.id)
      setMessage({ type: 'success', text: `Agent ${agent.name} started successfully` })
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to start agent: ${error}` })
    } finally {
      setIsStarting(false)
    }
  }

  const handleStop = async () => {
    setIsStopping(true)
    setMessage(null)
    try {
      await apiClient.stopAgent(agent.id)
      setMessage({ type: 'success', text: `Agent ${agent.name} stopped successfully` })
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to stop agent: ${error}` })
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Agent Controls</h3>
            <p className="text-sm text-gray-500">
              Manage the lifecycle of this agent. Use with caution in production.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              color="success"
              isLoading={isStarting}
              isDisabled={agent.status === 'active' || isStopping}
              onPress={handleStart}
            >
              Start Agent
            </Button>
            <Button
              color="danger"
              isLoading={isStopping}
              isDisabled={agent.status === 'offline' || isStarting}
              onPress={handleStop}
            >
              Stop Agent
            </Button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-danger/10 text-danger'
              }`}
            >
              {message.text}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-2">Current Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-medium capitalize">{agent.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Active Tasks:</span>
              <span className="font-medium">{agent.tasks.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CPU Usage:</span>
              <span className="font-medium">{agent.metrics.cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Memory Usage:</span>
              <span className="font-medium">{agent.metrics.memoryUsage.toFixed(1)}%</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
