/**
 * Type definitions for Miyabi Orchestrator
 */
export interface StopEvent {
    type: "StopDetected";
    workflowId: string;
    runId: string;
    stepId: string;
    stopToken: string;
    source: string;
    files?: string[];
    meta?: Record<string, unknown>;
    ts: number;
    idempotencyKey: string;
}
export type TaskType = "shell" | "run_tests" | "build" | "create_pr" | "run_skill" | "noop";
export interface Task {
    type: TaskType;
    payload: Record<string, unknown>;
}
export interface WorkflowStep {
    id: string;
    on?: string;
    task?: string;
    command?: string;
    skill?: string;
    params?: any;
    next?: string;
    onSuccess?: string;
    onFailure?: string;
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
}
export interface OrchestratorConfig {
    port: number;
    secret: string;
    redis: {
        host: string;
        port: number;
    };
    workflows: WorkflowDefinition[];
}
//# sourceMappingURL=types.d.ts.map