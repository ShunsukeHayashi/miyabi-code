import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { InfrastructureTopology, ResourceState } from '@/types/infrastructure'
import { Card, CardBody, Chip } from '@heroui/react'

interface InfrastructureDiagramProps {
  topology: InfrastructureTopology
}

const stateColors: Record<ResourceState, string> = {
  available: '#10b981', // green
  creating: '#f59e0b', // orange
  planned: '#9ca3af', // gray
  updating: '#3b82f6', // blue
  deleting: '#ef4444', // red
  failed: '#dc2626', // dark red
}

const CustomNode = ({ data }: any) => {
  const stateColorMap: Record<ResourceState, 'success' | 'warning' | 'default' | 'danger' | 'primary'> = {
    available: 'success',
    creating: 'warning',
    planned: 'default',
    updating: 'primary',
    deleting: 'danger',
    failed: 'danger',
  }

  const state = data.state as ResourceState

  return (
    <Card className="min-w-[180px] shadow-lg border-2" style={{ borderColor: data.borderColor }}>
      <CardBody className="p-3">
        <div className="flex items-start gap-2">
          <span className="text-2xl">{data.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-default-500 uppercase font-semibold">{data.type}</p>
            <p className="text-sm font-bold truncate" title={data.label}>
              {data.label}
            </p>
            {data.cidr && <p className="text-xs text-default-600 mt-1">{data.cidr}</p>}
            {data.az && <p className="text-xs text-default-500">{data.az}</p>}
          </div>
        </div>
        <div className="mt-2">
          <Chip size="sm" color={stateColorMap[state]} variant="flat" className="text-xs">
            {state}
          </Chip>
        </div>
      </CardBody>
    </Card>
  )
}

const nodeTypes = {
  custom: CustomNode,
}

export default function InfrastructureDiagram({ topology }: InfrastructureDiagramProps) {
  const getNodeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      vpc: '🏢',
      internet_gateway: '🌐',
      nat_gateway: '🔀',
      subnet: '🔷',
      security_group: '🛡️',
      ecs_cluster: '📦',
      ecs_service: '⚙️',
      alb: '⚖️',
      target_group: '🎯',
      rds: '🗄️',
      redis: '⚡',
      iam_role: '🔐',
    }
    return icons[type] || '📋'
  }

  const createNodes = (): Node[] => {
    const nodes: Node[] = []
    let yPos = 0

    // Guard against missing topology data
    if (!topology || !topology.vpc) {
      return nodes
    }

    // VPC (top center)
    nodes.push({
      id: topology.vpc.id,
      type: 'custom',
      position: { x: 600, y: yPos },
      data: {
        label: topology.vpc.name,
        type: 'VPC',
        icon: getNodeIcon('vpc'),
        state: topology.vpc.state,
        cidr: topology.vpc.cidr,
        borderColor: stateColors[topology.vpc.state] || '#9ca3af',
      },
    })

    yPos += 150

    // Internet Gateway
    if (topology.internetGateway) {
      nodes.push({
        id: topology.internetGateway.id,
        type: 'custom',
        position: { x: 600, y: yPos },
        data: {
          label: topology.internetGateway.name,
          type: 'Internet Gateway',
          icon: getNodeIcon('internet_gateway'),
          state: topology.internetGateway.state,
          borderColor: stateColors[topology.internetGateway.state],
        },
      })
    }

    yPos += 150;

    // Public Subnets (horizontal layout)
    (topology.publicSubnets || []).forEach((subnet, index) => {
      nodes.push({
        id: subnet.id,
        type: 'custom',
        position: { x: 200 + index * 400, y: yPos },
        data: {
          label: subnet.name,
          type: 'Public Subnet',
          icon: getNodeIcon('subnet'),
          state: subnet.state,
          cidr: subnet.cidr,
          az: subnet.availabilityZone,
          borderColor: stateColors[subnet.state] || '#9ca3af',
        },
      })
    })

    yPos += 150;

    // NAT Gateways
    (topology.natGateways || []).forEach((nat, index) => {
      nodes.push({
        id: nat.id,
        type: 'custom',
        position: { x: 300 + index * 400, y: yPos },
        data: {
          label: nat.name,
          type: 'NAT Gateway',
          icon: getNodeIcon('nat_gateway'),
          state: nat.state,
          borderColor: stateColors[nat.state] || '#9ca3af',
        },
      })
    })

    yPos += 150;

    // Private Subnets
    (topology.privateSubnets || []).forEach((subnet, index) => {
      nodes.push({
        id: subnet.id,
        type: 'custom',
        position: { x: 200 + index * 400, y: yPos },
        data: {
          label: subnet.name,
          type: 'Private Subnet',
          icon: getNodeIcon('subnet'),
          state: subnet.state,
          cidr: subnet.cidr,
          az: subnet.availabilityZone,
          borderColor: stateColors[subnet.state] || '#9ca3af',
        },
      })
    })

    yPos += 150;

    // Security Groups (compact layout)
    (topology.securityGroups || []).forEach((sg, index) => {
      nodes.push({
        id: sg.id,
        type: 'custom',
        position: { x: 100 + index * 280, y: yPos },
        data: {
          label: sg.name.replace('miyabi-', ''),
          type: 'Security Group',
          icon: getNodeIcon('security_group'),
          state: sg.state,
          borderColor: stateColors[sg.state] || '#9ca3af',
        },
      })
    })

    yPos += 150

    // Compute Layer (ECS, ALB)
    let xPos = 200
    if (topology.alb) {
      nodes.push({
        id: topology.alb.id,
        type: 'custom',
        position: { x: xPos, y: yPos },
        data: {
          label: topology.alb.name,
          type: 'Application Load Balancer',
          icon: getNodeIcon('alb'),
          state: topology.alb.state,
          borderColor: stateColors[topology.alb.state],
        },
      })
      xPos += 300
    }

    (topology.targetGroups || []).forEach((tg) => {
      nodes.push({
        id: tg.id,
        type: 'custom',
        position: { x: xPos, y: yPos },
        data: {
          label: tg.name.replace('miyabi-', ''),
          type: 'Target Group',
          icon: getNodeIcon('target_group'),
          state: tg.state,
          borderColor: stateColors[tg.state] || '#9ca3af',
        },
      })
      xPos += 280
    })

    if (topology.ecsCluster) {
      nodes.push({
        id: topology.ecsCluster.id,
        type: 'custom',
        position: { x: xPos, y: yPos },
        data: {
          label: topology.ecsCluster.name,
          type: 'ECS Cluster',
          icon: getNodeIcon('ecs_cluster'),
          state: topology.ecsCluster.state,
          borderColor: stateColors[topology.ecsCluster.state],
        },
      })
      xPos += 280
    }

    (topology.ecsServices || []).forEach((service) => {
      nodes.push({
        id: service.id,
        type: 'custom',
        position: { x: xPos, y: yPos },
        data: {
          label: service.name.replace('miyabi-', ''),
          type: 'ECS Service',
          icon: getNodeIcon('ecs_service'),
          state: service.state,
          borderColor: stateColors[service.state] || '#9ca3af',
        },
      })
      xPos += 280
    })

    yPos += 150

    // Data Layer
    xPos = 300
    ;(topology.databases || []).forEach((db) => {
      nodes.push({
        id: db.id,
        type: 'custom',
        position: { x: xPos, y: yPos },
        data: {
          label: db.name,
          type: 'RDS PostgreSQL',
          icon: getNodeIcon('rds'),
          state: db.state,
          borderColor: stateColors[db.state] || '#9ca3af',
        },
      })
      xPos += 350
    });

    (topology.caches || []).forEach((cache) => {
      nodes.push({
        id: cache.id,
        type: 'custom',
        position: { x: xPos, y: yPos },
        data: {
          label: cache.name,
          type: 'Redis Cache',
          icon: getNodeIcon('redis'),
          state: cache.state,
          borderColor: stateColors[cache.state] || '#9ca3af',
        },
      })
      xPos += 350
    })

    yPos += 150

    // IAM Roles
    xPos = 400
    ;(topology.iamRoles || []).forEach((role) => {
      nodes.push({
        id: role.id,
        type: 'custom',
        position: { x: xPos, y: yPos },
        data: {
          label: role.name.replace('miyabi-', ''),
          type: 'IAM Role',
          icon: getNodeIcon('iam_role'),
          state: role.state,
          borderColor: stateColors[role.state] || '#9ca3af',
        },
      })
      xPos += 320
    })

    return nodes
  }

  const createEdges = (): Edge[] => {
    const edges: Edge[] = []

    // Guard against missing topology data
    if (!topology || !topology.vpc) {
      return edges
    }

    // VPC to Internet Gateway
    if (topology.internetGateway) {
      edges.push({
        id: `${topology.vpc.id}-${topology.internetGateway.id}`,
        source: topology.vpc.id,
        target: topology.internetGateway.id,
        type: 'smoothstep',
        animated: topology.internetGateway.state === 'available',
        style: { stroke: stateColors[topology.internetGateway.state] || '#9ca3af', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: stateColors[topology.internetGateway.state] || '#9ca3af' },
      })

      // Internet Gateway to Public Subnets
      const igw = topology.internetGateway
      ;(topology.publicSubnets || []).forEach((subnet) => {
        edges.push({
          id: `${igw.id}-${subnet.id}`,
          source: igw.id,
          target: subnet.id,
          type: 'smoothstep',
          animated: subnet.state === 'available',
          style: { stroke: stateColors[subnet.state] || '#9ca3af', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: stateColors[subnet.state] || '#9ca3af' },
        })
      })
    }

    // Public Subnets to NAT Gateways
    const publicSubnets = topology.publicSubnets || []
    ;(topology.natGateways || []).forEach((nat, index) => {
      if (publicSubnets[index]) {
        edges.push({
          id: `${publicSubnets[index].id}-${nat.id}`,
          source: publicSubnets[index].id,
          target: nat.id,
          type: 'smoothstep',
          animated: nat.state === 'creating',
          style: { stroke: stateColors[nat.state] || '#9ca3af', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: stateColors[nat.state] || '#9ca3af' },
        })
      }
    })

    // NAT Gateways to Private Subnets
    ;(topology.natGateways || []).forEach((nat) => {
      ;(topology.privateSubnets || []).forEach((subnet) => {
        edges.push({
          id: `${nat.id}-${subnet.id}`,
          source: nat.id,
          target: subnet.id,
          type: 'smoothstep',
          animated: nat.state === 'creating',
          style: { stroke: stateColors[subnet.state] || '#9ca3af', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: stateColors[subnet.state] || '#9ca3af' },
        })
      })
    })

    // Security Group connections
    ;(topology.securityGroups || []).forEach((sg) => {
      if (sg.connections) {
        sg.connections.forEach((connId) => {
          edges.push({
            id: `${sg.id}-${connId}`,
            source: sg.id,
            target: connId,
            type: 'smoothstep',
            style: { stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5,5' },
          })
        })
      }
    })

    return edges
  }

  const [nodes, , onNodesChange] = useNodesState(createNodes())
  const [edges, , onEdgesChange] = useEdgesState(createEdges())

  return (
    <div className="w-full h-[800px] border-2 border-default-200 rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any
            return data.borderColor || '#e5e7eb'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  )
}
