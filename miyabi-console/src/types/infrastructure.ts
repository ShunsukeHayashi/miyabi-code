export type ResourceType =
  | 'vpc'
  | 'subnet'
  | 'internet_gateway'
  | 'nat_gateway'
  | 'route_table'
  | 'security_group'
  | 'ecs_cluster'
  | 'ecs_service'
  | 'alb'
  | 'target_group'
  | 'rds'
  | 'redis'
  | 'ecr'
  | 'iam_role';

export type ResourceState = 'planned' | 'creating' | 'available' | 'updating' | 'deleting' | 'failed';

export interface InfrastructureResource {
  id: string;
  type: ResourceType;
  name: string;
  state: ResourceState;
  arn?: string;
  cidr?: string;
  availabilityZone?: string;
  parent?: string; // Parent resource ID
  children?: string[]; // Child resource IDs
  connections?: string[]; // Connected resource IDs
  metadata?: Record<string, any>;
  createdAt?: string;
  tags?: Record<string, string>;
}

export interface NetworkLayer {
  name: string;
  resources: InfrastructureResource[];
}

export interface InfrastructureTopology {
  vpc: InfrastructureResource;
  publicSubnets: InfrastructureResource[];
  privateSubnets: InfrastructureResource[];
  internetGateway?: InfrastructureResource;
  natGateways: InfrastructureResource[];
  securityGroups: InfrastructureResource[];
  ecsCluster?: InfrastructureResource;
  ecsServices: InfrastructureResource[];
  alb?: InfrastructureResource;
  targetGroups: InfrastructureResource[];
  databases: InfrastructureResource[];
  caches: InfrastructureResource[];
  iamRoles: InfrastructureResource[];
}
