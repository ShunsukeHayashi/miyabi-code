/**
 * Task Worker
 *
 * Processes tasks from the queue and executes them.
 */
import { OrchestratorConfig } from "./types";
export declare class TaskWorker {
    private worker;
    constructor(config: OrchestratorConfig);
    private setupEventHandlers;
    private processJob;
    private executeShellCommand;
    private runTests;
    private build;
    private createPullRequest;
    /**
     * Execute Miyabi Skill
     *
     * Executes a Claude Code Skill and returns the result.
     * Timeout: 10 minutes
     */
    private executeSkill;
    close(): Promise<void>;
}
//# sourceMappingURL=worker.d.ts.map