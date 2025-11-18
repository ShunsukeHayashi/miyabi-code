import { Card, CardBody, CardHeader, Chip, Divider } from '@heroui/react'
import type { InfrastructureTopology, InfrastructureResource, ResourceState } from '@/types/infrastructure'

interface InfrastructureTopologyViewProps {
  topology: InfrastructureTopology
}

const stateColors: Record<ResourceState, 'success' | 'warning' | 'default' | 'danger' | 'primary'> = {
  available: 'success',
  creating: 'warning',
  planned: 'default',
  updating: 'primary',
  deleting: 'danger',
  failed: 'danger',
}

const stateIcons: Record<ResourceState, string> = {
  available: '✓',
  creating: '⏳',
  planned: '📋',
  updating: '🔄',
  deleting: '🗑️',
  failed: '❌',
}

const ResourceCard = ({ resource }: { resource: InfrastructureResource }) => {
  return (
    <Card className="min-w-[200px] shadow-sm">
      <CardBody className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-default-500 uppercase">{resource.type.replace(/_/g, ' ')}</p>
            <p className="text-sm font-semibold truncate" title={resource.name}>
              {resource.name}
            </p>
            {resource.cidr && (
              <p className="text-xs text-default-400 mt-1">{resource.cidr}</p>
            )}
            {resource.availabilityZone && (
              <p className="text-xs text-default-400">{resource.availabilityZone}</p>
            )}
            {resource.metadata?.engine && (
              <p className="text-xs text-default-400">
                {resource.metadata.engine} {resource.metadata.version}
              </p>
            )}
          </div>
          <Chip
            size="sm"
            color={stateColors[resource.state]}
            variant="flat"
            className="flex-shrink-0"
          >
            {stateIcons[resource.state]} {resource.state}
          </Chip>
        </div>
      </CardBody>
    </Card>
  )
}

const SecurityGroupCard = ({ resource }: { resource: InfrastructureResource }) => {
  return (
    <Card className="min-w-[220px] shadow-sm">
      <CardBody className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-default-500 uppercase">Security Group</p>
            <p className="text-sm font-semibold truncate" title={resource.name}>
              {resource.name}
            </p>
          </div>
          <Chip size="sm" color={stateColors[resource.state]} variant="flat">
            {stateIcons[resource.state]} {resource.state}
          </Chip>
        </div>
        {resource.metadata?.ingressRules && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-default-600">Ingress Rules:</p>
            {resource.metadata.ingressRules.map((rule: any, idx: number) => (
              <div key={idx} className="text-xs text-default-500 flex items-center gap-1">
                <span className="text-success">→</span>
                <span>
                  Port {rule.port} ({rule.protocol}) from {rule.source}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default function InfrastructureTopologyView({ topology }: InfrastructureTopologyViewProps) {
  return (
    <div className="space-y-6">
      {/* VPC Layer */}
      <Card className="border-2 border-primary-200 bg-primary-50/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-lg font-bold">{topology.vpc.name}</h3>
              <p className="text-sm text-default-500">VPC • {topology.vpc.cidr}</p>
            </div>
            <Chip color={stateColors[topology.vpc.state]} variant="flat">
              {stateIcons[topology.vpc.state]} {topology.vpc.state}
            </Chip>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6 pt-4">
          {/* Internet Gateway */}
          {topology.internetGateway && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg border-2 border-blue-300">
                <span className="text-2xl">🌐</span>
                <div>
                  <p className="text-sm font-semibold">{topology.internetGateway.name}</p>
                  <p className="text-xs text-default-500">Internet Gateway</p>
                </div>
                <Chip size="sm" color={stateColors[topology.internetGateway.state]} variant="flat">
                  {stateIcons[topology.internetGateway.state]}
                </Chip>
              </div>
            </div>
          )}

          {/* Public Subnets */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary-300 to-transparent" />
              <h4 className="text-sm font-semibold text-primary-600 px-3">Public Subnets</h4>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary-300 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topology.publicSubnets.map((subnet) => (
                <ResourceCard key={subnet.id} resource={subnet} />
              ))}
            </div>
          </div>

          {/* NAT Gateways */}
          {topology.natGateways.length > 0 && (
            <div className="flex justify-center gap-4">
              {topology.natGateways.map((nat) => (
                <div
                  key={nat.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-lg border-2 border-orange-300"
                >
                  <span className="text-2xl">🔀</span>
                  <div>
                    <p className="text-sm font-semibold">{nat.name}</p>
                    <p className="text-xs text-default-500">NAT Gateway</p>
                  </div>
                  <Chip size="sm" color={stateColors[nat.state]} variant="flat">
                    {stateIcons[nat.state]}
                  </Chip>
                </div>
              ))}
            </div>
          )}

          {/* Private Subnets */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-secondary-300 to-transparent" />
              <h4 className="text-sm font-semibold text-secondary-600 px-3">Private Subnets</h4>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-secondary-300 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topology.privateSubnets.map((subnet) => (
                <ResourceCard key={subnet.id} resource={subnet} />
              ))}
            </div>
          </div>

          {/* Security Groups */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-warning-300 to-transparent" />
              <h4 className="text-sm font-semibold text-warning-600 px-3">
                🛡️ Security Groups
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-warning-300 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topology.securityGroups.map((sg) => (
                <SecurityGroupCard key={sg.id} resource={sg} />
              ))}
            </div>
          </div>

          {/* Compute Layer */}
          {(topology.ecsCluster || topology.ecsServices.length > 0 || topology.alb) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-success-300 to-transparent" />
                <h4 className="text-sm font-semibold text-success-600 px-3">
                  ⚙️ Compute & Load Balancing
                </h4>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-success-300 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topology.alb && <ResourceCard resource={topology.alb} />}
                {topology.targetGroups.map((tg) => (
                  <ResourceCard key={tg.id} resource={tg} />
                ))}
                {topology.ecsCluster && <ResourceCard resource={topology.ecsCluster} />}
                {topology.ecsServices.map((service) => (
                  <ResourceCard key={service.id} resource={service} />
                ))}
              </div>
            </div>
          )}

          {/* Data Layer */}
          {(topology.databases.length > 0 || topology.caches.length > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-danger-300 to-transparent" />
                <h4 className="text-sm font-semibold text-danger-600 px-3">🗄️ Data Layer</h4>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-danger-300 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topology.databases.map((db) => (
                  <ResourceCard key={db.id} resource={db} />
                ))}
                {topology.caches.map((cache) => (
                  <ResourceCard key={cache.id} resource={cache} />
                ))}
              </div>
            </div>
          )}

          {/* IAM Roles */}
          {topology.iamRoles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-default-300 to-transparent" />
                <h4 className="text-sm font-semibold text-default-600 px-3">
                  🔐 IAM Roles
                </h4>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-default-300 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topology.iamRoles.map((role) => (
                  <ResourceCard key={role.id} resource={role} />
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
