import { Card, CardBody, CardFooter, Chip, Button } from '@heroui/react'
import type { Agent, AgentStatus } from '@/types/agent'

interface AgentCardProps {
  agent: Agent
  onClick: () => void
}

const STATUS_CONFIG: Record<
  AgentStatus,
  { color: 'success' | 'warning' | 'danger' | 'default'; label: string; icon: string }
> = {
  active: { color: 'success', label: 'Active', icon: '🟢' },
  idle: { color: 'warning', label: 'Idle', icon: '🟡' },
  error: { color: 'danger', label: 'Error', icon: '🔴' },
  offline: { color: 'default', label: 'Offline', icon: '⚪' },
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  return `${hours}h ${minutes}m`
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  const statusConfig = STATUS_CONFIG[agent.status]

  return (
    <Card
      isPressable
      onPress={onClick}
      className="hover:shadow-lg transition-shadow"
    >
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{statusConfig.icon}</span>
            <h3 className="font-semibold text-lg">{agent.name}</h3>
          </div>
          <Chip color={statusConfig.color} variant="flat" size="sm">
            {statusConfig.label}
          </Chip>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Uptime:</span>
            <span className="font-medium">{formatUptime(agent.uptime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Active Tasks:</span>
            <span className="font-medium text-primary">{agent.tasks.active}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Completed:</span>
            <span className="font-medium text-success">{agent.tasks.completed}</span>
          </div>
        </div>
      </CardBody>

      <CardFooter className="border-t border-divider">
        <Button
          size="sm"
          variant="light"
          color="primary"
          fullWidth
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
