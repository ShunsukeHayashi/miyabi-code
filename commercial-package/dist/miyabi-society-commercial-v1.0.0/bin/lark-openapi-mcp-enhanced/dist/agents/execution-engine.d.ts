/**
 * Concurrent Task Execution Engine with Dependency Management
 * Based on AIstudio's concurrent execution patterns with enhanced dependency handling
 */
import { EventEmitter } from 'events';
import { Task } from './types';
export interface ExecutionNode {
    taskId: string;
    task: Task;
    dependencies: Set<string>;
    dependents: Set<string>;
    status: 'waiting' | 'ready' | 'executing' | 'completed' | 'failed';
    result?: any;
    error?: string;
    executionStartTime?: Date;
    executionEndTime?: Date;
    retryCount: number;
    maxRetries: number;
}
export interface ExecutionPlan {
    id: string;
    name: string;
    nodes: Map<string, ExecutionNode>;
    parallelGroups: string[][];
    criticalPath: string[];
    estimatedDuration: number;
    status: 'pending' | 'executing' | 'completed' | 'failed' | 'paused';
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export interface ConcurrencyConfig {
    maxConcurrentTasks: number;
    dependencyTimeout: number;
    retryDelay: number;
    enableAdaptiveConcurrency: boolean;
}
export declare class ExecutionEngine extends EventEmitter {
    private plans;
    private activeExecutions;
    private config;
    private readonly DEFAULT_MAX_CONCURRENT;
    private readonly DEPENDENCY_TIMEOUT_MS;
    private readonly RETRY_DELAY_MS;
    constructor(config?: Partial<ConcurrencyConfig>);
    /**
     * Create execution plan from tasks with dependency analysis
     */
    createExecutionPlan(name: string, tasks: Task[], options?: {
        maxRetries?: number;
        timeoutMs?: number;
    }): Promise<string>;
    /**
     * Execute plan with concurrent processing and dependency management
     */
    executePlan(planId: string): Promise<boolean>;
    /**
     * Execute a group of tasks concurrently with dependency checking
     */
    private executeTaskGroup;
    /**
     * Execute single task with retry logic
     */
    private executeTask;
    /**
     * Execute task with specific agent
     */
    private executeTaskWithAgent;
    /**
     * Check if task is ready for execution (all dependencies completed)
     */
    private isTaskReady;
    /**
     * Build dependency graph by connecting dependents
     */
    private buildDependencyGraph;
    /**
     * Analyze parallel execution groups using topological sorting
     */
    private analyzeParallelGroups;
    /**
     * Calculate critical path for execution time estimation
     */
    private calculateCriticalPath;
    /**
     * Estimate total execution time based on critical path
     */
    private estimateExecutionTime;
    /**
     * Find best available agent for task
     */
    private findBestAgentForTask;
    /**
     * Get recommended tools for task
     */
    private getRecommendedTools;
    /**
     * Get execution plan by ID
     */
    getExecutionPlan(planId: string): ExecutionPlan | undefined;
    /**
     * Get execution statistics
     */
    getStatistics(): {
        totalPlans: number;
        activePlans: number;
        completedPlans: number;
        failedPlans: number;
        activeExecutions: number;
        averageExecutionTime: number;
    };
    private calculateAverageExecutionTime;
    private delay;
    private generatePlanId;
    private generateMessageId;
}
export declare const globalExecutionEngine: ExecutionEngine;
