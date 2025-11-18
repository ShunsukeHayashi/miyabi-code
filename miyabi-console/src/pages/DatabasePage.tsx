import { useState } from 'react'
import { Card, CardBody, CardHeader, Chip, Tabs, Tab, Divider } from '@heroui/react'
import { miyabiDatabaseSchema } from '@/lib/mockDatabaseData'
import DatabaseERD from '@/components/database/DatabaseERD'

export default function DatabasePage() {
  const [selectedTab, setSelectedTab] = useState<string>('erd')

  const totalRecords = miyabiDatabaseSchema.entities.reduce(
    (sum, e) => sum + (e.recordCount || 0),
    0
  )

  const entitiesByCategory = miyabiDatabaseSchema.entities.reduce((acc, entity) => {
    if (!acc[entity.category]) {
      acc[entity.category] = []
    }
    acc[entity.category].push(entity)
    return acc
  }, {} as Record<string, typeof miyabiDatabaseSchema.entities>)

  const categoryColors = {
    core: 'primary',
    processing: 'success',
    output: 'warning',
    workflow: 'secondary',
  } as const

  const relationsByStrength = {
    high: miyabiDatabaseSchema.relations.filter((r) => r.strength === 'high').length,
    low: miyabiDatabaseSchema.relations.filter((r) => r.strength === 'low').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🗄️ Database Schema & ERD</h1>
        <p className="text-gray-500 mt-1">
          Miyabi Entity-Relation Model - 12 Entities, 27 Relationships
        </p>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-500">Total Entities</p>
            <p className="text-3xl font-bold text-primary">
              {miyabiDatabaseSchema.entities.length}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-500">Total Relations</p>
            <p className="text-3xl font-bold text-success">
              {miyabiDatabaseSchema.relations.length}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-3xl font-bold text-warning">
              {totalRecords.toLocaleString()}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-500">High Priority Relations</p>
            <p className="text-3xl font-bold text-danger">{relationsByStrength.high}</p>
          </CardBody>
        </Card>
      </div>

      {/* Entity Categories Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <h3 className="text-lg font-bold">📊 Entity Categories</h3>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid md:grid-cols-4 gap-4">
            {Object.entries(entitiesByCategory).map(([category, entities]) => (
              <div key={category} className="p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Chip
                    size="sm"
                    color={categoryColors[category as keyof typeof categoryColors]}
                    variant="flat"
                  >
                    {category.toUpperCase()}
                  </Chip>
                  <span className="text-2xl font-bold">{entities.length}</span>
                </div>
                <div className="space-y-1 mt-3">
                  {entities.map((e) => (
                    <div key={e.id} className="text-xs text-default-600">
                      • {e.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Main Content */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        size="lg"
        aria-label="Database views"
      >
        <Tab key="erd" title="🎨 Entity-Relationship Diagram">
          <div className="mt-4 space-y-4">
            {/* Relationship Arrow Legend */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <h3 className="text-sm font-bold">🔍 Relationship Arrow Legend</h3>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <svg width="60" height="30" viewBox="0 0 60 30">
                      <defs>
                        <marker
                          id="legend-arrow"
                          markerWidth="8"
                          markerHeight="8"
                          refX="4"
                          refY="4"
                          orient="auto"
                        >
                          <path d="M 0 0 L 8 4 L 0 8 z" fill="#3b82f6" />
                        </marker>
                      </defs>
                      <line
                        x1="5"
                        y1="15"
                        x2="55"
                        y2="15"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        markerStart="url(#legend-arrow)"
                        markerEnd="url(#legend-arrow)"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-primary">1:1 Relationship</p>
                      <p className="text-[10px] text-default-500">
                        Arrow on both ends
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <svg width="60" height="30" viewBox="0 0 60 30">
                      <defs>
                        <marker
                          id="legend-arrow-start"
                          markerWidth="8"
                          markerHeight="8"
                          refX="4"
                          refY="4"
                          orient="auto"
                        >
                          <path d="M 0 0 L 8 4 L 0 8 z" fill="#10b981" />
                        </marker>
                        <marker
                          id="legend-crowsfoot"
                          markerWidth="12"
                          markerHeight="12"
                          refX="6"
                          refY="6"
                          orient="auto"
                        >
                          <path
                            d="M 0 3 L 6 6 L 0 9 M 6 6 L 12 3 M 6 6 L 12 9"
                            stroke="#10b981"
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </marker>
                      </defs>
                      <line
                        x1="5"
                        y1="15"
                        x2="55"
                        y2="15"
                        stroke="#10b981"
                        strokeWidth="2"
                        markerStart="url(#legend-arrow-start)"
                        markerEnd="url(#legend-crowsfoot)"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-success">1:N Relationship</p>
                      <p className="text-[10px] text-default-500">
                        Arrow → Crow's foot
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <svg width="60" height="30" viewBox="0 0 60 30">
                      <defs>
                        <marker
                          id="legend-crowsfoot-both"
                          markerWidth="12"
                          markerHeight="12"
                          refX="6"
                          refY="6"
                          orient="auto"
                        >
                          <path
                            d="M 0 3 L 6 6 L 0 9 M 6 6 L 12 3 M 6 6 L 12 9"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </marker>
                      </defs>
                      <line
                        x1="5"
                        y1="15"
                        x2="55"
                        y2="15"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        markerStart="url(#legend-crowsfoot-both)"
                        markerEnd="url(#legend-crowsfoot-both)"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-warning">N:N Relationship</p>
                      <p className="text-[10px] text-default-500">
                        Crow's foot on both ends
                      </p>
                    </div>
                  </div>
                </div>
                <Divider className="my-3" />
                <div className="flex items-center gap-6 justify-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 bg-primary rounded" />
                    <span className="text-default-600">
                      <strong>Solid line</strong>: High priority
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="32" height="4">
                      <line
                        x1="0"
                        y1="2"
                        x2="32"
                        y2="2"
                        stroke="#9ca3af"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    </svg>
                    <span className="text-default-600">
                      <strong>Dashed line</strong>: Low priority
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 bg-primary rounded animate-pulse" />
                    <span className="text-default-600">
                      <strong>Animated</strong>: High priority active
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <DatabaseERD schema={miyabiDatabaseSchema} />
          </div>
        </Tab>

        <Tab key="entities" title="📋 Entity Details">
          <div className="mt-4 space-y-4">
            {miyabiDatabaseSchema.entities.map((entity) => (
              <Card key={entity.id}>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <h3 className="text-lg font-bold">
                        {entity.id}: {entity.name}
                      </h3>
                      <p className="text-sm text-default-500">{entity.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip size="sm" color={categoryColors[entity.category]} variant="flat">
                        {entity.category}
                      </Chip>
                      {entity.recordCount && (
                        <Chip size="sm" variant="flat">
                          {entity.recordCount.toLocaleString()} records
                        </Chip>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody>
                  <div className="space-y-2">
                    <p className="text-xs text-default-500">
                      <strong>Rust Type:</strong> {entity.rustType}
                    </p>
                    <div>
                      <p className="text-sm font-semibold mb-2">Fields:</p>
                      <div className="grid md:grid-cols-2 gap-2">
                        {entity.fields.map((field, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-default-50 rounded text-xs flex items-center gap-2"
                          >
                            {field.primaryKey && <span className="text-warning">🔑</span>}
                            {field.foreignKey && (
                              <span className="text-primary">🔗 → {field.foreignKey}</span>
                            )}
                            <span className={field.primaryKey ? 'font-bold' : ''}>
                              {field.name}
                            </span>
                            <span className="text-default-400">: {field.type}</span>
                            {field.nullable && <span className="text-default-300">?</span>}
                            {field.description && (
                              <span className="text-default-400 italic ml-2">
                                // {field.description}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </Tab>

        <Tab key="relations" title="🔗 Relationships">
          <div className="mt-4 space-y-4">
            {['high', 'low'].map((strength) => (
              <div key={strength}>
                <h3 className="text-lg font-bold mb-3">
                  {strength === 'high' ? '🔴 High Priority' : '🟡 Low Priority'} Relationships
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {miyabiDatabaseSchema.relations
                    .filter((r) => r.strength === strength)
                    .map((relation) => {
                      const fromEntity = miyabiDatabaseSchema.entities.find(
                        (e) => e.id === relation.from
                      )
                      const toEntity = miyabiDatabaseSchema.entities.find(
                        (e) => e.id === relation.to
                      )
                      return (
                        <Card key={relation.id} className="bg-default-50">
                          <CardBody className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Chip size="sm" variant="flat">
                                {relation.id}
                              </Chip>
                              <Chip size="sm" color="primary" variant="flat">
                                {relation.relationshipType}
                              </Chip>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold">{fromEntity?.name}</span>
                              <span className="text-primary font-bold">→</span>
                              <span className="text-xs bg-white px-2 py-1 rounded">
                                {relation.label}
                              </span>
                              <span className="text-primary font-bold">→</span>
                              <span className="font-semibold">{toEntity?.name}</span>
                            </div>
                            <p className="text-xs text-default-500 mt-2">{relation.description}</p>
                          </CardBody>
                        </Card>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </Tab>

        <Tab key="statistics" title="📈 Statistics">
          <Card className="mt-4">
            <CardBody>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Record Distribution</h3>
                  <div className="space-y-2">
                    {miyabiDatabaseSchema.entities
                      .filter((e) => e.recordCount)
                      .sort((a, b) => (b.recordCount || 0) - (a.recordCount || 0))
                      .map((entity) => {
                        const percentage =
                          ((entity.recordCount || 0) / totalRecords) * 100
                        return (
                          <div key={entity.id}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>{entity.name}</span>
                              <span className="text-default-500">
                                {entity.recordCount?.toLocaleString()} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-default-100 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                <Divider />

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Relationship Type Distribution
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['1:1', '1:N', 'N:N'].map((type) => {
                      const count = miyabiDatabaseSchema.relations.filter(
                        (r) => r.relationshipType === type
                      ).length
                      return (
                        <div key={type} className="text-center p-4 bg-default-50 rounded-lg">
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-sm text-default-500">{type}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  )
}
