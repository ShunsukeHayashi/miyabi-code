"use strict";
/**
 * Task Worker
 *
 * Processes tasks from the queue and executes them.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskWorker = void 0;
const bullmq_1 = require("bullmq");
const child_process_1 = require("child_process");
const util_1 = require("util");
const logger_1 = require("./logger");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class TaskWorker {
    constructor(config) {
        this.worker = new bullmq_1.Worker("miyabi-tasks", async (job) => {
            return await this.processJob(job);
        }, {
            connection: {
                host: config.redis.host,
                port: config.redis.port,
            },
            concurrency: 3, // Process up to 3 tasks concurrently
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.worker.on("completed", (job) => {
            logger_1.Logger.task("completed", job.name, job.id || undefined);
        });
        this.worker.on("failed", (job, err) => {
            logger_1.Logger.task("failed", job?.name || "unknown", job?.id || undefined);
            logger_1.Logger.debug("Failure details", { error: err.message });
        });
        this.worker.on("active", (job) => {
            logger_1.Logger.task("started", job.name, job.id || undefined);
        });
    }
    async processJob(job) {
        const { name, data } = job;
        logger_1.Logger.debug(`Processing job: ${name}`, data);
        switch (name) {
            case "shell":
                return await this.executeShellCommand(data);
            case "run_tests":
                return await this.runTests(data);
            case "build":
                return await this.build(data);
            case "create_pr":
                return await this.createPullRequest(data);
            case "run_skill":
                return await this.executeSkill(data);
            case "noop":
                logger_1.Logger.info("No operation task");
                return { status: "noop", note: "No operation" };
            default:
                logger_1.Logger.warn(`Unknown task type: ${name}`);
                return { status: "unknown", taskType: name };
        }
    }
    async executeShellCommand(data) {
        const { cmd, workflowId, stepId } = data;
        if (!cmd) {
            throw new Error("Shell command is required");
        }
        logger_1.Logger.activity(`Executing shell command`, cmd);
        try {
            const { stdout, stderr } = await execAsync(cmd, {
                cwd: process.cwd(),
                maxBuffer: 10 * 1024 * 1024, // 10MB
                timeout: 5 * 60 * 1000, // 5 minutes
            });
            logger_1.Logger.success(`Shell command completed`);
            if (stdout && process.env.DEBUG) {
                logger_1.Logger.debug("stdout", stdout.substring(0, 500));
            }
            return {
                status: "success",
                stdout: stdout.substring(0, 10000), // Limit output
                stderr: stderr.substring(0, 10000),
                workflowId,
                stepId,
            };
        }
        catch (error) {
            logger_1.Logger.error(`Shell command failed`, error);
            if (error.stderr) {
                logger_1.Logger.debug("stderr", error.stderr.substring(0, 500));
            }
            return {
                status: "failed",
                error: error.message,
                stdout: error.stdout?.substring(0, 1000),
                stderr: error.stderr?.substring(0, 1000),
                workflowId,
                stepId,
            };
        }
    }
    async runTests(data) {
        const { cmd = "cargo test --all", workflowId, stepId } = data;
        logger_1.Logger.info("Running tests", cmd);
        return await this.executeShellCommand({ cmd, workflowId, stepId });
    }
    async build(data) {
        const { cmd = "cargo build --release", workflowId, stepId } = data;
        logger_1.Logger.info("Building project", cmd);
        return await this.executeShellCommand({ cmd, workflowId, stepId });
    }
    async createPullRequest(data) {
        const { workflowId, stepId } = data;
        logger_1.Logger.info("Creating pull request", `Workflow: ${workflowId}`);
        // Placeholder for actual PR creation logic
        // In production, this would use GitHub API via `gh` CLI or Octokit
        const cmd = 'gh pr create --title "Auto PR" --body "Created by orchestrator"';
        return await this.executeShellCommand({ cmd, workflowId, stepId });
    }
    /**
     * Execute Miyabi Skill
     *
     * Executes a Claude Code Skill and returns the result.
     * Timeout: 10 minutes
     */
    async executeSkill(data) {
        const { skill, params = {}, workflowId, stepId } = data;
        if (!skill) {
            throw new Error("Skill name is required");
        }
        logger_1.Logger.activity(`Executing Miyabi Skill: ${skill}`, params);
        try {
            // Build skill execution command
            // Note: This assumes Claude Code CLI supports skill execution
            // Format: claude skill execute <skill-name> --params '<json>'
            const paramsJson = JSON.stringify(params).replace(/'/g, "'\\''");
            const cmd = `claude skill execute ${skill} --params '${paramsJson}'`;
            const { stdout, stderr } = await execAsync(cmd, {
                cwd: process.cwd(),
                maxBuffer: 10 * 1024 * 1024, // 10MB
                timeout: 10 * 60 * 1000, // 10 minutes
            });
            logger_1.Logger.success(`Skill ${skill} completed`);
            // Parse skill result
            let result;
            try {
                result = JSON.parse(stdout);
            }
            catch {
                // If not JSON, return raw output
                result = { output: stdout };
            }
            return {
                status: "success",
                skill,
                result,
                stdout: stdout.substring(0, 10000),
                stderr: stderr.substring(0, 1000),
                workflowId,
                stepId,
            };
        }
        catch (error) {
            logger_1.Logger.error(`Skill ${skill} failed`, error);
            return {
                status: "failed",
                skill,
                error: error.message,
                stdout: error.stdout?.substring(0, 1000),
                stderr: error.stderr?.substring(0, 1000),
                workflowId,
                stepId,
            };
        }
    }
    async close() {
        await this.worker.close();
    }
}
exports.TaskWorker = TaskWorker;
// Standalone worker script
if (require.main === module) {
    const config = {
        port: 8787,
        secret: process.env.STOPSEQ_SECRET || "dev-secret",
        redis: {
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: parseInt(process.env.REDIS_PORT || "6379"),
        },
        workflows: [],
    };
    logger_1.Logger.box("Task Worker", "Starting Miyabi task worker...", "info");
    const worker = new TaskWorker(config);
    process.on("SIGTERM", async () => {
        logger_1.Logger.warn("Shutting down worker gracefully...");
        await worker.close();
        process.exit(0);
    });
}
//# sourceMappingURL=worker.js.map