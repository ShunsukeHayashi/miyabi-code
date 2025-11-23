"use strict";
/**
 * Task Distribution and Coordination Mechanism
 * Based on AIstudio's workflow orchestration patterns with enhanced multi-agent capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalTaskCoordinator = exports.TaskCoordinator = void 0;
const events_1 = require("events");
const registry_1 = require("./registry");
const communication_1 = require("./communication");
class TaskCoordinator extends events_1.EventEmitter {
    constructor(strategy = { type: 'capability_optimized' }) {
        super();
        this.tasks = new Map();
        this.workflows = new Map();
        this.isProcessing = false;
        this.processingQueue = [];
        // Inspired by AIstudio's CONCURRENT_TASK_LIMIT
        this.CONCURRENT_TASK_LIMIT = 3;
        this.MAX_RETRY_ATTEMPTS = 3;
        this.TASK_TIMEOUT_MS = 300000; // 5 minutes
        this.strategy = {
            maxConcurrentTasks: this.CONCURRENT_TASK_LIMIT,
            retryAttempts: this.MAX_RETRY_ATTEMPTS,
            timeoutMs: this.TASK_TIMEOUT_MS,
            ...strategy,
        };
        // Listen to communication bus events
        communication_1.globalCommBus.on('agent_offline', this.handleAgentOffline.bind(this));
        // Start processing queue
        setInterval(() => this.processTaskQueue(), 1000);
    }
    /**
     * Create and distribute a new task
     */
    async createTask(taskData) {
        const task = {
            ...taskData,
            id: this.generateTaskId(),
            status: 'pending',
            createdAt: new Date(),
        };
        this.tasks.set(task.id, task);
        this.processingQueue.push(task.id);
        this.emit('task_created', task);
        console.log(`📋 Task created: ${task.name} (${task.id})`);
        return task.id;
    }
    /**
     * Create workflow with multiple tasks
     */
    async createWorkflow(name, tasks, context = {}) {
        const workflowId = this.generateWorkflowId();
        const taskIds = [];
        // Create all tasks
        for (const taskData of tasks) {
            const taskId = await this.createTask(taskData);
            taskIds.push(taskId);
        }
        const workflow = {
            id: workflowId,
            status: 'pending',
            currentStep: 0,
            totalSteps: tasks.length,
            tasks: [], // Will be populated during assignment
            context,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.workflows.set(workflowId, workflow);
        this.emit('workflow_created', workflow);
        console.log(`🔄 Workflow created: ${name} with ${tasks.length} tasks`);
        return workflowId;
    }
    /**
     * Process task queue with intelligent distribution
     */
    async processTaskQueue() {
        if (this.isProcessing || this.processingQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            const currentActiveTasks = Array.from(this.tasks.values()).filter((task) => task.status === 'in_progress').length;
            if (currentActiveTasks >= this.strategy.maxConcurrentTasks) {
                return;
            }
            const tasksToProcess = Math.min(this.strategy.maxConcurrentTasks - currentActiveTasks, this.processingQueue.length);
            for (let i = 0; i < tasksToProcess; i++) {
                const taskId = this.processingQueue.shift();
                if (taskId) {
                    await this.distributeTask(taskId);
                }
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Distribute task to best available agent
     */
    async distributeTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== 'pending') {
            return false;
        }
        try {
            // Check dependencies
            if (task.dependencies && !this.areDependenciesCompleted(task.dependencies)) {
                // Re-queue task for later processing
                this.processingQueue.push(taskId);
                return false;
            }
            // Find best agent using AIstudio-inspired agent assignment logic
            const agent = await this.findBestAgentForTask(task);
            if (!agent) {
                console.warn(`⚠️ No available agent for task: ${task.name}`);
                // Re-queue for retry
                setTimeout(() => {
                    this.processingQueue.push(taskId);
                }, 5000);
                return false;
            }
            // Create task assignment
            const assignment = {
                taskId: task.id,
                assignedAgentId: agent.id,
                assignedAgentType: agent.type,
                recommendedTools: this.getRecommendedTools(task),
                priority: task.priority,
                estimatedDuration: task.estimatedDuration,
                dependencies: task.dependencies,
                context: task.context,
            };
            // Send task to agent
            const message = {
                id: this.generateMessageId(),
                from: 'task_coordinator',
                to: agent.id,
                type: 'request',
                payload: {
                    type: 'task_assignment',
                    assignment,
                    task,
                },
                timestamp: new Date(),
                priority: task.priority,
            };
            const sent = await communication_1.globalCommBus.sendMessage(message);
            if (!sent) {
                throw new Error(`Failed to send task to agent ${agent.id}`);
            }
            // Update task status
            task.status = 'assigned';
            task.assignedAgentId = agent.id;
            task.startedAt = new Date();
            // Update agent task count
            registry_1.globalRegistry.updateAgentTasks(agent.id, agent.currentTasks + 1);
            this.emit('task_assigned', task, agent);
            console.log(`✅ Task assigned: ${task.name} → ${agent.name}`);
            // Start timeout monitoring
            this.startTaskTimeout(taskId);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to distribute task ${taskId}:`, error);
            task.status = 'failed';
            task.error = String(error);
            this.emit('task_failed', task);
            return false;
        }
    }
    /**
     * Find best agent for task using AIstudio patterns
     */
    async findBestAgentForTask(task) {
        // First, try to find a specialist agent
        for (const capability of task.requiredCapabilities) {
            const agent = registry_1.globalRegistry.findBestAgent(capability, {
                preferredType: 'specialist',
                maxLoad: 0.8, // Don't overload agents
            });
            if (agent) {
                return agent;
            }
        }
        // Fallback to coordinator agents
        for (const capability of task.requiredCapabilities) {
            const agent = registry_1.globalRegistry.findBestAgent(capability, {
                preferredType: 'coordinator',
                maxLoad: 0.9,
            });
            if (agent) {
                return agent;
            }
        }
        // Last resort: any capable agent
        for (const capability of task.requiredCapabilities) {
            const agent = registry_1.globalRegistry.findBestAgent(capability);
            if (agent) {
                return agent;
            }
        }
        return null;
    }
    /**
     * Get recommended tools for task based on capabilities
     */
    getRecommendedTools(task) {
        const tools = [];
        // Map capabilities to specific tools
        for (const capability of task.requiredCapabilities) {
            switch (capability) {
                case 'base_operations':
                    tools.push('bitable.v1.app.table.record.search', 'bitable.v1.app.table.record.create');
                    break;
                case 'messaging':
                    tools.push('im.v1.message.create', 'im.v1.chat.members.get');
                    break;
                case 'document_management':
                    tools.push('drive.v1.file.list', 'docs.v1.document.get');
                    break;
                case 'calendar_management':
                    tools.push('calendar.v4.calendar.event.list', 'calendar.v4.calendar.event.create');
                    break;
                case 'user_management':
                    tools.push('contact.v3.user.batch_get', 'contact.v3.user.list');
                    break;
            }
        }
        return tools;
    }
    /**
     * Check if task dependencies are completed
     */
    areDependenciesCompleted(dependencies) {
        return dependencies.every((depId) => {
            const depTask = this.tasks.get(depId);
            return (depTask === null || depTask === void 0 ? void 0 : depTask.status) === 'completed';
        });
    }
    /**
     * Handle task completion from agent
     */
    async handleTaskCompletion(taskId, result, agentId) {
        const task = this.tasks.get(taskId);
        if (!task || task.assignedAgentId !== agentId) {
            return;
        }
        task.status = 'completed';
        task.result = result;
        task.completedAt = new Date();
        // Update agent task count
        const agent = registry_1.globalRegistry.getAgent(agentId);
        if (agent) {
            registry_1.globalRegistry.updateAgentTasks(agentId, agent.currentTasks - 1);
        }
        this.emit('task_completed', task);
        console.log(`✅ Task completed: ${task.name}`);
        // Check if this completes any workflows
        await this.checkWorkflowCompletion(taskId);
    }
    /**
     * Handle task failure from agent
     */
    async handleTaskFailure(taskId, error, agentId) {
        const task = this.tasks.get(taskId);
        if (!task || task.assignedAgentId !== agentId) {
            return;
        }
        task.status = 'failed';
        task.error = error;
        task.completedAt = new Date();
        // Update agent task count
        const agent = registry_1.globalRegistry.getAgent(agentId);
        if (agent) {
            registry_1.globalRegistry.updateAgentTasks(agentId, agent.currentTasks - 1);
        }
        this.emit('task_failed', task);
        console.error(`❌ Task failed: ${task.name} - ${error}`);
        // Attempt retry if possible
        if (this.shouldRetryTask(task)) {
            await this.retryTask(taskId);
        }
    }
    /**
     * Start task timeout monitoring
     */
    startTaskTimeout(taskId) {
        setTimeout(() => {
            const task = this.tasks.get(taskId);
            if (task && task.status === 'in_progress') {
                this.handleTaskFailure(taskId, 'Task timeout', task.assignedAgentId || 'unknown');
            }
        }, this.strategy.timeoutMs);
    }
    /**
     * Determine if task should be retried
     */
    shouldRetryTask(task) {
        // Count previous retry attempts (simplified)
        return task.priority === 'urgent' || task.priority === 'high';
    }
    /**
     * Retry failed task
     */
    async retryTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return;
        task.status = 'pending';
        task.assignedAgentId = undefined;
        task.error = undefined;
        this.processingQueue.push(taskId);
        console.log(`🔄 Retrying task: ${task.name}`);
    }
    /**
     * Handle agent going offline
     */
    handleAgentOffline(event) {
        const agentId = event.agentId;
        // Reassign tasks from offline agent
        for (const [taskId, task] of this.tasks.entries()) {
            if (task.assignedAgentId === agentId && task.status === 'in_progress') {
                console.warn(`🔄 Reassigning task due to agent offline: ${task.name}`);
                this.retryTask(taskId);
            }
        }
    }
    /**
     * Check workflow completion status
     */
    async checkWorkflowCompletion(completedTaskId) {
        for (const [workflowId, workflow] of this.workflows.entries()) {
            const workflowTasks = Array.from(this.tasks.values()).filter((task) => workflow.tasks.some((assignment) => assignment.taskId === task.id));
            const completedTasks = workflowTasks.filter((task) => task.status === 'completed');
            const failedTasks = workflowTasks.filter((task) => task.status === 'failed');
            if (completedTasks.length === workflowTasks.length) {
                workflow.status = 'completed';
                workflow.completedAt = new Date();
                this.emit('workflow_completed', workflow);
                console.log(`🎉 Workflow completed: ${workflowId}`);
            }
            else if (failedTasks.length > 0) {
                workflow.status = 'failed';
                workflow.updatedAt = new Date();
                this.emit('workflow_failed', workflow);
                console.error(`💥 Workflow failed: ${workflowId}`);
            }
            else {
                workflow.currentStep = completedTasks.length;
                workflow.updatedAt = new Date();
                this.emit('workflow_progress', workflow);
            }
        }
    }
    /**
     * Get task by ID
     */
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    /**
     * Get workflow by ID
     */
    getWorkflow(workflowId) {
        return this.workflows.get(workflowId);
    }
    /**
     * Get all active tasks
     */
    getActiveTasks() {
        return Array.from(this.tasks.values()).filter((task) => ['assigned', 'in_progress'].includes(task.status));
    }
    /**
     * Get coordinator statistics
     */
    getStatistics() {
        const tasks = Array.from(this.tasks.values());
        const workflows = Array.from(this.workflows.values());
        return {
            totalTasks: tasks.length,
            pendingTasks: tasks.filter((t) => t.status === 'pending').length,
            activeTasks: tasks.filter((t) => ['assigned', 'in_progress'].includes(t.status)).length,
            completedTasks: tasks.filter((t) => t.status === 'completed').length,
            failedTasks: tasks.filter((t) => t.status === 'failed').length,
            totalWorkflows: workflows.length,
            activeWorkflows: workflows.filter((w) => w.status === 'in_progress').length,
            completedWorkflows: workflows.filter((w) => w.status === 'completed').length,
            queueSize: this.processingQueue.length,
        };
    }
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateWorkflowId() {
        return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.TaskCoordinator = TaskCoordinator;
// Global task coordinator instance
exports.globalTaskCoordinator = new TaskCoordinator();
