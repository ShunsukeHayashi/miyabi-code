"use strict";
/**
 * Workflow State Machine
 *
 * Manages workflow transitions based on events and step definitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEngine = void 0;
class WorkflowEngine {
    constructor(workflows) {
        this.workflows = new Map();
        workflows.forEach((wf) => {
            this.workflows.set(wf.id, wf);
        });
    }
    /**
     * Decide next task based on incoming event
     */
    decideNextTask(event) {
        const workflow = this.workflows.get(event.workflowId);
        if (!workflow) {
            console.warn(`Workflow not found: ${event.workflowId}`);
            return null;
        }
        // Find current step
        const currentStep = workflow.steps.find((s) => s.id === event.stepId);
        if (!currentStep) {
            console.warn(`Step not found: ${event.stepId} in workflow ${event.workflowId}`);
            return null;
        }
        // Find next step
        const nextStepId = currentStep.next || currentStep.onSuccess;
        if (!nextStepId) {
            console.log(`No next step defined for ${event.stepId}`);
            return null;
        }
        const nextStep = workflow.steps.find((s) => s.id === nextStepId);
        if (!nextStep) {
            console.warn(`Next step not found: ${nextStepId}`);
            return null;
        }
        // Build task payload
        return this.buildTask(nextStep, event);
    }
    buildTask(step, event) {
        if (step.task === "shell" && step.command) {
            return {
                type: "shell",
                payload: {
                    cmd: step.command,
                    workflowId: event.workflowId,
                    stepId: step.id,
                },
            };
        }
        if (step.task === "run_skill" && step.skill) {
            return {
                type: "run_skill",
                payload: {
                    skill: step.skill,
                    params: step.params || {},
                    workflowId: event.workflowId,
                    stepId: step.id,
                },
            };
        }
        if (step.task === "github.createPullRequest") {
            return {
                type: "create_pr",
                payload: {
                    workflowId: event.workflowId,
                    stepId: step.id,
                },
            };
        }
        // Default noop
        return {
            type: "noop",
            payload: {
                stepId: step.id,
            },
        };
    }
    /**
     * Load workflow definition from file
     */
    static loadFromYaml(yamlPath) {
        const yaml = require("js-yaml");
        const fs = require("fs");
        try {
            const doc = yaml.load(fs.readFileSync(yamlPath, "utf8"));
            return new WorkflowEngine([doc]);
        }
        catch (e) {
            console.error(`Failed to load workflow from ${yamlPath}:`, e);
            throw e;
        }
    }
}
exports.WorkflowEngine = WorkflowEngine;
//# sourceMappingURL=workflow.js.map