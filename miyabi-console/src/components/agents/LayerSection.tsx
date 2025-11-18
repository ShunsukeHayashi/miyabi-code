import { Card, CardHeader, CardBody, Divider } from '@heroui/react'
import type { Agent } from '@/types/agent'
import AgentCard from './AgentCard'

interface LayerSectionProps {
  layer: number
  layerName: string
  agents: Agent[]
  onAgentSelect: (agent: Agent) => void
}

export default function LayerSection({
  layer,
  layerName,
  agents,
  onAgentSelect,
}: LayerSectionProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
            {layer}
          </div>
          <div>
            <h2 className="text-xl font-bold">{layerName}</h2>
            <p className="text-sm text-gray-500">{agents.length} agent{agents.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </CardHeader>
      <Divider className="my-4" />
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => onAgentSelect(agent)}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
