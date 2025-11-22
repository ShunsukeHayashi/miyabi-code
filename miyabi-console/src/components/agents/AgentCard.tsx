import { Chip } from '@heroui/react'
import type { Agent, AgentStatus } from '@/types/agent'
import { memo } from 'react'

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

const AgentCard = memo(function AgentCard({ agent, onClick }: AgentCardProps) {
  const statusConfig = STATUS_CONFIG[agent.status]

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-2xl border border-black/5 p-6 transition-all duration-200 ease-in-out hover:border-black/10 hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{statusConfig.icon}</span>
            <h3 className="font-medium text-lg text-[#1D1D1F]">{agent.name}</h3>
          </div>
          <Chip color={statusConfig.color} variant="flat" size="sm">
            {statusConfig.label}
          </Chip>
        </div>

        {/* Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#86868B] font-light">Uptime:</span>
            <span className="font-normal text-[#1D1D1F]">{formatUptime(agent.uptime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#86868B] font-light">Active Tasks:</span>
            <span className="font-normal text-[#0066CC]">{agent.tasks.active}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#86868B] font-light">Completed:</span>
            <span className="font-normal text-green-600">{agent.tasks.completed}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-black/5">
          <span className="text-sm text-[#0066CC] font-medium group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </button>
  )
})

export default AgentCard
