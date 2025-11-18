import { Card, CardBody, CardHeader, Progress, Chip, Divider } from '@heroui/react'
import type { DeploymentTask, DeploymentStatus } from '@/types/deployment'

interface DeploymentStageCardProps {
  task: DeploymentTask
  isActive?: boolean
}

const STATUS_CONFIG: Record<
  DeploymentStatus,
  { color: 'success' | 'primary' | 'warning' | 'danger' | 'default'; label: string; icon: string }
> = {
  completed: { color: 'success', label: 'Completed', icon: '✅' },
  in_progress: { color: 'primary', label: 'In Progress', icon: '⚙️' },
  pending: { color: 'default', label: 'Pending', icon: '⏳' },
  failed: { color: 'danger', label: 'Failed', icon: '❌' },
  blocked: { color: 'warning', label: 'Blocked', icon: '🚫' },
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

export default function DeploymentStageCard({ task, isActive }: DeploymentStageCardProps) {
  const statusConfig = STATUS_CONFIG[task.status]

  return (
    <Card className={isActive ? 'border-2 border-primary shadow-lg' : ''}>
      <CardHeader className="flex gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
          {task.day}
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-md font-semibold">
                {statusConfig.icon} {task.title}
              </p>
              <p className="text-sm text-gray-500">
                Issue #{task.issueNumber} • Owner: {task.owner}
              </p>
            </div>
            <Chip color={statusConfig.color} variant="flat" size="sm">
              {statusConfig.label}
            </Chip>
          </div>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{task.progress}%</span>
          </div>
          <Progress
            value={task.progress}
            color={statusConfig.color}
            size="md"
            className="max-w-full"
          />
        </div>

        {/* Resources */}
        {task.resources.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Resources ({task.resources.length})</p>
            <div className="space-y-1">
              {task.resources.slice(0, 3).map((resource, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {resource.type}: {resource.name}
                  </span>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={resource.status === 'available' ? 'success' : 'warning'}
                  >
                    {resource.status}
                  </Chip>
                </div>
              ))}
              {task.resources.length > 3 && (
                <p className="text-sm text-gray-500">
                  + {task.resources.length - 3} more resources
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timing Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {task.startTime && (
            <div>
              <p className="text-gray-500">Started</p>
              <p className="font-medium">{new Date(task.startTime).toLocaleTimeString()}</p>
            </div>
          )}
          {task.duration && (
            <div>
              <p className="text-gray-500">Duration</p>
              <p className="font-medium">{formatDuration(task.duration)}</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {task.errorMessage && (
          <div className="p-3 bg-danger/10 border border-danger rounded-lg">
            <p className="text-sm text-danger font-medium">Error: {task.errorMessage}</p>
          </div>
        )}

        {/* Latest Logs */}
        {task.logs.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Latest Activity</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {task.logs.slice(-3).map((log, idx) => (
                <div key={idx} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  {' | '}
                  <span
                    className={
                      log.level === 'error'
                        ? 'text-danger'
                        : log.level === 'success'
                        ? 'text-success'
                        : log.level === 'warn'
                        ? 'text-warning'
                        : 'text-gray-700 dark:text-gray-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
