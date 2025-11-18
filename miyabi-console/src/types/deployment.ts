export type DeploymentStage =
  | 'preparation'
  | 'docker-ecr'
  | 'vpc-networking'
  | 'ecs-alb-redis'
  | 'ecs-deployment'
  | 'frontend-integration'
  | 'ssl-validation';

export type DeploymentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

export type TerraformPhase = 'init' | 'plan' | 'apply' | 'validate' | 'complete';

export interface DeploymentTask {
  id: string;
  day: number;
  issueNumber: number;
  title: string;
  stage: DeploymentStage;
  status: DeploymentStatus;
  progress: number; // 0-100
  startTime?: string;
  endTime?: string;
  duration?: number; // in seconds
  owner: string;
  resources: ResourceStatus[];
  logs: LogEntry[];
  errorMessage?: string;
}

export interface ResourceStatus {
  type: string; // 'vpc', 'subnet', 'ecs_cluster', etc.
  name: string;
  status: 'creating' | 'available' | 'failed' | 'deleted';
  id?: string;
  arn?: string;
  createdAt?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  source?: string; // 'terraform', 'aws', 'github'
}

export interface TerraformExecution {
  phase: TerraformPhase;
  command: string;
  status: DeploymentStatus;
  output: string[];
  resourcesCreated: number;
  resourcesUpdated: number;
  resourcesDestroyed: number;
  startTime?: string;
  duration?: number;
}

export interface PipelineState {
  tasks: DeploymentTask[];
  currentTask: DeploymentTask | null;
  terraformExecution: TerraformExecution | null;
  isExecuting: boolean;
}
