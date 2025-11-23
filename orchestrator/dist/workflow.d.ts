/**
 * Workflow State Machine
 *
 * Manages workflow transitions based on events and step definitions.
 */
import { StopEvent, Task, WorkflowDefinition } from "./types";
export declare class WorkflowEngine {
    private workflows;
    constructor(workflows: WorkflowDefinition[]);
    /**
     * Decide next task based on incoming event
     */
    decideNextTask(event: StopEvent): Task | null;
    private buildTask;
    /**
     * Load workflow definition from file
     */
    static loadFromYaml(yamlPath: string): WorkflowEngine;
}
//# sourceMappingURL=workflow.d.ts.map