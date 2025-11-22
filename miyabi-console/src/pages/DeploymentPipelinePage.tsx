import DeploymentLog from '@/components/deployment/DeploymentLog'
import DeploymentStageCard from '@/components/deployment/DeploymentStageCard'
import TerraformProgress from '@/components/deployment/TerraformProgress'
import ArchitectureOverview from '@/components/infrastructure/ArchitectureOverview'
import InfrastructureDiagram from '@/components/infrastructure/InfrastructureDiagram'
import { apiClient, DeploymentInfo, handleApiError } from '@/lib/api/client'
import { mockDeploymentTasks, mockTerraformExecution } from '@/lib/mockDeploymentData'
import type { InfrastructureTopology } from '@/types/infrastructure'
import type { PipelineState } from '@/types/deployment'
import { Button, Card, CardBody, Chip, Progress, Spinner } from '@heroui/react'
import { AlertCircle, Rocket } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DeploymentPipelinePage() {
  const [state, setState] = useState<PipelineState>({
    tasks: mockDeploymentTasks,
    currentTask: mockDeploymentTasks.find((t) => t.status === 'in_progress') || null,
    terraformExecution: mockTerraformExecution,
    isExecuting: true,
  })
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([])
  const [topology, setTopology] = useState<InfrastructureTopology | null>(null)
  const [topologyLoading, setTopologyLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch deployments from API
  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        setError(null)
        const data = await apiClient.getDeployments()
        setDeployments(data)
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        console.error('Failed to fetch deployments:', apiError)
      }
    }

    fetchDeployments()
    const interval = setInterval(fetchDeployments, 5000)
    return () => clearInterval(interval)
  }, [])

  // Fetch infrastructure topology from API
  useEffect(() => {
    const fetchTopology = async () => {
      try {
        setTopologyLoading(true)
        const data = await apiClient.getInfrastructureTopology()
        setTopology(data)
      } catch (err) {
        const apiError = handleApiError(err)
        console.error('Failed to fetch topology:', apiError)
      } finally {
        setTopologyLoading(false)
      }
    }

    fetchTopology()
  }, [])

  const handleTriggerDeploy = async (environment: string) => {
    setDeploying(true)
    try {
      await apiClient.triggerDeployment(environment)
      const data = await apiClient.getDeployments()
      setDeployments(data)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(`Failed to trigger deployment: ${apiError.message}`)
    } finally {
      setDeploying(false)
    }
  }

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
            color="primary"
            onClick={() => handleTriggerDeploy('staging')}
            isLoading={deploying}
            startContent={!deploying && <Rocket className="w-4 h-4" />}
          >
            Deploy Staging
          </Button>
          <Button
            size="sm"
            variant="flat"
            color={state.isExecuting ? 'danger' : 'success'}
          >
            {state.isExecuting ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm flex-1">{error}</p>
          <Button size="sm" variant="flat" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Recent Deployments */}
      {deployments.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-3">Recent Deployments</h3>
            <div className="space-y-2">
              {deployments.map((deploy) => (
                <div key={deploy.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <Chip
                      size="sm"
                      color={
                        deploy.status === 'success' ? 'success' :
                          deploy.status === 'running' ? 'primary' :
                            deploy.status === 'failed' ? 'danger' : 'default'
                      }
                      variant="flat"
                    >
                      {deploy.status}
                    </Chip>
                    <span className="font-medium">{deploy.name}</span>
                    <span className="text-sm text-gray-500">{deploy.environment}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(deploy.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

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
        {topologyLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : topology ? (
          <InfrastructureDiagram topology={topology} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load infrastructure topology
          </div>
        )}
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
