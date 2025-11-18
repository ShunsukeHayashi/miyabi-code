import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  EdgeProps,
  getBezierPath,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { DatabaseSchema, Entity } from '@/types/database'
import { Card, CardBody, CardHeader, Chip, Divider } from '@heroui/react'

interface DatabaseERDProps {
  schema: DatabaseSchema
}

const categoryColors = {
  core: '#3b82f6', // blue
  processing: '#10b981', // green
  output: '#f59e0b', // orange
  workflow: '#8b5cf6', // purple
}

const EntityNode = ({ data }: any) => {
  const entity = data.entity as Entity
  const categoryColorMap = {
    core: 'primary',
    processing: 'success',
    output: 'warning',
    workflow: 'secondary',
  } as const

  return (
    <Card className="min-w-[280px] shadow-xl border-2" style={{ borderColor: categoryColors[entity.category] }}>
      <CardHeader className="pb-2" style={{ backgroundColor: `${categoryColors[entity.category]}15` }}>
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold">{entity.id}: {entity.name}</h3>
            <Chip size="sm" color={categoryColorMap[entity.category]} variant="flat">
              {entity.category}
            </Chip>
          </div>
          <p className="text-xs text-default-500">{entity.description}</p>
          {entity.recordCount && (
            <p className="text-xs text-default-400 mt-1">
              📊 {entity.recordCount.toLocaleString()} records
            </p>
          )}
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="p-2">
        <div className="space-y-1">
          {entity.fields.slice(0, 5).map((field, idx) => (
            <div
              key={idx}
              className="text-xs p-1 rounded hover:bg-default-100 transition-colors flex items-center gap-1"
            >
              {field.primaryKey && <span className="text-warning font-bold">🔑</span>}
              {field.foreignKey && <span className="text-primary font-bold">🔗</span>}
              <span className={field.primaryKey ? 'font-bold' : ''}>
                {field.name}
              </span>
              <span className="text-default-400">: {field.type}</span>
              {field.nullable && <span className="text-default-300 text-[10px]">?</span>}
            </div>
          ))}
          {entity.fields.length > 5 && (
            <p className="text-[10px] text-default-400 text-center">
              +{entity.fields.length - 5} more fields...
            </p>
          )}
        </div>
      </CardBody>
      <Divider />
      <div className="px-2 py-1 bg-default-50">
        <p className="text-[10px] text-default-500 truncate" title={entity.rustType}>
          {entity.rustType}
        </p>
      </div>
    </Card>
  )
}

// Custom Edge Component for ERD relationships
const RelationshipEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const relationshipType = data?.relationshipType || '1:N'
  const isHighStrength = data?.isHighStrength || false
  const color = isHighStrength ? '#3b82f6' : '#9ca3af'
  const label = data?.label || ''

  // Calculate label position (midpoint)
  const labelX = (sourceX + targetX) / 2
  const labelY = (sourceY + targetY) / 2

  // Marker IDs based on relationship type and strength
  const getMarkerIds = () => {
    const suffix = isHighStrength ? '' : '-low'
    switch (relationshipType) {
      case '1:1':
        return {
          start: `url(#arrow-start${suffix})`,
          end: `url(#arrow-end${suffix})`,
        }
      case '1:N':
        return {
          start: `url(#arrow-start${suffix})`,
          end: `url(#crowsfoot-end${suffix})`,
        }
      case 'N:N':
        return {
          start: `url(#crowsfoot-start${suffix})`,
          end: `url(#crowsfoot-end${suffix})`,
        }
      default:
        return {
          start: undefined,
          end: `url(#arrow-end${suffix})`,
        }
    }
  }

  const markers = getMarkerIds()

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={isHighStrength ? 3 : 2}
        stroke={color}
        fill="none"
        strokeDasharray={isHighStrength ? undefined : '5,5'}
        markerStart={markers.start}
        markerEnd={markers.end}
        style={style}
      />
      {label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x="-40"
            y="-10"
            width="80"
            height="20"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
            rx="4"
          />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              fill: '#374151',
            }}
          >
            {label}
          </text>
        </g>
      )}
    </>
  )
}

const nodeTypes = {
  entity: EntityNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
}

export default function DatabaseERD({ schema }: DatabaseERDProps) {
  const createNodes = (): Node[] => {
    const nodes: Node[] = []

    // Layout configuration
    const categoryPositions = {
      core: { x: 200, y: 100 },
      processing: { x: 800, y: 100 },
      output: { x: 1400, y: 100 },
      workflow: { x: 800, y: 600 },
    }

    const categoryCounts = {
      core: 0,
      processing: 0,
      output: 0,
      workflow: 0,
    }

    schema.entities.forEach((entity) => {
      const category = entity.category
      const basePos = categoryPositions[category]
      const count = categoryCounts[category]

      nodes.push({
        id: entity.id,
        type: 'entity',
        position: {
          x: basePos.x,
          y: basePos.y + count * 320,
        },
        data: { entity },
      })

      categoryCounts[category]++
    })

    return nodes
  }

  const createEdges = (): Edge[] => {
    return schema.relations.map((relation) => {
      const isHighStrength = relation.strength === 'high'

      return {
        id: relation.id,
        source: relation.from,
        target: relation.to,
        type: 'relationship',
        animated: isHighStrength,
        data: {
          relationshipType: relation.relationshipType,
          isHighStrength,
          label: `${relation.label} (${relation.relationshipType})`,
        },
      }
    })
  }

  const [nodes, , onNodesChange] = useNodesState(createNodes())
  const [edges, , onEdgesChange] = useEdgesState(createEdges())

  return (
    <div className="w-full h-[900px] border-2 border-default-200 rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <svg>
          <defs>
            {/* Crow's foot marker for high priority relationships - END marker */}
            <marker
              id="crowsfoot-end"
              markerWidth="20"
              markerHeight="20"
              refX="20"
              refY="10"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M 0 5 L 10 10 L 0 15 M 10 10 L 20 5 M 10 10 L 20 15"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
              />
            </marker>
            {/* Crow's foot marker for low priority relationships - END marker */}
            <marker
              id="crowsfoot-end-low"
              markerWidth="20"
              markerHeight="20"
              refX="20"
              refY="10"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M 0 5 L 10 10 L 0 15 M 10 10 L 20 5 M 10 10 L 20 15"
                stroke="#9ca3af"
                strokeWidth="2"
                fill="none"
              />
            </marker>
            {/* Crow's foot marker for high priority relationships - START marker */}
            <marker
              id="crowsfoot-start"
              markerWidth="20"
              markerHeight="20"
              refX="0"
              refY="10"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M 20 5 L 10 10 L 20 15 M 10 10 L 0 5 M 10 10 L 0 15"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
              />
            </marker>
            {/* Crow's foot marker for low priority relationships - START marker */}
            <marker
              id="crowsfoot-start-low"
              markerWidth="20"
              markerHeight="20"
              refX="0"
              refY="10"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M 20 5 L 10 10 L 20 15 M 10 10 L 0 5 M 10 10 L 0 15"
                stroke="#9ca3af"
                strokeWidth="2"
                fill="none"
              />
            </marker>
            {/* Arrow marker for high priority - START */}
            <marker
              id="arrow-start"
              markerWidth="10"
              markerHeight="10"
              refX="0"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 10 0 L 0 5 L 10 10 z" fill="#3b82f6" />
            </marker>
            {/* Arrow marker for low priority - START */}
            <marker
              id="arrow-start-low"
              markerWidth="10"
              markerHeight="10"
              refX="0"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 10 0 L 0 5 L 10 10 z" fill="#9ca3af" />
            </marker>
            {/* Arrow marker for high priority - END */}
            <marker
              id="arrow-end"
              markerWidth="10"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
            {/* Arrow marker for low priority - END */}
            <marker
              id="arrow-end-low"
              markerWidth="10"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
            </marker>
          </defs>
        </svg>
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const entity = node.data.entity as Entity
            return categoryColors[entity.category]
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  )
}
