import { useState, useEffect } from 'react'
import { Card, CardBody, Progress, Chip, Button } from '@heroui/react'
import type { PipelineState } from '@/types/deployment'
import { mockDeploymentTasks, mockTerraformExecution } from '@/lib/mockDeploymentData'
import { mockInfrastructureTopology } from '@/lib/mockInfrastructureData'
import DeploymentStageCard from '@/components/deployment/DeploymentStageCard'
import TerraformProgress from '@/components/deployment/TerraformProgress'
import DeploymentLog from '@/components/deployment/DeploymentLog'
import InfrastructureDiagram from '@/components/infrastructure/InfrastructureDiagram'
import ArchitectureOverview from '@/components/infrastructure/ArchitectureOverview'

export default function DeploymentPipelinePage() {
  const [state, setState] = useState<PipelineState>({
    tasks: mockDeploymentTasks,
    currentTask: mockDeploymentTasks.find((t) => t.status === 'in_progress') || null,
    terraformExecution: mockTerraformExecution,
    isExecuting: true,
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const currentTask = prev.tasks.find((t) => t.status === 'in_progress')
        if (currentTask && currentTask.progress < 100) {
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === currentTask.id
                ? { ...t, progress: Math.min(t.progress + 5, 100) }
                : t
            ),
          }
        }
        return prev
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const overallProgress = Math.round(
    (state.tasks.reduce((sum, t) => sum + t.progress, 0) / state.tasks.length)
  )

  const tasksCompleted = state.tasks.filter((t) => t.status === 'completed').length
  const tasksInProgress = state.tasks.filter((t) => t.status === 'in_progress').length
  const tasksPending = state.tasks.filter((t) => t.status === 'pending' || t.status === 'blocked').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployment Pipeline</h1>
          <p className="text-gray-500 mt-1">M1 Infrastructure Blitz - 7-Day Deployment</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            color={state.isExecuting ? 'danger' : 'success'}
          >
            {state.isExecuting ? 'Pause' : 'Resume'}
          </Button>
          <Button size="sm" variant="flat">
            View Logs
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Overall Progress</h2>
            <Chip color={state.isExecuting ? 'primary' : 'default'} variant="flat">
              {state.isExecuting ? 'Deploying' : 'Paused'}
            </Chip>
          </div>
          <Progress
            value={overallProgress}
            color="primary"
            size="lg"
            showValueLabel
            className="max-w-full"
          />
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold">{state.tasks.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-success">{tasksCompleted}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-primary">{tasksInProgress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-warning">{tasksPending}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Current Task */}
      {state.currentTask && (
        <Card className="border-2 border-primary">
          <CardBody>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold">Currently Executing</h3>
            </div>
            <DeploymentStageCard task={state.currentTask} isActive />
          </CardBody>
        </Card>
      )}

      {/* Terraform Execution */}
      {state.terraformExecution && state.currentTask?.stage === 'vpc-networking' && (
        <TerraformProgress execution={state.terraformExecution} />
      )}

      {/* Architecture Overview */}
      <ArchitectureOverview />

      {/* Infrastructure Diagram */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">🎨 Infrastructure Architecture</h2>
          <Chip color="primary" variant="flat" size="sm">
            Interactive Diagram
          </Chip>
        </div>
        <InfrastructureDiagram topology={mockInfrastructureTopology} />
      </div>

      {/* Deployment Timeline */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Deployment Timeline</h2>
        <div className="space-y-4">
          {state.tasks.map((task) => (
            <DeploymentStageCard
              key={task.id}
              task={task}
              isActive={task.id === state.currentTask?.id}
            />
          ))}
        </div>
      </div>

      {/* Real-time Logs */}
      {state.currentTask && (
        <DeploymentLog logs={state.currentTask.logs} />
      )}
    </div>
  )
}
