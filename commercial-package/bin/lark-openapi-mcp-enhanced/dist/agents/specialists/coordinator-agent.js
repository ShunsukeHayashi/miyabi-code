"use strict";
/**
 * Coordinator Agent - Simplified Implementation
 * Manages task distribution and workflow coordination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoordinatorAgent = void 0;
exports.createCoordinator = createCoordinator;
const agent_1 = require("../agent");
const registry_1 = require("../registry");
class CoordinatorAgent extends agent_1.Agent {
    constructor(config = {}) {
        const coordinatorConfig = {
            name: 'Task Coordinator',
            instructions: `
Task coordination and workflow management specialist.
Distribute tasks efficiently across available agents.
Monitor progress and handle task dependencies.
`,
            tools: [],
            model: 'gpt-4',
            temperature: 0.3,
            maxTokens: 2000,
            language: 'en',
            ...config,
        };
        super(coordinatorConfig);
        this.activeTasks = new Map();
        this.workflows = new Map();
        this.config.tools = this.createCoordinatorTools();
    }
    createCoordinatorTools() {
        return [
            {
                name: 'assign_task',
                description: 'Assign task to appropriate specialist agent',
                execute: async (params) => {
                    const { taskId, agentType, context } = params;
                    const task = {
                        id: taskId,
                        name: context.name || 'Unnamed Task',
                        description: context.description || '',
                        type: 'simple',
                        priority: context.priority || 'medium',
                        requiredCapabilities: context.capabilities || [],
                        context,
                        status: 'assigned',
                        createdAt: new Date(),
                    };
                    this.activeTasks.set(taskId, task);
                    return {
                        success: true,
                        taskId,
                        assignedTo: agentType,
                        status: 'assigned',
                        timestamp: new Date().toISOString(),
                    };
                },
                schema: {
                    type: 'object',
                    properties: {
                        taskId: { type: 'string' },
                        agentType: { type: 'string' },
                        context: { type: 'object' },
                    },
                    required: ['taskId', 'agentType'],
                },
            },
            {
                name: 'get_task_status',
                description: 'Get current status of a task',
                execute: async (params) => {
                    const { taskId } = params;
                    const task = this.activeTasks.get(taskId);
                    if (!task) {
                        return {
                            success: false,
                            error: 'Task not found',
                            taskId,
                        };
                    }
                    return {
                        success: true,
                        task: {
                            id: task.id,
                            name: task.name,
                            status: task.status,
                            priority: task.priority,
                            createdAt: task.createdAt,
                            assignedAgentId: task.assignedAgentId,
                        },
                    };
                },
                schema: {
                    type: 'object',
                    properties: {
                        taskId: { type: 'string' },
                    },
                    required: ['taskId'],
                },
            },
            {
                name: 'list_active_tasks',
                description: 'List all currently active tasks',
                execute: async () => {
                    const tasks = Array.from(this.activeTasks.values()).map((task) => ({
                        id: task.id,
                        name: task.name,
                        status: task.status,
                        priority: task.priority,
                        createdAt: task.createdAt,
                    }));
                    return {
                        success: true,
                        activeTasks: tasks,
                        count: tasks.length,
                    };
                },
                schema: {
                    type: 'object',
                    properties: {},
                },
            },
        ];
    }
    /**
     * Simple task assignment logic
     */
    async assignTask(taskDescription, priority = 'medium') {
        const taskId = `task_${Date.now()}`;
        const agentType = this.determineAgentType(taskDescription);
        const tool = this.tools.get('assign_task');
        await (tool === null || tool === void 0 ? void 0 : tool.execute({
            taskId,
            agentType,
            context: {
                description: taskDescription,
                priority,
            },
        }));
        return taskId;
    }
    determineAgentType(description) {
        const lower = description.toLowerCase();
        if (lower.includes('base') || lower.includes('table') || lower.includes('record')) {
            return 'base_specialist';
        }
        if (lower.includes('message') || lower.includes('chat') || lower.includes('im')) {
            return 'messaging_specialist';
        }
        if (lower.includes('document') || lower.includes('doc') || lower.includes('wiki')) {
            return 'document_specialist';
        }
        if (lower.includes('calendar') || lower.includes('event') || lower.includes('meeting')) {
            return 'calendar_specialist';
        }
        return 'general_specialist';
    }
}
exports.CoordinatorAgent = CoordinatorAgent;
/**
 * Create and register Coordinator Agent
 */
async function createCoordinator() {
    const capabilities = [
        {
            name: 'task_coordination',
            description: 'Coordinate tasks across multiple agents',
            category: 'system',
        },
        {
            name: 'workflow_management',
            description: 'Manage complex workflows and dependencies',
            category: 'system',
        },
    ];
    const metadata = {
        id: `coordinator_${Date.now()}`,
        name: 'Task Coordinator',
        type: 'coordinator',
        capabilities,
        status: 'idle',
        maxConcurrentTasks: 10,
        currentTasks: 0,
        lastHeartbeat: new Date(),
        version: '1.0.0',
    };
    const registered = await registry_1.globalRegistry.registerAgent(metadata);
    if (registered) {
        console.log('✅ Coordinator Agent registered successfully');
        return metadata.id;
    }
    else {
        throw new Error('Failed to register Coordinator Agent');
    }
}
