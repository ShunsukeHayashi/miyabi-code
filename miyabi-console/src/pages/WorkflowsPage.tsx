import { handleApiError } from '@/lib/api/client'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
} from '@heroui/react'
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  AlertCircle,
  Clock,
  GitBranch,
  Loader2,
  Play,
  Plus,
  Save,
  Settings,
  Trash2,
  Webhook,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

// Types
interface Workflow {
  id: string
  name: string
  description: string
  enabled: boolean
  lastRun?: string
  nodes: Node[]
  edges: Edge[]
}

interface NodeData {
  label: string
  type: 'trigger' | 'action' | 'condition'
  config?: Record<string, unknown>
}

// Custom Node Components
function TriggerNode({ data }: { data: NodeData }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white min-w-[160px]">
      <Handle type="source" position={Position.Bottom} className="!bg-purple-300" />
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
    </div>
  )
}

function ActionNode({ data }: { data: NodeData }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[160px]">
      <Handle type="target" position={Position.Top} className="!bg-blue-300" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-300" />
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
    </div>
  )
}

function ConditionNode({ data }: { data: NodeData }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white min-w-[160px]">
      <Handle type="target" position={Position.Top} className="!bg-amber-300" />
      <Handle type="source" position={Position.Bottom} id="true" className="!bg-green-400 !left-[25%]" />
      <Handle type="source" position={Position.Bottom} id="false" className="!bg-red-400 !left-[75%]" />
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
}

// Node templates for palette
const nodeTemplates = {
  triggers: [
    { type: 'trigger', label: 'GitHub PR Created', icon: GitBranch },
    { type: 'trigger', label: 'Schedule (Cron)', icon: Clock },
    { type: 'trigger', label: 'Webhook', icon: Webhook },
    { type: 'trigger', label: 'Manual Trigger', icon: Play },
  ],
  actions: [
    { type: 'action', label: 'Run Tests', icon: Play },
    { type: 'action', label: 'Deploy', icon: Zap },
    { type: 'action', label: 'Send Notification', icon: AlertCircle },
    { type: 'action', label: 'Create Issue', icon: Plus },
    { type: 'action', label: 'Assign to Agent', icon: Settings },
  ],
  conditions: [
    { type: 'condition', label: 'If/Else', icon: GitBranch },
    { type: 'condition', label: 'Switch', icon: GitBranch },
  ],
}

// Initial nodes for demo
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { label: 'GitHub PR Created', type: 'trigger' },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 250, y: 150 },
    data: { label: 'Run Tests', type: 'action' },
  },
  {
    id: '3',
    type: 'condition',
    position: { x: 250, y: 250 },
    data: { label: 'Tests Pass?', type: 'condition' },
  },
  {
    id: '4',
    type: 'action',
    position: { x: 100, y: 350 },
    data: { label: 'Deploy to Staging', type: 'action' },
  },
  {
    id: '5',
    type: 'action',
    position: { x: 400, y: 350 },
    data: { label: 'Notify Team', type: 'action' },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4', sourceHandle: 'true', label: 'Pass' },
  { id: 'e3-5', source: '3', target: '5', sourceHandle: 'false', label: 'Fail' },
]

export default function WorkflowsPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure()
  const { isOpen: isNewOpen, onOpen: onNewOpen, onClose: onNewClose } = useDisclosure()

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
  })

  // Fetch workflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setError(null)
        // Mock data for now - would call apiClient.getWorkflows()
        const mockWorkflows: Workflow[] = [
          {
            id: '1',
            name: 'CI/CD Pipeline',
            description: 'Run tests and deploy on PR merge',
            enabled: true,
            lastRun: new Date().toISOString(),
            nodes: initialNodes,
            edges: initialEdges,
          },
          {
            id: '2',
            name: 'Issue Triage',
            description: 'Auto-label and assign issues',
            enabled: true,
            nodes: [],
            edges: [],
          },
          {
            id: '3',
            name: 'Nightly Build',
            description: 'Run full test suite every night',
            enabled: false,
            lastRun: new Date(Date.now() - 86400000).toISOString(),
            nodes: [],
            edges: [],
          },
        ]
        setWorkflows(mockWorkflows)
        setSelectedWorkflow(mockWorkflows[0])
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflows()
  }, [])

  // Handle edge connection
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    onConfigOpen()
  }, [onConfigOpen])

  // Add node from palette
  const addNode = useCallback((template: typeof nodeTemplates.triggers[0]) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: template.type,
      position: { x: 250, y: nodes.length * 100 + 50 },
      data: { label: template.label, type: template.type },
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes, setNodes])

  // Delete selected node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    onConfigClose()
  }, [setNodes, setEdges, onConfigClose])

  // Save workflow
  const saveWorkflow = async () => {
    if (!selectedWorkflow) return

    setSaving(true)
    try {
      // Would call apiClient.updateWorkflow()
      await new Promise((resolve) => setTimeout(resolve, 500))

      const updated = {
        ...selectedWorkflow,
        nodes,
        edges,
      }
      setWorkflows((wfs) => wfs.map((w) => (w.id === updated.id ? updated : w)))
      setSelectedWorkflow(updated)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    } finally {
      setSaving(false)
    }
  }

  // Execute workflow
  const executeWorkflow = async () => {
    if (!selectedWorkflow) return

    setExecuting(true)
    try {
      // Would call apiClient.executeWorkflow()
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const updated = {
        ...selectedWorkflow,
        lastRun: new Date().toISOString(),
      }
      setWorkflows((wfs) => wfs.map((w) => (w.id === updated.id ? updated : w)))
      setSelectedWorkflow(updated)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    } finally {
      setExecuting(false)
    }
  }

  // Create new workflow
  const createWorkflow = async () => {
    if (!newWorkflow.name) return

    try {
      const workflow: Workflow = {
        id: `workflow-${Date.now()}`,
        name: newWorkflow.name,
        description: newWorkflow.description,
        enabled: true,
        nodes: [],
        edges: [],
      }
      setWorkflows((wfs) => [...wfs, workflow])
      setSelectedWorkflow(workflow)
      setNodes([])
      setEdges([])
      setNewWorkflow({ name: '', description: '' })
      onNewClose()
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    }
  }

  // Load workflow
  const loadWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setNodes(workflow.nodes.length > 0 ? workflow.nodes : initialNodes)
    setEdges(workflow.edges.length > 0 ? workflow.edges : initialEdges)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Automation</h1>
          <p className="text-gray-500 mt-1">
            Create and manage automated workflows for your agents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="default"
            variant="flat"
            startContent={<Plus className="w-4 h-4" />}
            onPress={onNewOpen}
          >
            New Workflow
          </Button>
          <Button
            color="primary"
            startContent={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            onPress={saveWorkflow}
            isDisabled={!selectedWorkflow || saving}
          >
            Save
          </Button>
          <Button
            color="success"
            startContent={executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            onPress={executeWorkflow}
            isDisabled={!selectedWorkflow || executing}
          >
            Run
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardBody>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Workflow List Sidebar */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Workflows</h3>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-2">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedWorkflow?.id === workflow.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => loadWorkflow(workflow)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{workflow.name}</span>
                    <Chip
                      size="sm"
                      color={workflow.enabled ? 'success' : 'default'}
                      variant="flat"
                    >
                      {workflow.enabled ? 'Active' : 'Disabled'}
                    </Chip>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{workflow.description}</p>
                  {workflow.lastRun && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last run: {new Date(workflow.lastRun).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Node Palette */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Node Palette</h3>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Triggers</h4>
                <div className="space-y-1">
                  {nodeTemplates.triggers.map((template) => (
                    <Button
                      key={template.label}
                      size="sm"
                      variant="flat"
                      className="w-full justify-start"
                      startContent={<template.icon className="w-3 h-3" />}
                      onPress={() => addNode(template)}
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Divider />
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions</h4>
                <div className="space-y-1">
                  {nodeTemplates.actions.map((template) => (
                    <Button
                      key={template.label}
                      size="sm"
                      variant="flat"
                      className="w-full justify-start"
                      startContent={<template.icon className="w-3 h-3" />}
                      onPress={() => addNode(template)}
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Divider />
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Conditions</h4>
                <div className="space-y-1">
                  {nodeTemplates.conditions.map((template) => (
                    <Button
                      key={template.label}
                      size="sm"
                      variant="flat"
                      className="w-full justify-start"
                      startContent={<template.icon className="w-3 h-3" />}
                      onPress={() => addNode(template)}
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Workflow Canvas */}
        <div className="col-span-9">
          <Card className="h-[600px]">
            <CardBody className="p-0">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-gray-50"
              >
                <Controls />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Node Configuration Modal */}
      <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="lg">
        <ModalContent>
          <ModalHeader>Configure Node</ModalHeader>
          <ModalBody>
            {selectedNode && (
              <div className="space-y-4">
                <Input
                  label="Label"
                  value={selectedNode.data.label as string}
                  onChange={(e) => {
                    const newLabel = e.target.value
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, label: newLabel } }
                          : n
                      )
                    )
                    setSelectedNode({
                      ...selectedNode,
                      data: { ...selectedNode.data, label: newLabel },
                    })
                  }}
                />
                <Select
                  label="Node Type"
                  selectedKeys={[selectedNode.type || 'action']}
                  isDisabled
                >
                  <SelectItem key="trigger">Trigger</SelectItem>
                  <SelectItem key="action">Action</SelectItem>
                  <SelectItem key="condition">Condition</SelectItem>
                </Select>
                {selectedNode.type === 'trigger' && (
                  <Textarea
                    label="Trigger Configuration"
                    placeholder="e.g., cron: 0 0 * * *"
                  />
                )}
                {selectedNode.type === 'action' && (
                  <Textarea
                    label="Action Parameters"
                    placeholder="e.g., environment: staging"
                  />
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              startContent={<Trash2 className="w-4 h-4" />}
              onPress={() => selectedNode && deleteNode(selectedNode.id)}
            >
              Delete
            </Button>
            <Button color="primary" onPress={onConfigClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* New Workflow Modal */}
      <Modal isOpen={isNewOpen} onClose={onNewClose}>
        <ModalContent>
          <ModalHeader>Create New Workflow</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Workflow Name"
                placeholder="e.g., CI/CD Pipeline"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
              />
              <Textarea
                label="Description"
                placeholder="Describe what this workflow does..."
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onNewClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={createWorkflow}
              isDisabled={!newWorkflow.name}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
