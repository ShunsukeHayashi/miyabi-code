import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Chip,
  Spinner,
} from '@heroui/react'
import type { Agent } from '@/types/agent'
import { apiClient } from '@/lib/api/client'
import AgentControls from './AgentControls'
import AgentMetricsChart from './AgentMetricsChart'

interface AgentDetailModalProps {
  agent: Agent
  isOpen: boolean
  onClose: () => void
}

export default function AgentDetailModal({
  agent,
  isOpen,
  onClose,
}: AgentDetailModalProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    if (isOpen && selectedTab === 'logs') {
      fetchLogs()
    }
  }, [isOpen, selectedTab, agent.id])

  const fetchLogs = async () => {
    setIsLoadingLogs(true)
    try {
      const logs = await apiClient.getAgentLogs(agent.id)
      setLogs(logs)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const statusColors = {
    active: 'success',
    idle: 'warning',
    error: 'danger',
    offline: 'default',
  } as const

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{agent.name}</h2>
                <Chip color={statusColors[agent.status]} variant="flat">
                  {agent.status.toUpperCase()}
                </Chip>
              </div>
              <p className="text-sm text-gray-500">Layer {agent.layer}</p>
            </ModalHeader>
            <ModalBody>
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
                aria-label="Agent details tabs"
                fullWidth
              >
                <Tab key="overview" title="Overview">
                  <div className="space-y-4 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Agent ID</p>
                        <p className="font-medium">{agent.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium capitalize">{agent.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Uptime</p>
                        <p className="font-medium">{Math.floor(agent.uptime / 3600)}h</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Layer</p>
                        <p className="font-medium">{agent.layer}</p>
                      </div>
                    </div>

                    {/* Task Statistics */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-3">Task Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Active Tasks</p>
                          <p className="text-2xl font-bold text-primary">{agent.tasks.active}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Completed Tasks</p>
                          <p className="text-2xl font-bold text-success">{agent.tasks.completed}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>

                <Tab key="metrics" title="Metrics">
                  <div className="py-4">
                    <AgentMetricsChart agent={agent} />
                  </div>
                </Tab>

                <Tab key="config" title="Configuration">
                  <div className="space-y-4 py-4">
                    <div>
                      <p className="text-sm text-gray-500">Max Concurrent Tasks</p>
                      <p className="font-medium">{agent.config.maxConcurrentTasks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Timeout (seconds)</p>
                      <p className="font-medium">{agent.config.timeoutSeconds}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Retry Attempts</p>
                      <p className="font-medium">{agent.config.retryAttempts}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Logging Enabled</p>
                      <p className="font-medium">{agent.config.enableLogging ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </Tab>

                <Tab key="logs" title="Logs">
                  <div className="py-4">
                    {isLoadingLogs ? (
                      <div className="flex justify-center py-8">
                        <Spinner />
                      </div>
                    ) : (
                      <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-xs font-mono">
                          {logs.length > 0 ? logs.join('\n') : 'No logs available'}
                        </pre>
                      </div>
                    )}
                  </div>
                </Tab>

                <Tab key="controls" title="Controls">
                  <div className="py-4">
                    <AgentControls agent={agent} />
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
