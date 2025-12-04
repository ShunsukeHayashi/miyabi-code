/**
 * Miyabi Sandbox Provisioner Lambda
 * 
 * Automatically provisions sandbox environments for new users:
 * 1. Creates GitHub repository from template
 * 2. Generates user-specific secrets
 * 3. Spins up ECS Fargate task
 * 4. Registers sandbox in DynamoDB
 */

import { 
  ECSClient, 
  RunTaskCommand, 
  StopTaskCommand,
  DescribeTasksCommand 
} from '@aws-sdk/client-ecs';
import { 
  DynamoDBClient 
} from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand,
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';
import { 
  SecretsManagerClient, 
  GetSecretValueCommand 
} from '@aws-sdk/client-secrets-manager';
import { Octokit } from '@octokit/rest';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// Configuration
// ============================================

const config = {
  ecsClusterArn: process.env.ECS_CLUSTER_ARN!,
  taskDefinitionArn: process.env.TASK_DEFINITION_ARN!,
  dynamoUsersTable: process.env.DYNAMODB_USERS_TABLE!,
  dynamoSandboxTable: process.env.DYNAMODB_SANDBOX_TABLE!,
  githubOrg: process.env.GITHUB_ORG!,
  templateRepo: process.env.TEMPLATE_REPO!,
  subnetIds: process.env.SUBNET_IDS!.split(','),
  securityGroupId: process.env.SECURITY_GROUP_ID!,
  region: process.env.AWS_REGION || 'ap-northeast-1'
};

// ============================================
// AWS Clients
// ============================================

const ecsClient = new ECSClient({ region: config.region });
const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: config.region })
);
const secretsClient = new SecretsManagerClient({ region: config.region });

// ============================================
// Types
// ============================================

interface ProvisionRequest {
  action: 'provision' | 'deprovision' | 'status' | 'list';
  userId: string;
  email?: string;
  githubUsername?: string;
}

interface User {
  user_id: string;
  email: string;
  github_username: string;
  cognito_sub?: string;
  created_at: string;
  last_login: string;
  plan: 'free' | 'pro' | 'enterprise';
}

interface Sandbox {
  sandbox_id: string;
  user_id: string;
  repo_name: string;
  repo_url: string;
  ecs_task_arn?: string;
  ecs_task_id?: string;
  status: 'provisioning' | 'running' | 'stopped' | 'terminated' | 'error';
  created_at: string;
  last_active: string;
  cpu: number;
  memory: number;
  error_message?: string;
}

interface ProvisionResponse {
  success: boolean;
  sandbox?: Sandbox;
  user?: User;
  message: string;
  error?: string;
}

// ============================================
// GitHub Operations
// ============================================

async function getGitHubToken(): Promise<string> {
  const response = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: 'miyabi/github-app-token'
    })
  );
  
  const secret = JSON.parse(response.SecretString || '{}');
  return secret.GITHUB_TOKEN;
}

async function createSandboxRepo(
  octokit: Octokit,
  userId: string,
  githubUsername: string
): Promise<{ name: string; url: string }> {
  const repoName = `miyabi-sandbox-${userId}`;
  
  try {
    // Check if repo already exists
    try {
      const existing = await octokit.repos.get({
        owner: config.githubOrg,
        repo: repoName
      });
      
      console.log(`Repository ${repoName} already exists`);
      return {
        name: repoName,
        url: existing.data.html_url
      };
    } catch (e: any) {
      if (e.status !== 404) throw e;
      // Repo doesn't exist, continue to create
    }
    
    // Create from template
    const response = await octokit.repos.createUsingTemplate({
      template_owner: config.githubOrg,
      template_repo: config.templateRepo,
      owner: config.githubOrg,
      name: repoName,
      description: `Miyabi sandbox for user ${userId}`,
      private: true,
      include_all_branches: false
    });
    
    console.log(`Created repository: ${response.data.html_url}`);
    
    // Add user as collaborator
    if (githubUsername) {
      await octokit.repos.addCollaborator({
        owner: config.githubOrg,
        repo: repoName,
        username: githubUsername,
        permission: 'push'
      });
      console.log(`Added ${githubUsername} as collaborator`);
    }
    
    return {
      name: repoName,
      url: response.data.html_url
    };
    
  } catch (error: any) {
    console.error('Failed to create repository:', error);
    throw new Error(`GitHub repo creation failed: ${error.message}`);
  }
}

async function deleteSandboxRepo(
  octokit: Octokit,
  repoName: string
): Promise<void> {
  try {
    await octokit.repos.delete({
      owner: config.githubOrg,
      repo: repoName
    });
    console.log(`Deleted repository: ${repoName}`);
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`Repository ${repoName} already deleted`);
      return;
    }
    throw error;
  }
}

// ============================================
// ECS Operations
// ============================================

async function startSandboxTask(
  sandbox: Sandbox,
  user: User,
  githubToken: string
): Promise<{ taskArn: string; taskId: string }> {
  const response = await ecsClient.send(
    new RunTaskCommand({
      cluster: config.ecsClusterArn,
      taskDefinition: config.taskDefinitionArn,
      launchType: 'FARGATE',
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: config.subnetIds,
          securityGroups: [config.securityGroupId],
          assignPublicIp: 'DISABLED'
        }
      },
      overrides: {
        containerOverrides: [
          {
            name: 'miyabi-sandbox',
            environment: [
              { name: 'MIYABI_USER_ID', value: user.user_id },
              { name: 'MIYABI_USER_EMAIL', value: user.email },
              { name: 'MIYABI_USER_GITHUB', value: user.github_username },
              { name: 'MIYABI_REPO_OWNER', value: config.githubOrg },
              { name: 'MIYABI_REPO_NAME', value: sandbox.repo_name },
              { name: 'MIYABI_SANDBOX_ID', value: sandbox.sandbox_id },
              { name: 'GITHUB_TOKEN', value: githubToken }
            ]
          }
        ]
      },
      enableExecuteCommand: true,  // Allow exec into container
      tags: [
        { key: 'MiyabiSandbox', value: sandbox.sandbox_id },
        { key: 'UserId', value: user.user_id }
      ]
    })
  );
  
  const task = response.tasks?.[0];
  if (!task || !task.taskArn) {
    throw new Error('Failed to start ECS task');
  }
  
  const taskId = task.taskArn.split('/').pop()!;
  
  console.log(`Started ECS task: ${task.taskArn}`);
  
  return {
    taskArn: task.taskArn,
    taskId
  };
}

async function stopSandboxTask(taskArn: string): Promise<void> {
  await ecsClient.send(
    new StopTaskCommand({
      cluster: config.ecsClusterArn,
      task: taskArn,
      reason: 'Sandbox deprovisioned'
    })
  );
  console.log(`Stopped ECS task: ${taskArn}`);
}

async function getTaskStatus(taskArn: string): Promise<string> {
  const response = await ecsClient.send(
    new DescribeTasksCommand({
      cluster: config.ecsClusterArn,
      tasks: [taskArn]
    })
  );
  
  return response.tasks?.[0]?.lastStatus || 'UNKNOWN';
}

// ============================================
// DynamoDB Operations
// ============================================

async function getUser(userId: string): Promise<User | null> {
  const response = await dynamoClient.send(
    new GetCommand({
      TableName: config.dynamoUsersTable,
      Key: { user_id: userId }
    })
  );
  
  return response.Item as User | null;
}

async function saveUser(user: User): Promise<void> {
  await dynamoClient.send(
    new PutCommand({
      TableName: config.dynamoUsersTable,
      Item: user
    })
  );
}

async function getSandbox(userId: string): Promise<Sandbox | null> {
  const response = await dynamoClient.send(
    new QueryCommand({
      TableName: config.dynamoSandboxTable,
      IndexName: 'user-index',
      KeyConditionExpression: 'user_id = :uid',
      ExpressionAttributeValues: {
        ':uid': userId
      },
      Limit: 1
    })
  );
  
  return response.Items?.[0] as Sandbox | null;
}

async function saveSandbox(sandbox: Sandbox): Promise<void> {
  await dynamoClient.send(
    new PutCommand({
      TableName: config.dynamoSandboxTable,
      Item: sandbox
    })
  );
}

async function updateSandboxStatus(
  sandboxId: string,
  userId: string,
  status: Sandbox['status'],
  updates: Partial<Sandbox> = {}
): Promise<void> {
  const updateParts: string[] = ['#status = :status', 'last_active = :now'];
  const expressionValues: Record<string, any> = {
    ':status': status,
    ':now': new Date().toISOString()
  };
  const expressionNames: Record<string, string> = {
    '#status': 'status'
  };
  
  if (updates.ecs_task_arn) {
    updateParts.push('ecs_task_arn = :taskArn');
    expressionValues[':taskArn'] = updates.ecs_task_arn;
  }
  
  if (updates.ecs_task_id) {
    updateParts.push('ecs_task_id = :taskId');
    expressionValues[':taskId'] = updates.ecs_task_id;
  }
  
  if (updates.error_message) {
    updateParts.push('error_message = :error');
    expressionValues[':error'] = updates.error_message;
  }
  
  await dynamoClient.send(
    new UpdateCommand({
      TableName: config.dynamoSandboxTable,
      Key: {
        sandbox_id: sandboxId,
        user_id: userId
      },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames
    })
  );
}

// ============================================
// Main Provisioning Logic
// ============================================

async function provisionSandbox(
  userId: string,
  email: string,
  githubUsername: string
): Promise<ProvisionResponse> {
  const now = new Date().toISOString();
  
  // 1. Check if user already has a sandbox
  let existingSandbox = await getSandbox(userId);
  if (existingSandbox && existingSandbox.status === 'running') {
    return {
      success: true,
      sandbox: existingSandbox,
      message: 'Sandbox already running'
    };
  }
  
  // 2. Get or create user record
  let user = await getUser(userId);
  if (!user) {
    user = {
      user_id: userId,
      email,
      github_username: githubUsername,
      created_at: now,
      last_login: now,
      plan: 'free'
    };
    await saveUser(user);
    console.log(`Created user: ${userId}`);
  } else {
    // Update last login
    user.last_login = now;
    await saveUser(user);
  }
  
  // 3. Get GitHub token
  const githubToken = await getGitHubToken();
  const octokit = new Octokit({ auth: githubToken });
  
  // 4. Create GitHub repository
  const repo = await createSandboxRepo(octokit, userId, githubUsername);
  
  // 5. Create sandbox record
  const sandboxId = existingSandbox?.sandbox_id || `sandbox-${uuidv4()}`;
  const sandbox: Sandbox = {
    sandbox_id: sandboxId,
    user_id: userId,
    repo_name: repo.name,
    repo_url: repo.url,
    status: 'provisioning',
    created_at: existingSandbox?.created_at || now,
    last_active: now,
    cpu: 1024,
    memory: 2048
  };
  
  await saveSandbox(sandbox);
  console.log(`Created sandbox record: ${sandboxId}`);
  
  try {
    // 6. Start ECS task
    const { taskArn, taskId } = await startSandboxTask(sandbox, user, githubToken);
    
    // 7. Update sandbox with task info
    await updateSandboxStatus(sandboxId, userId, 'running', {
      ecs_task_arn: taskArn,
      ecs_task_id: taskId
    });
    
    sandbox.status = 'running';
    sandbox.ecs_task_arn = taskArn;
    sandbox.ecs_task_id = taskId;
    
    return {
      success: true,
      sandbox,
      user,
      message: 'Sandbox provisioned successfully'
    };
    
  } catch (error: any) {
    // Update sandbox with error
    await updateSandboxStatus(sandboxId, userId, 'error', {
      error_message: error.message
    });
    
    throw error;
  }
}

async function deprovisionSandbox(userId: string): Promise<ProvisionResponse> {
  // 1. Get sandbox
  const sandbox = await getSandbox(userId);
  if (!sandbox) {
    return {
      success: false,
      message: 'No sandbox found for user',
      error: 'SANDBOX_NOT_FOUND'
    };
  }
  
  // 2. Stop ECS task if running
  if (sandbox.ecs_task_arn && sandbox.status === 'running') {
    try {
      await stopSandboxTask(sandbox.ecs_task_arn);
    } catch (error: any) {
      console.warn('Failed to stop task:', error.message);
    }
  }
  
  // 3. Optionally delete GitHub repo (commented out for safety)
  // const githubToken = await getGitHubToken();
  // const octokit = new Octokit({ auth: githubToken });
  // await deleteSandboxRepo(octokit, sandbox.repo_name);
  
  // 4. Update sandbox status
  await updateSandboxStatus(sandbox.sandbox_id, userId, 'terminated');
  
  sandbox.status = 'terminated';
  
  return {
    success: true,
    sandbox,
    message: 'Sandbox deprovisioned'
  };
}

async function getSandboxStatus(userId: string): Promise<ProvisionResponse> {
  const sandbox = await getSandbox(userId);
  if (!sandbox) {
    return {
      success: false,
      message: 'No sandbox found',
      error: 'SANDBOX_NOT_FOUND'
    };
  }
  
  // Get real-time ECS status
  if (sandbox.ecs_task_arn) {
    const ecsStatus = await getTaskStatus(sandbox.ecs_task_arn);
    
    // Map ECS status to sandbox status
    if (ecsStatus === 'RUNNING') {
      sandbox.status = 'running';
    } else if (ecsStatus === 'STOPPED') {
      sandbox.status = 'stopped';
    } else if (ecsStatus === 'PENDING' || ecsStatus === 'PROVISIONING') {
      sandbox.status = 'provisioning';
    }
  }
  
  const user = await getUser(userId);
  
  return {
    success: true,
    sandbox,
    user: user || undefined,
    message: `Sandbox status: ${sandbox.status}`
  };
}

// ============================================
// Lambda Handler
// ============================================

export async function handler(event: ProvisionRequest): Promise<ProvisionResponse> {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    switch (event.action) {
      case 'provision':
        if (!event.email || !event.githubUsername) {
          return {
            success: false,
            message: 'Missing required fields: email, githubUsername',
            error: 'INVALID_REQUEST'
          };
        }
        return await provisionSandbox(
          event.userId,
          event.email,
          event.githubUsername
        );
        
      case 'deprovision':
        return await deprovisionSandbox(event.userId);
        
      case 'status':
        return await getSandboxStatus(event.userId);
        
      default:
        return {
          success: false,
          message: `Unknown action: ${event.action}`,
          error: 'INVALID_ACTION'
        };
    }
    
  } catch (error: any) {
    console.error('Error:', error);
    return {
      success: false,
      message: error.message,
      error: 'INTERNAL_ERROR'
    };
  }
}
