import { Card, CardBody, CardHeader, Chip, Divider, Code } from '@heroui/react'
import type { TerraformExecution } from '@/types/deployment'

interface TerraformProgressProps {
  execution: TerraformExecution
}

const PHASE_LABELS: Record<string, string> = {
  init: 'Initializing',
  plan: 'Planning',
  apply: 'Applying',
  validate: 'Validating',
  complete: 'Complete',
}

export default function TerraformProgress({ execution }: TerraformProgressProps) {
  const isExecuting = execution.status === 'in_progress'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <div>
              <h3 className="text-lg font-semibold">Terraform Execution</h3>
              <Code size="sm" className="mt-1">{execution.command}</Code>
            </div>
          </div>
          <Chip
            color={isExecuting ? 'primary' : 'success'}
            variant="flat"
            className={isExecuting ? 'animate-pulse' : ''}
          >
            {PHASE_LABELS[execution.phase]}
          </Chip>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-4">
        {/* Resource Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-success/10 rounded-lg">
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-2xl font-bold text-success">{execution.resourcesCreated}</p>
          </div>
          <div className="p-3 bg-warning/10 rounded-lg">
            <p className="text-sm text-gray-500">Updated</p>
            <p className="text-2xl font-bold text-warning">{execution.resourcesUpdated}</p>
          </div>
          <div className="p-3 bg-danger/10 rounded-lg">
            <p className="text-sm text-gray-500">Destroyed</p>
            <p className="text-2xl font-bold text-danger">{execution.resourcesDestroyed}</p>
          </div>
        </div>

        {/* Execution Output */}
        <div>
          <p className="text-sm font-semibold mb-2">Terraform Output</p>
          <div className="bg-black/90 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
            {execution.output.map((line, idx) => (
              <div key={idx} className="mb-1">
                {line}
              </div>
            ))}
            {isExecuting && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Executing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Timing */}
        {execution.duration && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Duration</span>
            <span className="font-medium">{Math.floor(execution.duration / 60)}m {execution.duration % 60}s</span>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
