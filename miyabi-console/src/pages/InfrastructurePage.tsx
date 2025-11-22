import { useState, useEffect, lazy, Suspense } from 'react'
import { Card, CardBody, Chip, Tabs, Tab, Spinner } from '@heroui/react'
import { apiClient, handleApiError } from '@/lib/api/client'
import InfrastructureTopologyView from '@/components/infrastructure/InfrastructureTopologyView'
import ArchitectureOverview from '@/components/infrastructure/ArchitectureOverview'
import type { ResourceState, InfrastructureTopology, InfrastructureResource } from '@/types/infrastructure'

// Lazy load heavy ReactFlow component
const InfrastructureDiagram = lazy(() => import('@/components/infrastructure/InfrastructureDiagram'))

// Loading fallback for diagram
function DiagramLoader() {
  return (
    <div className="flex items-center justify-center h-[600px] bg-default-50 rounded-lg">
      <Spinner size="lg" label="Loading diagram..." />
    </div>
  )
}

export default function InfrastructurePage() {
  const [selectedTab, setSelectedTab] = useState<string>('diagram')
  const [topology, setTopology] = useState<InfrastructureTopology | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopology = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.getInfrastructureTopology()
        setTopology(data)
      } catch (err) {
        const apiError = handleApiError(err)
        setError(apiError.message)
        console.error('Failed to fetch infrastructure topology:', apiError)
      } finally {
        setLoading(false)
      }
    }

    fetchTopology()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" label="Loading infrastructure data..." />
      </div>
    )
  }

  // Error state
  if (error || !topology) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Infrastructure</h1>
          <p className="text-gray-500 mt-1">AWS Infrastructure Overview - Development Environment</p>
        </div>
        <Card className="bg-danger-50">
          <CardBody>
            <p className="text-danger font-semibold">Failed to load infrastructure data</p>
            <p className="text-sm text-default-600 mt-1">{error || 'Unknown error occurred'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Retry
            </button>
          </CardBody>
        </Card>
      </div>
    )
  }

  // Calculate statistics
  const allResources = [
    topology.vpc,
    ...topology.publicSubnets,
    ...topology.privateSubnets,
    topology.internetGateway,
    ...topology.natGateways,
    ...topology.securityGroups,
    topology.ecsCluster,
    ...topology.ecsServices,
    topology.alb,
    ...topology.targetGroups,
    ...topology.databases,
    ...topology.caches,
    ...topology.iamRoles,
  ].filter((r): r is InfrastructureResource => r !== undefined && r !== null)

  const resourcesByState = allResources.reduce((acc, resource) => {
    if (resource) {
      acc[resource.state] = (acc[resource.state] || 0) + 1
    }
    return acc
  }, {} as Record<ResourceState, number>)

  const stateColorMap: Record<ResourceState, 'success' | 'warning' | 'default' | 'danger' | 'primary'> = {
    available: 'success',
    creating: 'warning',
    planned: 'default',
    updating: 'primary',
    deleting: 'danger',
    failed: 'danger',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Infrastructure</h1>
        <p className="text-gray-500 mt-1">AWS Infrastructure Overview - Development Environment</p>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-500">Total Resources</p>
            <p className="text-3xl font-bold">{allResources.length}</p>
          </CardBody>
        </Card>

        {Object.entries(resourcesByState).map(([state, count]) => (
          <Card key={state}>
            <CardBody className="text-center">
              <p className="text-sm text-gray-500 capitalize">{state}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-3xl font-bold">{count}</p>
                <Chip
                  size="sm"
                  color={stateColorMap[state as ResourceState]}
                  variant="dot"
                  className="ml-1"
                />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Architecture Overview */}
      <ArchitectureOverview />

      {/* Main Content */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        size="lg"
        aria-label="Infrastructure views"
      >
        <Tab key="diagram" title="🎨 Interactive Diagram">
          <div className="mt-4">
            <Suspense fallback={<DiagramLoader />}>
              <InfrastructureDiagram topology={topology} />
            </Suspense>
          </div>
        </Tab>

        <Tab key="topology" title="📊 Topology View">
          <div className="mt-4">
            <InfrastructureTopologyView topology={topology} />
          </div>
        </Tab>

        <Tab key="resources" title="Resources List">
          <Card className="mt-4">
            <CardBody>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">All Resources</h3>
                <div className="space-y-2">
                  {allResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{resource.name}</p>
                        <p className="text-sm text-default-500">
                          {resource.type.replace(/_/g, ' ').toUpperCase()} • {resource.id}
                        </p>
                        {resource.cidr && (
                          <p className="text-xs text-default-400 mt-1">{resource.cidr}</p>
                        )}
                      </div>
                      <Chip
                        size="sm"
                        color={stateColorMap[resource.state]}
                        variant="flat"
                      >
                        {resource.state}
                      </Chip>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="network" title="Network">
          <Card className="mt-4">
            <CardBody>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">VPC Configuration</h3>
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <p className="font-semibold">{topology.vpc.name}</p>
                    <p className="text-sm text-default-600 mt-1">
                      CIDR: {topology.vpc.cidr}
                    </p>
                    <p className="text-sm text-default-600">
                      Region: us-west-2
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Subnets</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-default-600 mb-2">Public Subnets</p>
                      <div className="space-y-2">
                        {topology.publicSubnets.map((subnet) => (
                          <div key={subnet.id} className="p-3 bg-blue-50 rounded-lg">
                            <p className="font-semibold text-sm">{subnet.name}</p>
                            <p className="text-xs text-default-600">{subnet.cidr}</p>
                            <p className="text-xs text-default-500">{subnet.availabilityZone}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-default-600 mb-2">Private Subnets</p>
                      <div className="space-y-2">
                        {topology.privateSubnets.map((subnet) => (
                          <div key={subnet.id} className="p-3 bg-purple-50 rounded-lg">
                            <p className="font-semibold text-sm">{subnet.name}</p>
                            <p className="text-xs text-default-600">{subnet.cidr}</p>
                            <p className="text-xs text-default-500">{subnet.availabilityZone}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Gateways</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {topology.internetGateway && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="font-semibold">Internet Gateway</p>
                        <p className="text-sm text-default-600 mt-1">
                          {topology.internetGateway.name}
                        </p>
                        <Chip size="sm" color="success" variant="flat" className="mt-2">
                          {topology.internetGateway.state}
                        </Chip>
                      </div>
                    )}
                    {topology.natGateways.map((nat) => (
                      <div key={nat.id} className="p-4 bg-orange-50 rounded-lg">
                        <p className="font-semibold">NAT Gateway</p>
                        <p className="text-sm text-default-600 mt-1">{nat.name}</p>
                        <Chip size="sm" color="warning" variant="flat" className="mt-2">
                          {nat.state}
                        </Chip>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="security" title="Security">
          <Card className="mt-4">
            <CardBody>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Security Groups</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {topology.securityGroups.map((sg) => (
                    <div key={sg.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{sg.name}</p>
                          <p className="text-xs text-default-500 mt-1">{sg.id}</p>
                        </div>
                        <Chip size="sm" color="success" variant="flat">
                          {sg.state}
                        </Chip>
                      </div>
                      {sg.metadata?.ingressRules && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Ingress Rules:</p>
                          <div className="space-y-1">
                            {sg.metadata.ingressRules.map((rule: any, idx: number) => (
                              <div
                                key={idx}
                                className="text-xs p-2 bg-default-100 rounded flex items-center gap-2"
                              >
                                <span className="text-success font-bold">→</span>
                                <span>
                                  Port <span className="font-semibold">{rule.port}</span> (
                                  {rule.protocol})
                                </span>
                                <span className="text-default-500">from {rule.source}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">IAM Roles</h3>
                  <div className="space-y-2">
                    {topology.iamRoles.map((role) => (
                      <div key={role.id} className="p-3 bg-default-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{role.name}</p>
                            <p className="text-xs text-default-500 mt-1">{role.arn}</p>
                          </div>
                          <Chip size="sm" color="success" variant="flat">
                            {role.state}
                          </Chip>
                        </div>
                      </div>
                    ))}
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
