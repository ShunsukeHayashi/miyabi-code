import { Card, CardBody } from '@heroui/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Agent } from '@/types/agent'

interface AgentMetricsChartProps {
  agent: Agent
}

export default function AgentMetricsChart({ agent }: AgentMetricsChartProps) {
  const data = [
    {
      name: 'CPU Usage',
      value: agent.metrics.cpuUsage,
      unit: '%',
    },
    {
      name: 'Memory Usage',
      value: agent.metrics.memoryUsage,
      unit: '%',
    },
    {
      name: 'Task Completion Rate',
      value: agent.metrics.taskCompletionRate,
      unit: '%',
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="value" fill="#6366F1" name="Value (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Average Task Duration</p>
            <p className="text-2xl font-bold">
              {agent.metrics.averageTaskDuration.toFixed(1)}s
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-2xl font-bold text-success">
              {agent.metrics.taskCompletionRate.toFixed(1)}%
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
