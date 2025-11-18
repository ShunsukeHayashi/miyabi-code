import { Card, CardBody, CardHeader, Chip } from '@heroui/react'
import type { LogEntry } from '@/types/deployment'

interface DeploymentLogProps {
  logs: LogEntry[]
}

const LEVEL_CONFIG = {
  info: { color: 'default' as const, icon: 'ℹ️' },
  warn: { color: 'warning' as const, icon: '⚠️' },
  error: { color: 'danger' as const, icon: '❌' },
  success: { color: 'success' as const, icon: '✅' },
}

export default function DeploymentLog({ logs }: DeploymentLogProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📋</span>
          <h3 className="text-lg font-semibold">Real-time Deployment Logs</h3>
          <Chip size="sm" variant="flat">
            {logs.length} entries
          </Chip>
        </div>
      </CardHeader>
      <CardBody>
        <div className="bg-black/90 text-gray-300 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No logs available</p>
          ) : (
            logs.map((log, idx) => {
              const config = LEVEL_CONFIG[log.level]
              return (
                <div key={idx} className="mb-2 flex items-start gap-2">
                  <span className="text-gray-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="shrink-0">{config.icon}</span>
                  {log.source && (
                    <span className="text-blue-400 shrink-0">[{log.source}]</span>
                  )}
                  <span
                    className={
                      log.level === 'error'
                        ? 'text-red-400'
                        : log.level === 'success'
                        ? 'text-green-400'
                        : log.level === 'warn'
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              )
            })
          )}
          {logs.length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-700">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400">Live</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
