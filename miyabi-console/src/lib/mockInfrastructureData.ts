import type { InfrastructureResource, InfrastructureTopology } from '@/types/infrastructure';

// VPC and Networking
const vpc: InfrastructureResource = {
  id: 'vpc-0123456789abcdef0',
  type: 'vpc',
  name: 'miyabi-vpc-dev',
  state: 'available',
  cidr: '10.0.0.0/16',
  arn: 'arn:aws:ec2:us-west-2:112530848482:vpc/vpc-0123456789abcdef0',
  createdAt: '2025-11-18T06:32:00Z',
  tags: { Environment: 'dev', Project: 'miyabi' },
};

const publicSubnets: InfrastructureResource[] = [
  {
    id: 'subnet-0a1b2c3d4e5f6g7h8',
    type: 'subnet',
    name: 'miyabi-public-subnet-1-dev',
    state: 'available',
    cidr: '10.0.1.0/24',
    availabilityZone: 'us-west-2a',
    parent: vpc.id,
    createdAt: '2025-11-18T06:33:00Z',
  },
  {
    id: 'subnet-1a2b3c4d5e6f7g8h9',
    type: 'subnet',
    name: 'miyabi-public-subnet-2-dev',
    state: 'available',
    cidr: '10.0.2.0/24',
    availabilityZone: 'us-west-2b',
    parent: vpc.id,
    createdAt: '2025-11-18T06:33:00Z',
  },
];

const privateSubnets: InfrastructureResource[] = [
  {
    id: 'subnet-2a3b4c5d6e7f8g9h0',
    type: 'subnet',
    name: 'miyabi-private-subnet-1-dev',
    state: 'available',
    cidr: '10.0.11.0/24',
    availabilityZone: 'us-west-2a',
    parent: vpc.id,
    createdAt: '2025-11-18T06:33:00Z',
  },
  {
    id: 'subnet-3a4b5c6d7e8f9g0h1',
    type: 'subnet',
    name: 'miyabi-private-subnet-2-dev',
    state: 'available',
    cidr: '10.0.12.0/24',
    availabilityZone: 'us-west-2b',
    parent: vpc.id,
    createdAt: '2025-11-18T06:33:00Z',
  },
];

const internetGateway: InfrastructureResource = {
  id: 'igw-0a1b2c3d4e5f6g7h8',
  type: 'internet_gateway',
  name: 'miyabi-igw-dev',
  state: 'available',
  parent: vpc.id,
  connections: publicSubnets.map((s) => s.id),
  createdAt: '2025-11-18T06:34:00Z',
};

const natGateways: InfrastructureResource[] = [
  {
    id: 'nat-0a1b2c3d4e5f6g7h8',
    type: 'nat_gateway',
    name: 'miyabi-nat-1-dev',
    state: 'creating',
    parent: publicSubnets[0].id,
    connections: privateSubnets.map((s) => s.id),
  },
];

// Security Groups
const securityGroups: InfrastructureResource[] = [
  {
    id: 'sg-alb-0a1b2c3d',
    type: 'security_group',
    name: 'miyabi-alb-sg-dev',
    state: 'available',
    parent: vpc.id,
    metadata: {
      ingressRules: [
        { port: 80, protocol: 'tcp', source: '0.0.0.0/0' },
        { port: 443, protocol: 'tcp', source: '0.0.0.0/0' },
      ],
    },
    createdAt: '2025-11-18T06:35:00Z',
  },
  {
    id: 'sg-ecs-0b2c3d4e',
    type: 'security_group',
    name: 'miyabi-ecs-sg-dev',
    state: 'available',
    parent: vpc.id,
    connections: ['sg-alb-0a1b2c3d'],
    metadata: {
      ingressRules: [{ port: 8080, protocol: 'tcp', source: 'sg-alb-0a1b2c3d' }],
    },
    createdAt: '2025-11-18T06:35:00Z',
  },
  {
    id: 'sg-rds-0c3d4e5f',
    type: 'security_group',
    name: 'miyabi-rds-sg-dev',
    state: 'available',
    parent: vpc.id,
    connections: ['sg-ecs-0b2c3d4e'],
    metadata: {
      ingressRules: [{ port: 5432, protocol: 'tcp', source: 'sg-ecs-0b2c3d4e' }],
    },
    createdAt: '2025-11-18T06:35:00Z',
  },
  {
    id: 'sg-redis-0d4e5f6g',
    type: 'security_group',
    name: 'miyabi-redis-sg-dev',
    state: 'available',
    parent: vpc.id,
    connections: ['sg-ecs-0b2c3d4e'],
    metadata: {
      ingressRules: [{ port: 6379, protocol: 'tcp', source: 'sg-ecs-0b2c3d4e' }],
    },
    createdAt: '2025-11-18T06:35:00Z',
  },
];

// ECS Cluster (Day 4 - Planned)
const ecsCluster: InfrastructureResource = {
  id: 'ecs-cluster-miyabi-dev',
  type: 'ecs_cluster',
  name: 'miyabi-cluster-dev',
  state: 'planned',
  parent: vpc.id,
};

const ecsServices: InfrastructureResource[] = [
  {
    id: 'ecs-service-web-api',
    type: 'ecs_service',
    name: 'miyabi-web-api-service',
    state: 'planned',
    parent: ecsCluster.id,
    connections: ['sg-ecs-0b2c3d4e', 'tg-web-api'],
  },
];

// ALB (Day 4 - Planned)
const alb: InfrastructureResource = {
  id: 'alb-miyabi-dev',
  type: 'alb',
  name: 'miyabi-alb-dev',
  state: 'planned',
  parent: vpc.id,
  connections: ['sg-alb-0a1b2c3d', ...publicSubnets.map((s) => s.id)],
};

const targetGroups: InfrastructureResource[] = [
  {
    id: 'tg-web-api',
    type: 'target_group',
    name: 'miyabi-web-api-tg',
    state: 'planned',
    parent: alb.id,
    connections: [ecsServices[0].id],
  },
];

// Databases (Day 4 - Planned)
const databases: InfrastructureResource[] = [
  {
    id: 'rds-miyabi-postgres',
    type: 'rds',
    name: 'miyabi-postgres-dev',
    state: 'planned',
    parent: vpc.id,
    connections: ['sg-rds-0c3d4e5f', ...privateSubnets.map((s) => s.id)],
    metadata: {
      engine: 'postgres',
      version: '15.4',
      instanceClass: 'db.t3.micro',
    },
  },
];

// Cache (Day 4 - Planned)
const caches: InfrastructureResource[] = [
  {
    id: 'redis-miyabi-cache',
    type: 'redis',
    name: 'miyabi-redis-dev',
    state: 'planned',
    parent: vpc.id,
    connections: ['sg-redis-0d4e5f6g', ...privateSubnets.map((s) => s.id)],
    metadata: {
      nodeType: 'cache.t3.micro',
      engine: 'redis',
      version: '7.0',
    },
  },
];

// IAM Roles
const iamRoles: InfrastructureResource[] = [
  {
    id: 'iam-role-ecs-task-execution',
    type: 'iam_role',
    name: 'miyabi-ecs-task-execution-dev',
    state: 'available',
    arn: 'arn:aws:iam::112530848482:role/miyabi-ecs-task-execution-dev',
    createdAt: '2025-11-18T06:36:00Z',
  },
  {
    id: 'iam-role-ecs-task',
    type: 'iam_role',
    name: 'miyabi-ecs-task-dev',
    state: 'available',
    arn: 'arn:aws:iam::112530848482:role/miyabi-ecs-task-dev',
    createdAt: '2025-11-18T06:36:00Z',
  },
];

export const mockInfrastructureTopology: InfrastructureTopology = {
  vpc,
  publicSubnets,
  privateSubnets,
  internetGateway,
  natGateways,
  securityGroups,
  ecsCluster,
  ecsServices,
  alb,
  targetGroups,
  databases,
  caches,
  iamRoles,
};
