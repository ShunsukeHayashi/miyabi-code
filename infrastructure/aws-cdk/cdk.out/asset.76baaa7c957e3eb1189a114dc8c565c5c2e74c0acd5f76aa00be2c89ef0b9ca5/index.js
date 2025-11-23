// Miyabi WebUI Lambda Backend
// Version: 1.0.0
// GitHub Remote Only + S3 Fallback

const AWS = require('aws-sdk');
const { Octokit } = require('@octokit/rest');

const s3 = new AWS.S3();
const secretsManager = new AWS.SecretsManager();

const TASK_BUCKET = process.env.TASK_BUCKET;
const GITHUB_TOKEN_SECRET = process.env.GITHUB_TOKEN_SECRET;
const GITHUB_REPO = process.env.GITHUB_REPO;
const [REPO_OWNER, REPO_NAME] = GITHUB_REPO.split('/');

let octokit;

// Initialize GitHub client
async function initGitHub() {
  if (octokit) return octokit;

  const secret = await secretsManager
    .getSecretValue({ SecretId: GITHUB_TOKEN_SECRET })
    .promise();

  const token = JSON.parse(secret.SecretString).GITHUB_TOKEN;

  octokit = new Octokit({ auth: token });
  return octokit;
}

// Main handler
exports.handler = async (event) => {
  console.log('Request:', JSON.stringify(event, null, 2));

  const { httpMethod, path, body, queryStringParameters } = event;

  try {
    await initGitHub();

    // Route requests
    if (path === '/api/tasks' && httpMethod === 'GET') {
      return await getTasks();
    } else if (path.startsWith('/api/tasks/') && httpMethod === 'GET') {
      const taskId = path.split('/')[3];
      return await getTask(taskId);
    } else if (path === '/api/tasks' && httpMethod === 'POST') {
      const taskData = JSON.parse(body);
      return await createTask(taskData);
    } else if (path.startsWith('/api/logs/') && httpMethod === 'GET') {
      const logFile = path.split('/')[3];
      return await getLog(logFile);
    } else if (path === '/api/templates' && httpMethod === 'GET') {
      return await getTemplates();
    } else if (path === '/api/stats' && httpMethod === 'GET') {
      return await getStats();
    } else {
      return response(404, { error: 'Not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    return response(500, { error: error.message });
  }
};

// Get all tasks from GitHub
async function getTasks() {
  try {
    const tasks = [];
    const statusDirs = ['pending', 'in_progress', 'completed', 'blocked'];

    for (const status of statusDirs) {
      try {
        const { data: files } = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: `.claude/tasks/${status}`,
        });

        for (const file of files) {
          if (file.name.endsWith('.json')) {
            const { data: content } = await octokit.repos.getContent({
              owner: REPO_OWNER,
              repo: REPO_NAME,
              path: file.path,
            });

            const taskJson = Buffer.from(content.content, 'base64').toString('utf-8');
            const task = JSON.parse(taskJson);
            task.status = status;
            tasks.push(task);
          }
        }
      } catch (error) {
        console.warn(`Directory ${status} not found or empty`);
      }
    }

    // Sort by created_at
    tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return response(200, { tasks, count: tasks.length });
  } catch (error) {
    console.error('Error getting tasks:', error);
    // Fallback to S3
    return await getTasksFromS3();
  }
}

// Get single task from GitHub
async function getTask(taskId) {
  try {
    const statusDirs = ['pending', 'in_progress', 'completed', 'blocked'];

    for (const status of statusDirs) {
      try {
        const { data: content } = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: `.claude/tasks/${status}/${taskId}.json`,
        });

        const taskJson = Buffer.from(content.content, 'base64').toString('utf-8');
        const task = JSON.parse(taskJson);
        task.status = status;
        return response(200, task);
      } catch (error) {
        // Continue searching
        continue;
      }
    }

    return response(404, { error: 'Task not found' });
  } catch (error) {
    console.error('Error getting task:', error);
    return response(500, { error: error.message });
  }
}

// Create task in GitHub
async function createTask(taskData) {
  try {
    const task = {
      task_id: `task-${Date.now()}-${generateId()}`,
      version: '1.0.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      from: 'web-ui',
      to: 'orchestrator',
      priority: taskData.priority || 'P2',
      directive: taskData.name,
      description: taskData.description || '',
      execution: {
        type: taskData.execution_type || 'headless',
        prompt: taskData.template ? `${taskData.template}.txt` : null,
        template: taskData.template ? `${taskData.template}.json` : null,
        timeout: 7200,
        retry: 3,
      },
      status: 'pending',
      metadata: {
        tags: [taskData.template || 'custom'],
        source: 'web-ui',
      },
    };

    // Create file in GitHub
    const content = Buffer.from(JSON.stringify(task, null, 2)).toString('base64');

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `.claude/tasks/pending/${task.task_id}.json`,
      message: `[WebUI] Create task: ${task.directive}`,
      content,
      branch: 'main',
    });

    return response(201, { success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    // Fallback to S3
    return await createTaskInS3(taskData);
  }
}

// Get log from GitHub
async function getLog(logFile) {
  try {
    const { data: content } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `.claude/logs/${logFile}`,
    });

    const log = Buffer.from(content.content, 'base64').toString('utf-8');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: log,
    };
  } catch (error) {
    console.error('Error getting log:', error);
    return response(404, { error: 'Log not found' });
  }
}

// Get templates from GitHub
async function getTemplates() {
  try {
    const { data: files } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: '.claude/templates',
    });

    const templates = files
      .filter((f) => f.name.endsWith('.json'))
      .map((f) => f.name.replace('.json', ''));

    return response(200, { templates });
  } catch (error) {
    console.error('Error getting templates:', error);
    return response(500, { error: error.message });
  }
}

// Get statistics
async function getStats() {
  try {
    const { tasks } = await getTasks();

    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      blocked: tasks.filter((t) => t.status === 'blocked').length,
      by_priority: {
        P0: tasks.filter((t) => t.priority === 'P0').length,
        P1: tasks.filter((t) => t.priority === 'P1').length,
        P2: tasks.filter((t) => t.priority === 'P2').length,
        P3: tasks.filter((t) => t.priority === 'P3').length,
      },
    };

    return response(200, stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    return response(500, { error: error.message });
  }
}

// S3 Fallback Functions
async function getTasksFromS3() {
  const tasks = [];
  const statusDirs = ['pending', 'in_progress', 'completed', 'blocked'];

  for (const status of statusDirs) {
    try {
      const { Contents } = await s3
        .listObjectsV2({
          Bucket: TASK_BUCKET,
          Prefix: `tasks/${status}/`,
        })
        .promise();

      for (const file of Contents || []) {
        if (file.Key.endsWith('.json')) {
          const { Body } = await s3
            .getObject({
              Bucket: TASK_BUCKET,
              Key: file.Key,
            })
            .promise();

          const task = JSON.parse(Body.toString());
          task.status = status;
          tasks.push(task);
        }
      }
    } catch (error) {
      console.warn(`S3 directory ${status} error:`, error.message);
    }
  }

  tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return response(200, { tasks, count: tasks.length });
}

async function createTaskInS3(taskData) {
  const task = {
    task_id: `task-${Date.now()}-${generateId()}`,
    version: '1.0.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    from: 'web-ui',
    to: 'orchestrator',
    priority: taskData.priority || 'P2',
    directive: taskData.name,
    description: taskData.description || '',
    execution: {
      type: taskData.execution_type || 'headless',
      prompt: taskData.template ? `${taskData.template}.txt` : null,
      template: taskData.template ? `${taskData.template}.json` : null,
      timeout: 7200,
      retry: 3,
    },
    status: 'pending',
    metadata: {
      tags: [taskData.template || 'custom'],
      source: 'web-ui',
    },
  };

  await s3
    .putObject({
      Bucket: TASK_BUCKET,
      Key: `tasks/pending/${task.task_id}.json`,
      Body: JSON.stringify(task, null, 2),
      ContentType: 'application/json',
    })
    .promise();

  return response(201, { success: true, task });
}

// Utility Functions
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  };
}

function generateId() {
  return Math.random().toString(36).substr(2, 8);
}
