/**
 * Task Distribution and Coordination Mechanism
 * Based on AIstudio's workflow orchestration patterns with enhanced multi-agent capabilities
 */
import { EventEmitter } from 'events';
import { WorkflowState } from './types';
export interface Task {
    id: string;
    name: string;
    description: string;
    type: 'simple' | 'complex' | 'parallel' | 'sequential';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    requiredCapabilities: string[];
    dependencies?: string[];
    estimatedDuration?: number;
    context: Record<string, any>;
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    assignedAgentId?: string;
    result?: any;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export interface TaskDistributionStrategy {
    type: 'round_robin' | 'load_balanced' | 'capability_optimized' | 'priority_based';
    maxConcurrentTasks?: number;
    retryAttempts?: number;
    timeoutMs?: number;
}
export declare class TaskCoordinator extends EventEmitter {
    private tasks;
    private workflows;
    private strategy;
    private isProcessing;
    private processingQueue;
    private readonly CONCURRENT_TASK_LIMIT;
    private readonly MAX_RETRY_ATTEMPTS;
    private readonly TASK_TIMEOUT_MS;
    constructor(strategy?: TaskDistributionStrategy);
    /**
     * Create and distribute a new task
     */
    createTask(taskData: Omit<Task, 'id' | 'status' | 'createdAt'>): Promise<string>;
    /**
     * Create workflow with multiple tasks
     */
    createWorkflow(name: string, tasks: Omit<Task, 'id' | 'status' | 'createdAt'>[], context?: Record<string, any>): Promise<string>;
    /**
     * Process task queue with intelligent distribution
     */
    private processTaskQueue;
    /**
     * Distribute task to best available agent
     */
    private distributeTask;
    /**
     * Find best agent for task using AIstudio patterns
     */
    private findBestAgentForTask;
    /**
     * Get recommended tools for task based on capabilities
     */
    private getRecommendedTools;
    /**
     * Check if task dependencies are completed
     */
    private areDependenciesCompleted;
    /**
     * Handle task completion from agent
     */
    handleTaskCompletion(taskId: string, result: any, agentId: string): Promise<void>;
    /**
     * Handle task failure from agent
     */
    handleTaskFailure(taskId: string, error: string, agentId: string): Promise<void>;
    /**
     * Start task timeout monitoring
     */
    private startTaskTimeout;
    /**
     * Determine if task should be retried
     */
    private shouldRetryTask;
    /**
     * Retry failed task
     */
    private retryTask;
    /**
     * Handle agent going offline
     */
    private handleAgentOffline;
    /**
     * Check workflow completion status
     */
    private checkWorkflowCompletion;
    /**
     * Get task by ID
     */
    getTask(taskId: string): Task | undefined;
    /**
     * Get workflow by ID
     */
    getWorkflow(workflowId: string): WorkflowState | undefined;
    /**
     * Get all active tasks
     */
    getActiveTasks(): Task[];
    /**
     * Get coordinator statistics
     */
    getStatistics(): {
        totalTasks: number;
        pendingTasks: number;
        activeTasks: number;
        completedTasks: number;
        failedTasks: number;
        totalWorkflows: number;
        activeWorkflows: number;
        completedWorkflows: number;
        queueSize: number;
    };
    private generateTaskId;
    private generateWorkflowId;
    private generateMessageId;
}
export declare const globalTaskCoordinator: TaskCoordinator;
