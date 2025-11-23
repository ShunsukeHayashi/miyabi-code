/**
 * Webhook API Server
 *
 * Receives StopDetected events from VS Code extension,
 * verifies signature, checks idempotency, and enqueues tasks.
 */
import { OrchestratorConfig } from "./types";
import { WorkflowEngine } from "./workflow";
export declare class OrchestratorAPI {
    private app;
    private queue;
    private secret;
    private seen;
    private workflowEngine;
    constructor(config: OrchestratorConfig, workflowEngine: WorkflowEngine);
    private setupMiddleware;
    private setupRoutes;
    private handleWebhook;
    private verifySignature;
    start(port: number): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=api.d.ts.map